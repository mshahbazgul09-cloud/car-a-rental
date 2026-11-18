import { Link } from "react-router-dom";
import Container from "../ui/Container.jsx";
import { site, navLinks } from "../../config/site.js";

export default function Footer() {
  return (
    <footer className="bg-ink text-white/70">
      <Container className="grid gap-10 py-14 md:grid-cols-3">
        <div>
          <p className="text-xl font-bold text-white">{site.name}</p>
          <p className="mt-3 max-w-xs text-sm">{site.tagline}</p>
        </div>

        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">Quick Links</p>
          <ul className="space-y-2 text-sm">
            {navLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-brand">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">Contact</p>
          <ul className="space-y-2 text-sm">
            <li><a href={site.phoneHref} className="transition-colors hover:text-brand">{site.phone}</a></li>
            <li><a href={`mailto:${site.email}`} className="transition-colors hover:text-brand">{site.email}</a></li>
            <li>{site.address}</li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10 py-5 text-center text-xs">
        &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}
