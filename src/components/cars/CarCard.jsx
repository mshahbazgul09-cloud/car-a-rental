import { useState } from "react";
import { ImagePlus, Users, Cog, Fuel } from "lucide-react";
import Button from "../ui/Button.jsx";
import useTilt from "../../hooks/useTilt.js";
import { currency } from "../../data/cars.js";

export default function CarCard({ car }) {
  const { ref, handlers } = useTilt({ max: 7, scale: 1.02, lift: 8 });
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <article
      ref={ref}
      {...handlers}
      style={{ willChange: "transform" }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-graphite to-ink shadow-[0_25px_50px_-20px_rgba(0,0,0,0.95)] transition-shadow duration-500 hover:border-brand/40 hover:shadow-[0_35px_70px_-20px_rgba(225,6,0,0.45)]"
    >
      {/* Photo: the frame has the photo's own ratio, so it is never stretched or cropped */}
      <div className="relative aspect-[1024/572] overflow-hidden bg-charcoal">
        {!imgFailed ? (
          <img
            src={car.image}
            alt={`${car.name} ${car.model}`}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-white/60">
            <ImagePlus className="text-brand" size={30} />
            Add <code className="rounded bg-white/10 px-1">public{car.image}</code>
          </div>
        )}

        {/* Lighting: dark base, plus a light sweep across the paint on hover */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/20" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/4 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[550%]"
        />

        <span className="absolute left-4 top-4 rounded-full bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-lg">
          {car.category}
        </span>
        <div className="absolute bottom-3 right-4 rounded-2xl border border-white/15 bg-ink/70 px-4 py-2 text-right backdrop-blur-md">
          <span className="text-2xl font-extrabold text-white">
            {currency}
            {car.pricePerDay}
          </span>
          <span className="text-xs text-white/60"> / day</span>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm font-medium uppercase tracking-widest text-white/50">{car.name}</p>
        <h3 className="mt-1 text-2xl font-bold text-white">{car.model}</h3>

        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
          <li className="flex items-center gap-1.5"><Users size={15} className="text-brand" />{car.seats} seats</li>
          <li className="flex items-center gap-1.5"><Cog size={15} className="text-brand" />{car.transmission}</li>
          <li className="flex items-center gap-1.5"><Fuel size={15} className="text-brand" />{car.fuel}</li>
        </ul>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button to={`/cars/${car.id}`} variant="outlineLight" size="sm">
            View Details
          </Button>
          <Button to={`/booking?car=${car.id}`} size="sm">
            Book Now
          </Button>
        </div>
      </div>

      {/* Cursor-following light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.1), transparent 60%)",
        }}
      />
    </article>
  );
}
