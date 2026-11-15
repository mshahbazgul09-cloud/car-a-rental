import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Car, Phone, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import Container from "../ui/Container.jsx";
import Button from "../ui/Button.jsx";
import { site, navLinks } from "../../config/site.js";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { user, isAdmin, logout } = useAuth();

  // Transparent over the hero, solid black once the page is scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Lock page scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid ? "border-b border-white/10 bg-ink/95 shadow-lg shadow-black/30 backdrop-blur" : "bg-transparent"
      }`}
    >
      <Container className={`flex items-center justify-between transition-all duration-300 ${solid ? "h-16" : "h-20"}`}>
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2.5 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-105">
            <Car size={22} />
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            {site.name.slice(0, 5)}
            <span className="text-brand">{site.name.slice(5)}</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-9 lg:flex" aria-label="Main">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `group relative py-2 text-sm font-medium tracking-wide transition-colors ${
                  isActive ? "text-white" : "text-white/70 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-0.5 bg-brand transition-all duration-300 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-6 lg:flex">
          <a
            href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}
            className="hidden items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white xl:flex"
          >
            <Phone size={16} className="text-brand" />
            {site.phone}
          </a>
          {user ? (
            <div className="flex items-center gap-5 text-sm font-medium">
              <Link to="/account/bookings" className="text-white/80 transition-colors hover:text-white">My Bookings</Link>
              {isAdmin && <Link to="/admin" className="text-white/80 transition-colors hover:text-white">Admin</Link>}
              <button onClick={logout} className="flex items-center gap-1.5 text-white/80 transition-colors hover:text-brand">
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-sm font-medium text-white/80 transition-colors hover:text-white">Login</Link>
          )}
          <Button to="/booking" size="sm">Book Now</Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </Container>

      {/* Mobile menu */}
      {open && (
        <div className="h-[calc(100dvh-4rem)] animate-menu-down overflow-y-auto border-t border-white/10 bg-ink lg:hidden">
          <Container className="flex flex-col gap-1 py-6">
            {navLinks.map((l, i) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                style={{ animationDelay: `${i * 60}ms` }}
                className={({ isActive }) =>
                  `animate-fade-up flex items-center justify-between border-b border-white/10 py-4 text-lg font-semibold transition-colors ${
                    isActive ? "text-brand" : "text-white hover:text-brand"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="mt-8 flex flex-col gap-4">
              {user ? (
                <>
                  <Link to="/account/bookings" className="py-2 text-center font-medium text-white/80">My Bookings</Link>
                  {isAdmin && <Link to="/admin" className="py-2 text-center font-medium text-white/80">Admin</Link>}
                  <button onClick={logout} className="flex items-center justify-center gap-2 py-2 font-medium text-white/80">
                    <LogOut size={18} /> Logout ({user.name})
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="py-2 text-center font-medium text-white/80">Login</Link>
                  <Link to="/register" className="py-2 text-center font-medium text-white/80">Create account</Link>
                </>
              )}
              <Button to="/booking" size="lg">Book Now</Button>
              <a
                href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}
                className="flex items-center justify-center gap-2 py-2 text-white/80"
              >
                <Phone size={18} className="text-brand" />
                {site.phone}
              </a>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
