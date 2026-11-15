/** Title block for inner pages. `accent` is shown in red after the title. */
export default function PageHeader({ eyebrow, title, accent, subtitle, className = "" }) {
  return (
    <div className={`animate-fade-up max-w-2xl ${className}`}>
      {eyebrow && <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>}
      <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        {title} {accent && <span className="text-brand">{accent}</span>}
      </h1>
      {subtitle && <p className="mt-4 text-white/70">{subtitle}</p>}
    </div>
  );
}
