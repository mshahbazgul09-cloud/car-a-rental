import { currency } from "../data/cars.js";

const MS_DAY = 86_400_000;

// Dates are handled as "YYYY-MM-DD" strings. Parsing as UTC avoids daylight-saving off-by-one errors.
const toUTC = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Rental days = return date minus pickup date. 0 if dates are missing or invalid. */
export function rentalDays(pickup, ret) {
  if (!pickup || !ret) return 0;
  const diff = Math.round((toUTC(ret) - toUTC(pickup)) / MS_DAY);
  return diff > 0 ? diff : 0;
}

export const calcTotal = (days, pricePerDay) => Math.round(days * pricePerDay * 100) / 100;

export function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const addDaysISO = (iso, n) => new Date(toUTC(iso) + n * MS_DAY).toISOString().slice(0, 10);

export const formatMoney = (n) =>
  `${currency}${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const formatDate = (iso) =>
  new Date(toUTC(iso)).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** [aStart, aEnd) overlaps [bStart, bEnd). The return day is free, matching the backend and database. */
export const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;
