import { rentalDays, rangesOverlap, todayISO } from "./pricing.js";

export const MAX_RENTAL_DAYS = 90;
const PHONE_RE = /^\+?[\d\s\-().]+$/;

/**
 * Validates the booking form. Returns an object of { fieldName: "message" }.
 * An empty object means the form is valid.
 * `booked` = confirmed ranges for the selected car: [{ pickup_date, return_date }]
 * The server repeats every one of these checks.
 */
export function validateBooking(v, booked = []) {
  const e = {};

  const name = v.customerName.trim();
  if (!name) e.customerName = "Please enter your full name.";
  else if (name.length < 2 || name.length > 80) e.customerName = "Name must be between 2 and 80 characters.";
  else if (/[<>]/.test(name)) e.customerName = "Name contains invalid characters.";

  const phone = v.phone.trim();
  const digits = phone.replace(/\D/g, "");
  if (!phone) e.phone = "Please enter your phone number.";
  else if (!PHONE_RE.test(phone) || digits.length < 7 || digits.length > 15)
    e.phone = "Enter a valid phone number (7 to 15 digits).";

  if (!v.carId) e.carId = "Please select a car.";

  const location = v.pickupLocation.trim();
  if (!location) e.pickupLocation = "Please enter a pickup location.";
  else if (location.length < 3 || location.length > 120) e.pickupLocation = "Location must be between 3 and 120 characters.";
  else if (/[<>]/.test(location)) e.pickupLocation = "Location contains invalid characters.";

  if (!v.pickupDate) e.pickupDate = "Please choose a pickup date.";
  else if (v.pickupDate < todayISO()) e.pickupDate = "Pickup date cannot be in the past.";

  if (!v.returnDate) e.returnDate = "Please choose a return date.";
  else if (v.pickupDate && v.returnDate <= v.pickupDate) e.returnDate = "Return date must be after the pickup date.";
  else if (v.pickupDate && rentalDays(v.pickupDate, v.returnDate) > MAX_RENTAL_DAYS)
    e.returnDate = `Rentals are limited to ${MAX_RENTAL_DAYS} days.`;

  if (!e.pickupDate && !e.returnDate && v.carId) {
    const clash = booked.some((r) => rangesOverlap(v.pickupDate, v.returnDate, r.pickup_date, r.return_date));
    if (clash) e.returnDate = "This car is already booked for part of these dates. Choose other dates or another car.";
  }

  return e;
}
