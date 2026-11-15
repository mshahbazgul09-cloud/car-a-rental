import Container from "../ui/Container.jsx";
import Button from "../ui/Button.jsx";
import SectionHeading from "../ui/SectionHeading.jsx";
import CarCard from "../cars/CarCard.jsx";
import useCars from "../../hooks/useCars.js";

export default function CarShowcase() {
  const { cars, loading } = useCars();
  const featured = cars.slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-charcoal py-24 text-white">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />

      <Container className="relative">
        <SectionHeading
          light
          eyebrow="Our Fleet"
          title="Choose Your Perfect Ride"
          subtitle="Hand-picked vehicles, maintained to the highest standard and ready when you are."
        />

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? [0, 1, 2].map((i) => <div key={i} className="h-[28rem] animate-pulse rounded-3xl bg-white/5" />)
            : featured.map((car) => <CarCard key={car.id} car={car} />)}
        </div>

        <div className="mt-14 text-center">
          <Button to="/cars" variant="outlineLight" size="lg">
            View All Cars
          </Button>
        </div>
      </Container>
    </section>
  );
}
