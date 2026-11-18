import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail, MapPin, Phone } from "lucide-react";
import Container from "../components/ui/Container.jsx";
import Button from "../components/ui/Button.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Field, { inputClass } from "../components/ui/Field.jsx";
import { site } from "../config/site.js";
import { sendContact } from "../lib/api.js";
import { validateContact } from "../utils/authValidation.js";

const empty = { name: "", email: "", subject: "", message: "" };

export default function Contact() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onChange = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
    setFormError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const found = validateContact(values);
    if (Object.keys(found).length) return setErrors(found);

    setSubmitting(true);
    try {
      await sendContact({
        name: values.name.trim(),
        email: values.email.trim(),
        subject: values.subject.trim(),
        message: values.message.trim(),
      });
      setSent(true);
      setValues(empty);
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors);
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const info = [
    { icon: Phone, label: "Phone", value: site.phone, href: site.phoneHref },
    { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}` },
    { icon: MapPin, label: "Address", value: site.address },
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-ink pb-24 pt-32 text-white">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-20 h-[30rem] w-[30rem] rounded-full bg-brand/15 blur-[140px]" />
      <Container className="relative">
        <PageHeader eyebrow="Get in touch" title="Contact" accent="Us" subtitle="Questions about a booking or a car? Send us a message." />

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <div className="space-y-4">
            {info.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-charcoal p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
                  {href ? (
                    <a href={href} className="font-medium transition-colors hover:text-brand">{value}</a>
                  ) : (
                    <p className="font-medium">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {sent ? (
              <div className="animate-fade-up rounded-3xl border border-white/10 bg-charcoal p-10 text-center">
                <CheckCircle2 size={56} className="mx-auto text-brand" />
                <h2 className="mt-6 text-2xl font-bold">Message sent</h2>
                <p className="mt-2 text-white/70">Thank you. We will get back to you as soon as we can.</p>
                <Button onClick={() => setSent(false)} className="mt-8">Send another message</Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-3xl border border-white/10 bg-charcoal p-6 sm:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your name" htmlFor="name" error={errors.name}>
                    <input id="name" type="text" autoComplete="name" value={values.name} onChange={onChange("name")} className={inputClass(errors.name)} />
                  </Field>
                  <Field label="Email" htmlFor="email" error={errors.email}>
                    <input id="email" type="email" autoComplete="email" value={values.email} onChange={onChange("email")} className={inputClass(errors.email)} />
                  </Field>
                </div>
                <Field label="Subject" htmlFor="subject" error={errors.subject}>
                  <input id="subject" type="text" maxLength={120} value={values.subject} onChange={onChange("subject")} className={inputClass(errors.subject)} />
                </Field>
                <Field label="Message" htmlFor="message" error={errors.message}>
                  <textarea id="message" rows={6} maxLength={2000} value={values.message} onChange={onChange("message")} className={inputClass(errors.message)} />
                </Field>

                {formError && (
                  <div role="alert" className="flex items-start gap-3 rounded-xl border border-brand/40 bg-brand/10 p-4 text-sm">
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-brand" /> {formError}
                  </div>
                )}

                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : "Send message"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
