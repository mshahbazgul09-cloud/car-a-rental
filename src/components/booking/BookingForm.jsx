import { Loader2, AlertCircle } from "lucide-react";
import Field, { inputClass } from "../ui/Field.jsx";
import Button from "../ui/Button.jsx";
import { site } from "../../config/site.js";
import { addDaysISO, formatMoney, todayISO } from "../../utils/pricing.js";

export default function BookingForm({ cars, values, errors, onChange, onSubmit, submitting, formError }) {
  const today = todayISO();
  const minReturn = values.pickupDate ? addDaysISO(values.pickupDate, 1) : addDaysISO(today, 1);

  const aria = (name) => ({
    "aria-invalid": errors[name] ? "true" : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 rounded-3xl border border-white/10 bg-charcoal p-6 sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Full name" htmlFor="customerName" error={errors.customerName}>
          <input
            id="customerName"
            type="text"
            autoComplete="name"
            maxLength={80}
            placeholder="John Smith"
            value={values.customerName}
            onChange={onChange("customerName")}
            className={inputClass(errors.customerName)}
            {...aria("customerName")}
          />
        </Field>

        <Field label="Phone number" htmlFor="phone" error={errors.phone}>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            maxLength={20}
            placeholder="+1 555 000 0000"
            value={values.phone}
            onChange={onChange("phone")}
            className={inputClass(errors.phone)}
            {...aria("phone")}
          />
        </Field>
      </div>

      <Field label="Select car" htmlFor="carId" error={errors.carId}>
        <select
          id="carId"
          value={values.carId}
          onChange={onChange("carId")}
          className={inputClass(errors.carId)}
          {...aria("carId")}
        >
          <option value="">Choose a car...</option>
          {cars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.model} ({formatMoney(c.pricePerDay)} / day)
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Pickup date" htmlFor="pickupDate" error={errors.pickupDate}>
          <input
            id="pickupDate"
            type="date"
            min={today}
            value={values.pickupDate}
            onChange={onChange("pickupDate")}
            className={inputClass(errors.pickupDate)}
            {...aria("pickupDate")}
          />
        </Field>

        <Field label="Return date" htmlFor="returnDate" error={errors.returnDate}>
          <input
            id="returnDate"
            type="date"
            min={minReturn}
            value={values.returnDate}
            onChange={onChange("returnDate")}
            className={inputClass(errors.returnDate)}
            {...aria("returnDate")}
          />
        </Field>
      </div>

      <Field
        label="Pickup location"
        htmlFor="pickupLocation"
        error={errors.pickupLocation}
        hint="Start typing for suggestions, or enter your own address."
      >
        <input
          id="pickupLocation"
          type="text"
          list="pickup-locations"
          maxLength={120}
          placeholder="Airport, hotel or street address"
          value={values.pickupLocation}
          onChange={onChange("pickupLocation")}
          className={inputClass(errors.pickupLocation)}
          {...aria("pickupLocation")}
        />
        <datalist id="pickup-locations">
          {site.pickupLocations.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </Field>

      {formError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-brand/40 bg-brand/10 p-4 text-sm text-white">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-brand" />
          {formError}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Submitting...
          </>
        ) : (
          "Request Booking"
        )}
      </Button>
    </form>
  );
}
