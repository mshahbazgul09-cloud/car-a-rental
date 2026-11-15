import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import Container from "../components/ui/Container.jsx";
import Button from "../components/ui/Button.jsx";
import BookingForm from "../components/booking/BookingForm.jsx";
import BookingSummary from "../components/booking/BookingSummary.jsx";
import useCars from "../hooks/useCars.js";
import { useAuth } from "../context/AuthContext.jsx";
import { createBooking, getAvailability } from "../lib/api.js";
import { calcTotal, formatDate, formatMoney, rentalDays } from "../utils/pricing.js";
import { validateBooking } from "../utils/validation.js";

const emptyValues = {
  customerName: "",
  phone: "",
  carId: "",
  pickupDate: "",
  returnDate: "",
  pickupLocation: "",
};

// Backend field names -> form field names (for server-side validation messages)
const fieldMap = {
  customer_name: "customerName",
  phone: "phone",
  car_id: "carId",
  pickup_date: "pickupDate",
  return_date: "returnDate",
  pickup_location: "pickupLocation",
};

export default function Booking() {
  const [params] = useSearchParams();
  const presetCar = params.get("car");

  const { cars, loading: carsLoading } = useCars();
  const { user } = useAuth();

  const [values, setValues] = useState(() => ({ ...emptyValues, carId: presetCar || "" }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [booked, setBooked] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const car = cars.find((c) => c.id === values.carId) || null;
  const days = rentalDays(values.pickupDate, values.returnDate);
  const total = car ? calcTotal(days, car.pricePerDay) : 0;

  // A ?car= value that is not in the fleet is ignored once the car list has loaded.
  useEffect(() => {
    if (!carsLoading && values.carId && !cars.some((c) => c.id === values.carId)) {
      setValues((v) => ({ ...v, carId: "" }));
    }
  }, [carsLoading, cars, values.carId]);

  // Logged-in customers get their name and phone filled in (only into empty fields).
  useEffect(() => {
    if (!user) return;
    setValues((v) => ({ ...v, customerName: v.customerName || user.name, phone: v.phone || user.phone }));
  }, [user]);

  // Load the dates this car is already confirmed for. The server re-checks on submit.
  useEffect(() => {
    if (!values.carId) {
      setBooked([]);
      return;
    }
    let ignore = false;
    getAvailability(values.carId)
      .then((data) => !ignore && setBooked(Array.isArray(data) ? data : []))
      .catch(() => !ignore && setBooked([]));
    return () => {
      ignore = true;
    };
  }, [values.carId, refreshKey]);

  const onChange = (name) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [name]: value }));
    // Clear this field's error; date/car changes also clear the availability error shown on the return date.
    setErrors((er) => ({
      ...er,
      [name]: undefined,
      ...(["pickupDate", "returnDate", "carId"].includes(name) ? { returnDate: undefined } : {}),
    }));
    setFormError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const found = validateBooking(values, booked);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setFormError("");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const data = await createBooking({
        customer_name: values.customerName.trim(),
        phone: values.phone.trim(),
        car_id: values.carId,
        pickup_date: values.pickupDate,
        return_date: values.returnDate,
        pickup_location: values.pickupLocation.trim(),
      });
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (err.fieldErrors) {
        const mapped = {};
        for (const [k, msg] of Object.entries(err.fieldErrors)) mapped[fieldMap[k] || k] = msg;
        setErrors(mapped);
      }
      setFormError(err.message);
      if (err.status === 409) setRefreshKey((k) => k + 1); // someone else got those dates: refresh the list
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setValues(emptyValues);
    setErrors({});
    setFormError("");
    setResult(null);
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-ink pb-24 pt-32 text-white">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-20 h-[30rem] w-[30rem] rounded-full bg-brand/15 blur-[140px]" />

      <Container className="relative">
        <div className="animate-fade-up max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand">Reservations</p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Book Your <span className="text-brand">Car</span>
          </h1>
          <p className="mt-4 text-white/70">
            Fill in your details and choose your dates. Your price updates instantly.
          </p>
        </div>

        {result ? (
          <Success result={result} onReset={reset} loggedIn={Boolean(user)} />
        ) : (
          <div className="mt-12 grid items-start gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <BookingForm
                cars={cars}
                values={values}
                errors={errors}
                onChange={onChange}
                onSubmit={onSubmit}
                submitting={submitting}
                formError={formError}
              />
            </div>
            <BookingSummary car={car} values={values} days={days} total={total} booked={booked} />
          </div>
        )}
      </Container>
    </section>
  );
}

function Success({ result, onReset, loggedIn }) {
  return (
    <div className="animate-fade-up mx-auto mt-12 max-w-xl rounded-3xl border border-white/10 bg-charcoal p-8 text-center sm:p-10">
      <CheckCircle2 size={56} className="mx-auto text-brand" />
      <h2 className="mt-6 text-2xl font-bold">Booking request received</h2>
      <p className="mt-2 text-white/70">
        We will contact you shortly to confirm. Your dates are not guaranteed until we confirm them.
      </p>

      <dl className="mt-8 space-y-3 border-t border-white/10 pt-6 text-left text-sm">
        <Line label="Reference" value={result.id.slice(0, 8).toUpperCase()} />
        <Line label="Car" value={result.car_name} />
        <Line label="Pickup" value={formatDate(result.pickup_date)} />
        <Line label="Return" value={formatDate(result.return_date)} />
        <Line label="Rental days" value={result.rental_days} />
        <Line label="Total" value={formatMoney(result.total_price)} strong />
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {loggedIn && <Button to="/account/bookings">My bookings</Button>}
        <Button onClick={onReset} variant={loggedIn ? "outlineLight" : "primary"}>
          Book another car
        </Button>
        <Button to="/" variant="outlineLight">
          Back to home
        </Button>
      </div>
    </div>
  );
}

function Line({ label, value, strong }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-white/60">{label}</dt>
      <dd className={strong ? "text-lg font-extrabold text-brand" : "font-medium"}>{value}</dd>
    </div>
  );
}
