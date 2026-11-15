import { Briefcase, CalendarRange, LifeBuoy, Plane, Truck, UserRound } from "lucide-react";
import Container from "../components/ui/Container.jsx";
import Button from "../components/ui/Button.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { services } from "../data/services.js";

const icons = { plane: Plane, truck: Truck, calendar: CalendarRange, driver: UserRound, briefcase: Briefcase, support: LifeBuoy };

export default function Services() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-ink pb-24 pt-32 text-white">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-40 h-[28rem] w-[28rem] rounded-full bg-brand/10 blur-[140px]" />
      <Container className="relative">
        <PageHeader eyebrow="What we offer" title="Our" accent="Services" subtitle="More than a car. Everything you need for a smooth trip." />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const Icon = icons[s.icon] || LifeBuoy;
            return (
              <article key={s.title} className="group rounded-3xl border border-white/10 bg-charcoal p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_20px_50px_-15px_rgba(225,6,0,0.3)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                  <Icon size={24} />
                </span>
                <h2 className="mt-5 text-lg font-bold">{s.title}</h2>
                <p className="mt-2 text-sm text-white/60">{s.text}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <Button to="/booking" size="lg">Book Now</Button>
        </div>
      </Container>
    </section>
  );
}
