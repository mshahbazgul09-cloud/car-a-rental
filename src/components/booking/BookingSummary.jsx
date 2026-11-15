import { useState } from "react";
import { CalendarX2, Car } from "lucide-react";
import { formatDate, formatMoney } from "../../utils/pricing.js";

export default function BookingSummary({ car, values, days, total, booked }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <aside className="sticky top-24 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-graphite to-charcoal shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]">
      <div className="relative aspect-[1024/572] overflow-hidden bg-charcoal">
        {car && !imgFailed ? (
          <img
            key={car.id}
            src={car.image}
            alt={`${car.name} ${car.model}`}
            onError={() => setImgFailed(true)}
            className="animate-fade-in h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/20">
            <Car size={56} />
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent" />
      </div>

      <div className="p-6">
        {car ? (
          <>
            <p className="text-sm uppercase tracking-widest text-white/50">{car.name}</p>
            <h3 className="text-xl font-bold text-white">{car.model}</h3>
          </>
        ) : (
          <p className="text-white/50">Select a car to see your price.</p>
        )}

        <dl className="mt-6 space-y-3 border-t border-white/10 pt-6 text-sm">
          <Row label="Daily rate" value={car ? formatMoney(car.pricePerDay) : "-"} />
          <Row label="Pickup" value={values.pickupDate ? formatDate(values.pickupDate) : "-"} />
          <Row label="Return" value={values.returnDate ? formatDate(values.returnDate) : "-"} />
          <Row label="Rental days" value={days || "-"} />
        </dl>

        <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-6">
          <span className="text-white/60">Estimated total</span>
          <span className="text-3xl font-extrabold text-brand" aria-live="polite">
            {days && car ? formatMoney(total) : "-"}
          </span>
        </div>
        <p className="mt-2 text-xs text-white/40">The final price is confirmed by our system when you submit.</p>

        {booked.length > 0 && (
          <div className="mt-6 rounded-xl border border-brand/30 bg-brand/10 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <CalendarX2 size={16} className="text-brand" /> Not available on
            </p>
            <ul className="space-y-1 text-sm text-white/70">
              {booked.map((r) => (
                <li key={`${r.pickup_date}-${r.return_date}`}>
                  {formatDate(r.pickup_date)} to {formatDate(r.return_date)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-white/60">{label}</dt>
      <dd className="font-medium text-white">{value}</dd>
    </div>
  );
}
