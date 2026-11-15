import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SearchX } from "lucide-react";
import Container from "../components/ui/Container.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import { inputClass } from "../components/ui/Field.jsx";
import CarCard from "../components/cars/CarCard.jsx";
import useCars from "../hooks/useCars.js";
import { categoriesOf, filterCars } from "../utils/carFilters.js";
import { currency } from "../data/cars.js";

export default function Cars() {
  const { cars, loading } = useCars();
  const [params] = useSearchParams();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState(params.get("category") || "All");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("featured");

  const categories = useMemo(() => categoriesOf(cars), [cars]);
  const priceCeiling = useMemo(() => Math.max(0, ...cars.map((c) => c.pricePerDay)), [cars]);
  const results = useMemo(() => filterCars(cars, { q, category, maxPrice, sort }), [cars, q, category, maxPrice, sort]);

  const clear = () => {
    setQ("");
    setCategory("All");
    setMaxPrice("");
    setSort("featured");
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-ink pb-24 pt-32 text-white">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-40 h-[28rem] w-[28rem] rounded-full bg-brand/10 blur-[140px]" />

      <Container className="relative">
        <PageHeader eyebrow="Our Fleet" title="Find Your" accent="Perfect Car" subtitle="Filter by type and budget, then book in minutes." />

        {/* Filters */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-charcoal p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="search"
                aria-label="Search cars"
                placeholder="Search by brand or model..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className={`${inputClass(false)} pl-11`}
              />
            </div>

            <div>
              <label htmlFor="maxPrice" className="sr-only">Maximum price per day</label>
              <input
                id="maxPrice"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder={`Max ${currency}/day${priceCeiling ? ` (up to ${priceCeiling})` : ""}`}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className={`${inputClass(false)} md:w-56`}
              />
            </div>

            <div>
              <label htmlFor="sort" className="sr-only">Sort cars</label>
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)} className={`${inputClass(false)} md:w-52`}>
                <option value="featured">Featured</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Car category">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  category === c ? "border-brand bg-brand text-white" : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-8 text-sm text-white/50" aria-live="polite">
          {loading ? "Loading cars..." : `${results.length} ${results.length === 1 ? "car" : "cars"} found`}
        </p>

        {/* Results */}
        <div className="mt-4 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? [0, 1, 2].map((i) => <div key={i} className="h-[28rem] animate-pulse rounded-3xl bg-white/5" />)
            : results.map((car) => <CarCard key={car.id} car={car} />)}
        </div>

        {!loading && results.length === 0 && (
          <div className="mx-auto mt-10 max-w-md rounded-3xl border border-white/10 bg-charcoal p-10 text-center">
            <SearchX size={40} className="mx-auto text-brand" />
            <h2 className="mt-4 text-xl font-bold">No cars match your filters</h2>
            <p className="mt-2 text-sm text-white/60">Try a different search or a higher budget.</p>
            <Button onClick={clear} className="mt-6">Clear filters</Button>
          </div>
        )}
      </Container>
    </section>
  );
}
