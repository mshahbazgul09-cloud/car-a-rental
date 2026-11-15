import { useCallback, useEffect, useState } from "react";
import { CalendarX2, Loader2, AlertCircle } from "lucide-react";
import Container from "../components/ui/Container.jsx";
import Button from "../components/ui/Button.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { cancelBooking, getMyBookings } from "../lib/api.js";
import { formatDate, formatMoney } from "../utils/pricing.js";

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(null); // null = loading
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setError("");
    return getMyBookings()
      .then(setBookings)
      .catch((err) => {
        setBookings([]);
        setError(err.message);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onCancel = async (b) => {
    if (!window.confirm(`Cancel your booking for ${b.car_name}?`)) return;
    setBusyId(b.id);
    setError("");
    try {
      await cancelBooking(b.id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="min-h-screen bg-ink pb-24 pt-32 text-white">
      <Container>
        <PageHeader eyebrow="My account" title="My" accent="Bookings" subtitle={user ? `Signed in as ${user.name}.` : undefined} />

        {error && (
          <div role="alert" className="mt-8 flex items-start gap-3 rounded-xl border border-brand/40 bg-brand/10 p-4 text-sm">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-brand" /> {error}
          </div>
        )}

        {bookings === null && (
          <div className="mt-12 flex justify-center">
            <Loader2 className="animate-spin text-brand" size={32} />
          </div>
        )}

        {bookings && bookings.length === 0 && !error && (
          <div className="mx-auto mt-12 max-w-md rounded-3xl border border-white/10 bg-charcoal p-10 text-center">
            <CalendarX2 size={40} className="mx-auto text-brand" />
            <h2 className="mt-4 text-xl font-bold">No bookings yet</h2>
            <p className="mt-2 text-sm text-white/60">When you book a car it will appear here.</p>
            <Button to="/cars" className="mt-6">Browse cars</Button>
          </div>
        )}

        {bookings && bookings.length > 0 && (
          <ul className="mt-10 space-y-5">
            {bookings.map((b) => (
              <li key={b.id} className="rounded-3xl border border-white/10 bg-charcoal p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{b.car_name}</h2>
                    <p className="text-xs uppercase tracking-wider text-white/40">Ref {b.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-4">
                  <Info label="Pickup" value={formatDate(b.pickup_date)} />
                  <Info label="Return" value={formatDate(b.return_date)} />
                  <Info label="Location" value={b.pickup_location} />
                  <Info label={`Total (${b.rental_days} ${b.rental_days === 1 ? "day" : "days"})`} value={formatMoney(b.total_price)} strong />
                </dl>

                {b.status !== "cancelled" && (
                  <div className="mt-5 border-t border-white/10 pt-5">
                    <Button variant="outlineLight" size="sm" onClick={() => onCancel(b)} disabled={busyId === b.id}>
                      {busyId === b.id ? "Cancelling..." : "Cancel booking"}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}

function Info({ label, value, strong }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-white/40">{label}</dt>
      <dd className={strong ? "mt-1 text-lg font-extrabold text-brand" : "mt-1 font-medium"}>{value}</dd>
    </div>
  );
}
