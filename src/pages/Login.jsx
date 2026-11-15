import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import Container from "../components/ui/Container.jsx";
import Button from "../components/ui/Button.jsx";
import Field, { inputClass } from "../components/ui/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { validateLogin } from "../utils/authValidation.js";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const onChange = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
    setFormError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const found = validateLogin(values);
    if (Object.keys(found).length) return setErrors(found);

    setSubmitting(true);
    try {
      await login(values.email.trim(), values.password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors);
      setFormError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-ink pb-16 pt-28 text-white">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-20 h-[30rem] w-[30rem] rounded-full bg-brand/15 blur-[140px]" />
      <Container className="relative">
        <div className="animate-fade-up mx-auto w-full max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome <span className="text-brand">back</span>
          </h1>
          <p className="mt-2 text-white/60">Log in to see and manage your bookings.</p>

          <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5 rounded-3xl border border-white/10 bg-charcoal p-6 sm:p-8">
            <Field label="Email" htmlFor="email" error={errors.email}>
              <input id="email" type="email" autoComplete="email" value={values.email} onChange={onChange("email")} className={inputClass(errors.email)} placeholder="you@example.com" />
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password}>
              <input id="password" type="password" autoComplete="current-password" value={values.password} onChange={onChange("password")} className={inputClass(errors.password)} />
            </Field>

            {formError && (
              <div role="alert" className="flex items-start gap-3 rounded-xl border border-brand/40 bg-brand/10 p-4 text-sm">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-brand" />
                {formError}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <><Loader2 size={18} className="animate-spin" /> Logging in...</> : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/60">
            New here?{" "}
            <Link to="/register" state={{ from }} className="font-semibold text-brand hover:underline">
              Create an account
            </Link>
          </p>

          {/* Shown only while developing with mock data. Never appears in a production build. */}
          {import.meta.env.DEV && (
            <div className="mt-8 rounded-2xl border border-dashed border-white/20 p-4 text-xs text-white/50">
              <p className="mb-1 font-semibold text-white/70">Mock logins (development only)</p>
              <p>Customer: demo@example.com / Demo12345</p>
              <p>Admin: admin@example.com / Admin12345</p>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
