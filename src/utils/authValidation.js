const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^\+?[\d\s\-().]+$/;

/** All validators return { field: "message" }. Empty object = valid. The server repeats these checks. */
export function validateLogin({ email, password }) {
  const e = {};
  if (!email.trim()) e.email = "Please enter your email.";
  else if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address.";
  if (!password) e.password = "Please enter your password.";
  return e;
}

export function validateRegister({ name, email, phone, password, confirm }) {
  const e = {};
  const n = name.trim();
  if (!n) e.name = "Please enter your full name.";
  else if (n.length < 2 || n.length > 80) e.name = "Name must be between 2 and 80 characters.";
  else if (/[<>]/.test(n)) e.name = "Name contains invalid characters.";

  const em = email.trim();
  if (!em) e.email = "Please enter your email.";
  else if (!EMAIL_RE.test(em) || em.length > 254) e.email = "Enter a valid email address.";

  const ph = phone.trim();
  const digits = ph.replace(/\D/g, "");
  if (!ph) e.phone = "Please enter your phone number.";
  else if (!PHONE_RE.test(ph) || digits.length < 7 || digits.length > 15) e.phone = "Enter a valid phone number (7 to 15 digits).";

  if (!password) e.password = "Please choose a password.";
  else if (password.length < 8 || password.length > 128) e.password = "Password must be 8 to 128 characters.";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) e.password = "Password needs at least one letter and one number.";

  if (!e.password && confirm !== password) e.confirm = "Passwords do not match.";
  return e;
}

export function validateContact({ name, email, subject, message }) {
  const e = {};
  const n = name.trim();
  if (!n) e.name = "Please enter your name.";
  else if (n.length < 2 || n.length > 80) e.name = "Name must be between 2 and 80 characters.";
  else if (/[<>]/.test(n)) e.name = "Name contains invalid characters.";
  if (!email.trim()) e.email = "Please enter your email.";
  else if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address.";
  const s = subject.trim();
  if (!s) e.subject = "Please enter a subject.";
  else if (s.length < 3 || s.length > 120) e.subject = "Subject must be between 3 and 120 characters.";
  else if (/[<>]/.test(s)) e.subject = "Subject contains invalid characters.";
  const m = message.trim();
  if (!m) e.message = "Please write a message.";
  else if (m.length < 10) e.message = "Message must be at least 10 characters.";
  else if (m.length > 2000) e.message = "Message must be 2000 characters or fewer.";
  else if (/[<>]/.test(m)) e.message = "Message contains invalid characters.";
  return e;
}
