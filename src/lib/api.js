// Talks to the FastAPI backend. With no VITE_API_URL, calls go to /api on the site's own address:
// in development the Vite server forwards them (vite.config.js), on Vercel api/index.py answers them.
const API_URL = (import.meta.env?.VITE_API_URL || "").replace(/\/$/, "");

// ---------------------------------------------------------------- login token
// Stored in localStorage so a page refresh keeps you logged in.
// (Trade-off: any script on the page could read it, so never add untrusted scripts to this site.)
const TOKEN_KEY = "car-rental-token";
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    localStorage.setItem(TOKEN_KEY, t);
  } catch {
    /* storage blocked: user stays logged in until refresh */
  }
};
export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

export class ApiError extends Error {
  constructor(message, status, fieldErrors = null) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors; // { backend_field_name: "message" } for field-level errors
  }
}

async function request(path, options = {}, { auth = true } = {}) {
  const token = auth ? getToken() : null;
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("Could not reach the server. Please check your connection and try again.", 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok) {
    // Field-level errors: { detail: [{ loc: ["body", "phone"], msg: "..." }] }
    if (Array.isArray(data?.detail)) {
      const fieldErrors = {};
      for (const d of data.detail) {
        const field = d.loc?.[d.loc.length - 1];
        const msg = String(d.msg || "Invalid value").replace(/^Value error, /, "");
        if (typeof field === "string" && !fieldErrors[field]) fieldErrors[field] = msg;
      }
      throw new ApiError(res.status === 422 ? "Please fix the highlighted fields." : Object.values(fieldErrors)[0], res.status, fieldErrors);
    }
    const message = typeof data?.detail === "string" ? data.detail : "Something went wrong. Please try again.";
    if (res.status === 401 && token) {
      // Token expired or invalid: log out everywhere.
      clearToken();
      window.dispatchEvent(new Event("auth:logout"));
    }
    throw new ApiError(message, res.status);
  }
  return data;
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });

// ---------------------------------------------------------------- cars
export const getCars = () => request("/api/cars");
export const getCar = (id) => request(`/api/cars/${encodeURIComponent(id)}`);
export const getAvailability = (carId) => request(`/api/cars/${encodeURIComponent(carId)}/availability`);

// ---------------------------------------------------------------- bookings
// Works for guests and logged-in users (logged-in bookings are saved to the account).
export const createBooking = (payload) => request("/api/bookings", json("POST", payload));
export const getMyBookings = () => request("/api/bookings/me");
export const cancelBooking = (id) => request(`/api/bookings/${encodeURIComponent(id)}/cancel`, { method: "POST" });

// ---------------------------------------------------------------- auth
export const register = (payload) => request("/api/auth/register", json("POST", payload), { auth: false });
export const login = (payload) => request("/api/auth/login", json("POST", payload), { auth: false });
export const getMe = () => request("/api/auth/me");

// ---------------------------------------------------------------- admin
export const adminGetBookings = (status) =>
  request(`/api/admin/bookings${status ? `?status=${encodeURIComponent(status)}` : ""}`);
export const adminUpdateBooking = (id, status) =>
  request(`/api/admin/bookings/${encodeURIComponent(id)}`, json("PATCH", { status }));

// ---------------------------------------------------------------- contact
export const sendContact = (payload) => request("/api/contact", json("POST", payload));

// ---------------------------------------------------------------- live chat
// Visitors prove a chat is theirs with the secret token they got when starting it.
const chatHeaders = (token) => ({ headers: { "X-Chat-Token": token } });
export const startChat = (payload) => request("/api/chat", json("POST", payload));
export const getChat = (id, token) =>
  request(`/api/chat/${encodeURIComponent(id)}`, chatHeaders(token), { auth: false });
export const sendChatMessage = (id, token, body) =>
  request(`/api/chat/${encodeURIComponent(id)}/messages`, { ...json("POST", { body }), ...chatHeaders(token) }, { auth: false });

export const adminGetChats = () => request("/api/admin/chats");
export const adminGetChat = (id) => request(`/api/admin/chats/${encodeURIComponent(id)}`);
export const adminReplyChat = (id, body) => request(`/api/admin/chats/${encodeURIComponent(id)}/messages`, json("POST", { body }));
export const adminSetChatStatus = (id, status) => request(`/api/admin/chats/${encodeURIComponent(id)}`, json("PATCH", { status }));
