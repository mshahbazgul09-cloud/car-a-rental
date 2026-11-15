const styles = {
  pending: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  confirmed: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  cancelled: "border-white/20 bg-white/5 text-white/50",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold capitalize ${styles[status] || styles.cancelled}`}>
      {status}
    </span>
  );
}
