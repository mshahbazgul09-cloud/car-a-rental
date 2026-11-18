import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import Container from "../components/ui/Container.jsx";
import Button from "../components/ui/Button.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import AdminChat from "../components/admin/AdminChat.jsx";
import { adminGetBookings, adminGetChats, adminUpdateBooking } from "../lib/api.js";
import { formatDate, formatMoney } from "../utils/pricing.js";

const TABS = ["all", "pending", "confirmed", "cancelled"];

export default function Admin() {
  const [bookings, setBookings] = useState(null);
  const [tab, setTab] = useState("pending");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [view, setView] = useState("bookings"); // "bookings" | "messages"
  const [chats, setChats] = useState(null);

  // Chats are checked every 8 seconds so the "new" count stays current on both views.
  const loadChats = useCallback(() => adminGetChats().then(setChats).catch(() => setChats((c) => c || [])), []);
  useEffect(() => {
    loadChats();
    const id = setInterval(loadChats, 8000);
    return () => clearInterval(id);
  }, [loadChats]);
  const newChats = (chats || []).filter((c) => c.admin_unread).length;

  const load = useCallback(() => {
    setError("");
    return adminGetBookings()
      .then(setBookings)
      .catch((err) => {
        setBookings([]);
        setError(err.message);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { all: 0, pending: 0, confirmed: 0, cancelled: 0 };
    (bookings || []).forEach((b) => {
      c.all += 1;
      c[b.status] += 1;
    });
    return c;
  }, [bookings]);

  const visible = (bookings || []).filter((b) => tab === "all" || b.status === tab);

  const act = async (b, status) => {
    if (status === "cancelled" && !window.confirm(`Cancel the booking for ${b.customer_name} (${b.car_name})?`)) return;
    setBusyId(b.id);
    setError("");
    try {
      await adminUpdateBooking(b.id, status);
      await load();
    } catch (err) {
      setError(err.message); // e.g. "Cannot confirm: it overlaps another confirmed booking for this car."
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="min-h-screen bg-ink pb-24 pt-32 text-white">
      <Container>
        <PageHeader eyebrow="Admin" title="Manage" accent="Bookings" subtitle="Confirm or cancel booking requests, and reply to live chat messages." />

        <div className="mt-10 flex gap-2 border-b border-white/10">
          {[
            ["bookings", "Bookings"],
            ["messages", newChats ? `Messages (${newChats} new)` : "Messages"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-pressed={view === key}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                view === key ? "border-brand text-white" : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === "messages" ? (
          <AdminChat chats={chats} reloadChats={loadChats} />
        ) : (
        <>
        <div className="mt-8 flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                tab === t ? "border-brand bg-brand text-white" : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"
              }`}
            >
              {t} ({counts[t]})
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-brand/40 bg-brand/10 p-4 text-sm">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-brand" /> {error}
          </div>
        )}

        {bookings === null ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="animate-spin text-brand" size={32} />
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-12 text-center text-white/50">No {tab === "all" ? "" : tab} bookings.</p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-3xl border border-white/10 bg-charcoal">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Car</th>
                  <th className="px-5 py-4">Dates</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visible.map((b) => (
                  <tr key={b.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-semibold">{b.customer_name}</p>
                      <p className="text-white/50">{b.phone}</p>
                      {!b.user_id && <p className="text-xs text-white/30">Guest</p>}
                    </td>
                    <td className="px-5 py-4">{b.car_name}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {formatDate(b.pickup_date)} to {formatDate(b.return_date)}
                      <p className="text-white/40">{b.rental_days} {b.rental_days === 1 ? "day" : "days"}</p>
                    </td>
                    <td className="px-5 py-4">{b.pickup_location}</td>
                    <td className="px-5 py-4 font-bold text-brand">{formatMoney(b.total_price)}</td>
                    <td className="px-5 py-4"><StatusBadge status={b.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {b.status === "pending" && (
                          <Button size="sm" disabled={busyId === b.id} onClick={() => act(b, "confirmed")}>Confirm</Button>
                        )}
                        {b.status !== "cancelled" && (
                          <Button size="sm" variant="outlineLight" disabled={busyId === b.id} onClick={() => act(b, "cancelled")}>Cancel</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </>
        )}
      </Container>
    </section>
  );
}
