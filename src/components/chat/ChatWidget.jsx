import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2, MessageCircle, Phone, Send, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { site } from "../../config/site.js";
import { getChat, sendChatMessage, startChat } from "../../lib/api.js";

// The visitor's chat id and secret token live in this browser, so the chat survives page changes and refreshes.
const SESSION_KEY = "chat-session";
const SEEN_KEY = "chat-seen-admin";
const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    value == null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked: chat still works until the page is closed */
  }
};
const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const inputClass =
  "w-full rounded-xl border border-white/15 bg-ink px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30";

export default function ChatWidget() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(() => read(SESSION_KEY));
  const [chat, setChat] = useState(null);
  const [seen, setSeen] = useState(() => read(SEEN_KEY) || 0);
  const [form, setForm] = useState({ name: "", contact: "", message: "" });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  const adminCount = chat ? chat.messages.filter((m) => m.sender === "admin").length : 0;
  const unseen = open ? 0 : Math.max(0, adminCount - seen);

  const forget = useCallback(() => {
    write(SESSION_KEY, null);
    write(SEEN_KEY, 0);
    setSession(null);
    setChat(null);
    setSeen(0);
  }, []);

  // Fetch the conversation: every 4 s while open, every 20 s while closed (for the "new reply" badge).
  useEffect(() => {
    if (!session) return;
    let stop = false;
    const load = () =>
      getChat(session.id, session.token)
        .then((c) => !stop && setChat(c))
        .catch((err) => err.status === 404 && !stop && forget()); // chat no longer exists
    load();
    const id = setInterval(load, open ? 4000 : 20000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [session, open, forget]);

  // While open, everything the shop has written counts as seen.
  useEffect(() => {
    if (open && adminCount !== seen) {
      setSeen(adminCount);
      write(SEEN_KEY, adminCount);
    }
  }, [open, adminCount, seen]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [open, chat?.messages.length]);

  // Prefill the start form for logged-in customers.
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: f.name || user.name, contact: f.contact || user.phone || user.email }));
  }, [user]);

  if (pathname.startsWith("/admin")) return null; // the admin replies from the Admin page

  const begin = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (form.name.trim().length < 2) return setError("Please enter your name.");
    if (!form.message.trim()) return setError("Please type a message.");
    setBusy(true);
    setError("");
    try {
      const c = await startChat({ name: form.name.trim(), contact: form.contact.trim(), message: form.message });
      const s = { id: c.id, token: c.token };
      write(SESSION_KEY, s);
      setSession(s);
      setChat(c);
      setForm((f) => ({ ...f, message: "" }));
    } catch (err) {
      setError(err.fieldErrors ? Object.values(err.fieldErrors)[0] : err.message);
    } finally {
      setBusy(false);
    }
  };

  const send = async (e) => {
    e?.preventDefault();
    if (busy || !text.trim()) return;
    setBusy(true);
    setError("");
    try {
      setChat(await sendChatMessage(session.id, session.token, text));
      setText("");
    } catch (err) {
      if (err.status === 404) forget();
      setError(err.fieldErrors ? Object.values(err.fieldErrors)[0] : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Live chat"
          className="animate-fade-up fixed bottom-24 right-4 z-40 flex h-[32rem] max-h-[calc(100dvh-8rem)] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-charcoal text-white shadow-2xl sm:right-6"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-ink px-4 py-3">
            <div className="min-w-0">
              <p className="font-bold">Chat with us</p>
              <p className="truncate text-xs text-white/50">{site.name}</p>
            </div>
            <a href={site.phoneHref} className="flex shrink-0 items-center gap-1.5 text-xs text-white/70 transition-colors hover:text-brand">
              <Phone size={14} className="text-brand" />
              {site.phone}
            </a>
          </div>

          {!session ? (
            <form onSubmit={begin} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              <p className="text-sm text-white/60">Questions about a car or a booking? Send us a message and we will reply right here.</p>
              <input aria-label="Your name" placeholder="Your name" value={form.name} maxLength={80}
                onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              <input aria-label="Phone or email (optional)" placeholder="Phone or email (optional)" value={form.contact} maxLength={120}
                onChange={(e) => setForm({ ...form, contact: e.target.value })} className={inputClass} />
              <textarea aria-label="Your message" placeholder="How can we help?" rows={4} value={form.message} maxLength={1000}
                onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${inputClass} resize-none`} />
              {error && <p role="alert" className="text-sm text-brand-light">{error}</p>}
              <button type="submit" disabled={busy}
                className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-semibold transition-colors hover:bg-brand-dark disabled:opacity-50">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Start chat
              </button>
            </form>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
                {!chat ? (
                  <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-brand" /></div>
                ) : (
                  <>
                    {chat.messages.map((m) => (
                      <div key={m.id} className={`flex ${m.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                          m.sender === "visitor" ? "rounded-br-sm bg-brand" : "rounded-bl-sm bg-graphite"}`}>
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <p className="mt-1 text-right text-[10px] text-white/60">{time(m.created_at)}</p>
                        </div>
                      </div>
                    ))}
                    {chat.messages.every((m) => m.sender === "visitor") && (
                      <p className="text-center text-xs text-white/40">Thanks! We will reply here. Keep this page open or come back later.</p>
                    )}
                    {chat.status === "closed" && (
                      <p className="text-center text-xs text-white/40">
                        This chat was closed. Send a message to reopen it, or{" "}
                        <button onClick={forget} className="underline hover:text-white">start a new chat</button>.
                      </p>
                    )}
                  </>
                )}
                <div ref={endRef} />
              </div>
              {error && <p role="alert" className="px-4 pb-1 text-sm text-brand-light">{error}</p>}
              <form onSubmit={send} className="flex items-end gap-2 border-t border-white/10 p-3">
                <textarea aria-label="Type a message" placeholder="Type a message..." rows={1} value={text} maxLength={1000}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(e)}
                  className={`${inputClass} max-h-28 resize-none`} />
                <button type="submit" aria-label="Send" disabled={busy || !text.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand transition-colors hover:bg-brand-dark disabled:opacity-50">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : unseen ? `Open chat, ${unseen} new ${unseen === 1 ? "reply" : "replies"}` : "Open chat"}
        aria-expanded={open}
        className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 transition-transform duration-200 hover:scale-105 hover:bg-brand-dark sm:right-6"
      >
        {open ? <X size={24} /> : <MessageCircle size={26} />}
        {unseen > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-brand">
            {unseen}
          </span>
        )}
      </button>
    </>
  );
}
