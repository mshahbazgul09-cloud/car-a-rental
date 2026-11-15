import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, CalendarX2, Check, Cog, Fuel, ImagePlus, Users } from "lucide-react";
import Container from "../components/ui/Container.jsx";
import Button from "../components/ui/Button.jsx";
import useCars from "../hooks/useCars.js";
import useTilt from "../hooks/useTilt.js";
import { getAvailability } from "../lib/api.js";
import { formatDate, formatMoney } from "../utils/pricing.js";

export default function CarDetails() {
  const { id } = useParams();
  const { cars, loading } = useCars();
  const car = cars.find((c) => c.id === id);

  const [booked, setBooked] = useState([]);
  const [imgFailed, setImgFailed] = useState(false);
  const { ref, handlers } = useTilt({ max: 5, scale: 1.01, lift: 4 });

  useEffect(() => {
    setImgFailed(false);
    let ignore = false;
    getAvailability(id)
      .then((d) => !ignore && setBooked(Array.isArray(d) ? d : []))
      .catch(() => !ignore && setBooked([]));
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return (
      <section className="min-h-screen bg-ink pt-32">
        <Container>
          <div className="h-96 animate-pulse rounded-3xl bg-white/5" />
        </Container>
      </section>
    );
  }

  if (!car) {
    return (
      <section className="flex min-h-screen items-center bg-ink pt-24 text-center text-white">
        <Container>
          <h1 className="text-3xl font-bold">Car not found</h1>
          <p className="mt-3 text-white/60">This car may no longer be available.</p>
          <Button to="/cars" className="mt-8">Browse all cars</Button>
        </Container>
      </section>
    );
  }

  const specs = [
    { icon: CalendarDays, label: "Year", value: car.year },
    { icon: Users, label: "Seats", value: car.seats },
    { icon: Cog, label: "Transmission", value: car.transmission },
    { icon: Fuel, label: "Fuel", value: car.fuel },
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-ink pb-24 pt-28 text-white">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-20 h-[32rem] w-[32rem] rounded-full bg-brand/15 blur-[140px]" />

      <Container className="relative">
        <Link to="/cars" className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white">
          <ArrowLeft size={16} /> All cars
        </Link>

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-2">
          {/* Image stage: tilts with the cursor, photo zooms on hover, mirrored reflection below */}
          <div className="animate-slide-in">
            <div
              ref={ref}
              {...handlers}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-charcoal shadow-[0_30px_60px_-20px_rgba(225,6,0,0.35)]"
            >
              {!imgFailed ? (
                <img
                  key={car.image}
                  src={car.image}
                  alt={`${car.name} ${car.model}`}
                  onError={() => setImgFailed(true)}
                  className="aspect-[1024/572] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="flex aspect-[1024/572] flex-col items-center justify-center gap-2 text-center">
                  <ImagePlus className="text-brand" size={36} />
                  <p className="text-sm text-white/60">
                    Add <code className="rounded bg-white/10 px-1">public{car.image}</code>
                  </p>
                </div>
              )}
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-ink/10" />
              <span className="absolute left-5 top-5 rounded-full bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-wider shadow-lg">
                {car.category}
              </span>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.1), transparent 60%)" }}
              />
            </div>

            {/* Floor reflection: the same photo, flipped and faded out */}
            {!imgFailed && (
              <div
                aria-hidden
                className="mx-auto -mt-px h-16 w-[96%] overflow-hidden rounded-b-3xl opacity-30"
                style={{ maskImage: "linear-gradient(to bottom, black, transparent)", WebkitMaskImage: "linear-gradient(to bottom, black, transparent)" }}
              >
                <img src={car.image} alt="" className="aspect-[1024/572] w-full -scale-y-100 object-cover" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="animate-fade-up">
            <p className="text-sm font-medium uppercase tracking-widest text-white/50">{car.name}</p>
            <h1 className="mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">{car.model}</h1>

            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-brand">{formatMoney(car.pricePerDay)}</span>
              <span className="text-white/50">/ day</span>
            </div>

            {car.description && <p className="mt-5 text-white/70">{car.description}</p>}

            <dl className="mt-8 grid grid-cols-2 gap-4">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-charcoal p-4">
                  <Icon size={20} className="text-brand" />
                  <dt className="mt-2 text-xs uppercase tracking-wider text-white/50">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            <Button to={`/booking?car=${car.id}`} size="lg" className="mt-8 w-full sm:w-auto">
              Book This Car
            </Button>
          </div>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {car.features.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-charcoal p-6 sm:p-8">
              <h2 className="text-xl font-bold">Features</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {car.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-white/80">
                    <Check size={18} className="shrink-0 text-brand" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-charcoal p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <CalendarX2 size={20} className="text-brand" /> Availability
            </h2>
            {booked.length === 0 ? (
              <p className="mt-5 text-white/70">No confirmed bookings. This car is open for any dates.</p>
            ) : (
              <>
                <p className="mt-5 text-sm text-white/60">Not available on:</p>
                <ul className="mt-3 space-y-2">
                  {booked.map((r) => (
                    <li key={`${r.pickup_date}-${r.return_date}`} className="rounded-xl bg-white/5 px-4 py-2 text-sm">
                      {formatDate(r.pickup_date)} to {formatDate(r.return_date)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
