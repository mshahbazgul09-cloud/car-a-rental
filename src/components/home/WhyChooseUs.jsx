import { Clock, LifeBuoy, ShieldCheck, Tag } from "lucide-react";
import Container from "../ui/Container.jsx";
import SectionHeading from "../ui/SectionHeading.jsx";
import { reasons } from "../../data/services.js";

const icons = { tag: Tag, shield: ShieldCheck, clock: Clock, support: LifeBuoy };

export default function WhyChooseUs() {
  return (
    <section className="bg-ink py-24 text-white">
      <Container>
        <SectionHeading light eyebrow="Why us" title="Rent With Confidence" subtitle="Simple, honest and built around you." />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((r) => {
            const Icon = icons[r.icon] || Tag;
            return (
              <div key={r.title} className="rounded-3xl border border-white/10 bg-charcoal p-7 text-center transition-colors duration-300 hover:border-brand/40">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                  <Icon size={26} />
                </span>
                <h3 className="mt-5 font-bold">{r.title}</h3>
                <p className="mt-2 text-sm text-white/60">{r.text}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
