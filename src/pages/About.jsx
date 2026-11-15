import { Gauge, Handshake, ShieldCheck } from "lucide-react";
import Container from "../components/ui/Container.jsx";
import Button from "../components/ui/Button.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { site } from "../config/site.js";

// PLACEHOLDER copy. Replace the text below with your real story.
const values = [
  { icon: ShieldCheck, title: "Safety first", text: "Every car is inspected and serviced to a high standard before it reaches you." },
  { icon: Handshake, title: "Honest service", text: "Clear prices, clear terms and no surprises when you return the keys." },
  { icon: Gauge, title: "Quality fleet", text: "A carefully chosen range of vehicles for every trip and every budget." },
];

export default function About() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-ink pb-24 pt-32 text-white">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-40 h-[28rem] w-[28rem] rounded-full bg-brand/10 blur-[140px]" />
      <Container className="relative">
        <PageHeader eyebrow="About us" title="Driving you" accent="forward" />

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div className="space-y-5 text-white/70">
            <p>
              {site.name} makes renting a car simple. We offer a hand-picked fleet, fair prices and friendly
              support, so you can focus on where you are going instead of how you are getting there.
            </p>
            <p>
              Whether it is a business trip, a family holiday or a weekend in something special, we will have
              the right car ready for you.
            </p>
            <p className="text-sm text-white/40">(This text is a placeholder. Edit it in src/pages/About.jsx.)</p>
          </div>

          <div className="grid gap-4">
            <img
              src={site.showroomImage}
              alt={`${site.name} showroom`}
              loading="lazy"
              onError={(e) => (e.currentTarget.hidden = true)}
              className="aspect-[1024/572] w-full rounded-3xl border border-white/10 object-cover shadow-[0_30px_60px_-20px_rgba(225,6,0,0.35)] transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.02]"
            />
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-charcoal p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <Icon size={22} />
                </span>
                <div>
                  <h2 className="font-bold">{title}</h2>
                  <p className="mt-1 text-sm text-white/60">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-wrap gap-4">
          <Button to="/cars" size="lg">View Our Cars</Button>
          <Button to="/contact" size="lg" variant="outlineLight">Contact Us</Button>
        </div>
      </Container>
    </section>
  );
}
