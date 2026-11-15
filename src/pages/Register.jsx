import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import Container from "../components/ui/Container.jsx";
import Button from "../components/ui/Button.jsx";
import Field, { inputClass } from "../components/ui/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { validateRegister } from "../utils/authValidation.js";

const empty = { name: "", email: "", phone: "", password: "", confirm: "" };

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [values, setValues] = useState(empty);
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
    const found = validateRegister(values);
    if (Object.keys(found).length) return setErrors(found);

    setSubmitting(true);
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
      });
      navigate(from, { replace: true });
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors); // keys: name, email, phone, password
      setFormError(err.message);
      setSubmitting(false);
    }
  };

  const input = (id, type, autoComplete, placeholder) => (
    <input
      id={id}
      type={type}
      autoComplete={autoComplete}
      placeholder={placeholder}
      value={values[id]}
      onChange={onChange(id)}
      className={inputClass(errors[id])}
    />
  );

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-ink pb-16 pt-28 text-white">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-20 h-[30rem] w-[30rem] rounded-full bg-brand/15 blur-[140px]" />
      <Container className="relative">
        <div className="animate-fade-up mx-auto w-full max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Create your <span className="text-brand">account</span>
          </h1>
          <p className="mt-2 text-white/60">Book faster and keep track of every rental.</p>

          <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5 rounded-3xl border border-white/10 bg-charcoal p-6 sm:p-8">
            <Field label="Full name" htmlFor="name" error={errors.name}>{input("name", "text", "name", "John Smith")}</Field>
            <Field label="Email" htmlFor="email" error={errors.email}>{input("email", "email", "email", "you@example.com")}</Field>
            <Field label="Phone number" htmlFor="phone" error={errors.phone}>{input("phone", "tel", "tel", "+1 555 000 0000")}</Field>
            <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters, with a letter and a number.">
              {input("password", "password", "new-password")}
            </Field>
            <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
              {input("confirm", "password", "new-password")}
            </Field>

            {formError && (
              <div role="alert" className="flex items-start gap-3 rounded-xl border border-brand/40 bg-brand/10 p-4 text-sm">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-brand" />
                {formError}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <><Loader2 size={18} className="animate-spin" /> Creating account...</> : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/60">
            Already have an account?{" "}
            <Link to="/login" state={{ from }} className="font-semibold text-brand hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
