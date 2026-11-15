import { AlertCircle } from "lucide-react";

/** Shared dark-theme input styling. Pass the field's error to get the red error state. */
export const inputClass = (error) =>
  `w-full rounded-xl border bg-ink px-4 py-3.5 text-white placeholder-white/30 outline-none transition-colors [color-scheme:dark] focus:border-brand focus:ring-2 focus:ring-brand/30 ${
    error ? "border-brand" : "border-white/15 hover:border-white/30"
  }`;

export default function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-white/80">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-brand-light">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="mt-2 text-xs text-white/40">{hint}</p>
      )}
    </div>
  );
}
