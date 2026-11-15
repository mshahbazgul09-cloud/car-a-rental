import Container from "../ui/Container.jsx";
import Button from "../ui/Button.jsx";
import SectionHeading from "../ui/SectionHeading.jsx";
import { steps } from "../../data/services.js";
import { site } from "../../config/site.js";

export default function HowItWorks() {
  return (
    <>
      <section className="bg-white py-24">
        <Container>
          <SectionHeading eyebrow="How it works" title="Book in Three Easy Steps" />
          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="relative text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink text-2xl font-extrabold text-white ring-4 ring-brand/30">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-graphite/70">{s.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="relative overflow-hidden bg-ink py-24 text-white">
        <img src={site.showroomImage} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={(e) => (e.currentTarget.hidden = true)} />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ink/90 via-ink/70 to-brand/80" />
        <Container className="relative text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to hit the road?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">Pick your car and book in minutes.</p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button to="/booking" variant="dark" size="lg">Book Now</Button>
            <Button to="/cars" variant="outlineLight" size="lg">Browse Cars</Button>
          </div>
        </Container>
      </section>
    </>
  );
}
