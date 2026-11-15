import { useState } from "react";
import { ArrowRight, ShieldCheck, Clock, Car } from "lucide-react";
import Container from "../ui/Container.jsx";
import Button from "../ui/Button.jsx";
import { site } from "../../config/site.js";

const stats = [
  { value: "150+", label: "Premium Cars" },
  { value: "24/7", label: "Support" },
  { value: "10K+", label: "Happy Clients" },
];

const perks = [
  { icon: ShieldCheck, text: "Fully insured" },
  { icon: Clock, text: "Free cancellation" },
  { icon: Car, text: "Delivery to your door" },
];

export default function Hero() {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section className="relative overflow-hidden bg-ink text-white">
      {/* Your photo: full background on desktop, a band at the top on mobile. Ratio is kept (object-cover). */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[75vw] overflow-hidden lg:inset-0 lg:h-auto">
        {!imgFailed && (
          <img
            src={site.heroImage}
            alt=""
            loading="eager"
            fetchPriority="high"
            onError={() => setImgFailed(true)}
            className="animate-kenburns h-full w-full object-cover object-right"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/40 lg:bg-gradient-to-r lg:from-ink lg:via-ink/75 lg:to-ink/10" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink to-transparent" />
        <div className="absolute -right-40 top-1/4 h-[30rem] w-[30rem] rounded-full bg-brand/20 blur-[140px]" />
      </div>

      <Container className="relative flex min-h-screen items-center pb-16 pt-[62vw] lg:pt-28">
        {/* Text */}
        <div className="max-w-xl">
          <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
            Premium Car Rental
          </span>

          <h1
            className="animate-fade-up mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl xl:text-7xl"
            style={{ animationDelay: "100ms" }}
          >
            Drive the <span className="text-brand">Extraordinary.</span>
            <br />
            Rent Your Dream Car.
          </h1>

          <p
            className="animate-fade-up mt-6 max-w-lg text-base text-white/70 sm:text-lg"
            style={{ animationDelay: "200ms" }}
          >
            Luxury, SUVs and everyday rides at honest prices. Simple booking, spotless cars and
            service that is there whenever you need it.
          </p>

          <div
            className="animate-fade-up mt-8 flex flex-col gap-4 sm:flex-row"
            style={{ animationDelay: "300ms" }}
          >
            <Button to="/cars" size="lg" className="group">
              Browse Cars
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
            <Button to="/contact" size="lg" variant="outlineLight">
              Contact Us
            </Button>
          </div>

          <ul
            className="animate-fade-up mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/70"
            style={{ animationDelay: "400ms" }}
          >
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon size={16} className="text-brand" />
                {text}
              </li>
            ))}
          </ul>

          <dl
            className="animate-fade-up mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-8"
            style={{ animationDelay: "500ms" }}
          >
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-2xl font-extrabold text-white sm:text-3xl">{s.value}</dt>
                <dd className="mt-1 text-xs uppercase tracking-wider text-white/50">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>

      {/* Bottom red accent line */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />
    </section>
  );
}
