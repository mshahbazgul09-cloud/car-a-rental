import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Loader2, Send } from "lucide-react";
import Button from "../ui/Button.jsx";
import { adminGetChat, adminReplyChat, adminSetChatStatus } from "../../lib/api.js";

const when = (iso) => {
  const d = new Date(iso);
  const today = d.toDateString() === new Date().toDateString();
  return today
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { day: "numeric", month: "short" });
};

// A phone number becomes a call link and an email a mail link; anything else stays text.
function ContactLink({ value }) {
  if (!value) return <span className="text-white/40">No contact given</span>;
  if (value.includes("@")) return <a href={`mailto:${value}`} className="hover:text-brand">{value}</a>;
  if (/^\+?[\d\s\-().]{7,}$/.test(value)) return <a href={`tel:${value.replace(/[^+\d]/g, "")}`} className="hover:text-brand">{value}</a>;
  return <span>{value}</span>;
}

/** Admin side of the live chat. `chats` and `reloadChats` come from the Admin page, which keeps the list fresh. */
export default function AdminChat({ chats, reloadChats }) {
  const [selectedId, setSelectedId] = useState(null);
  const [convo, setConvo] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  const load = useCallback(
    (id) =>
      adminGetChat(id)
        .then((c) => setConvo((prev) => (prev?.thread.id === id || !prev ? c : prev)))
        .catch((err) => setError(err.message)),
    []
  );

  // Open a chat and keep it fresh every 4 seconds.
  useEffect(() => {
    if (!selectedId) return;
    setConvo(null);
    setError("");
    load(selectedId).then(reloadChats);
    const id = setInterval(() => load(selectedId), 4000);
    return () => clearInterval(id);
  }, [selectedId, load, reloadChats]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [convo?.messages.length]);

  const reply = async (e) => {
    e?.preventDefault();
    if (busy || !text.trim()) return;
    setBusy(true);
    setError("");
    try {
      setConvo(await adminReplyChat(selectedId, text));
      setText("");
      reloadChats();
    } catch (err) {
      setError(err.fieldErrors ? Object.values(err.fieldErrors)[0] : err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async () => {
    setBusy(true);
    setError("");
    try {
      const thread = await adminSetChatStatus(selectedId, convo.thread.status === "open" ? "closed" : "open");
      setConvo((c) => ({ ...c, thread }));
      reloadChats();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (chats === null) {
    return <div className="mt-12 flex justify-center"><Loader2 className="animate-spin text-brand" size={32} /></div>;
  }
  if (chats.length === 0) {
    return <p className="mt-12 text-center text-white/50">No chats yet. When a visitor uses the chat button, the conversation appears here.</p>;
  }

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-[18rem_1fr]">
      {/* Chat list (hidden on phones while a chat is open) */}
      <ul className={`max-h-[36rem] divide-y divide-white/5 overflow-y-auto rounded-3xl border border-white/10 bg-charcoal ${selectedId ? "hidden md:block" : ""}`}>
        {chats.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => setSelectedId(c.id)}
              className={`w-full px-5 py-4 text-left transition-colors hover:bg-white/5 ${selectedId === c.id ? "bg-white/5" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate ${c.admin_unread ? "font-bold text-white" : "font-medium text-white/80"}`}>{c.visitor_name}</span>
                <span className="shrink-0 text-xs text-white/40">{when(c.last_message_at)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <p className="flex-1 truncate text-sm text-white/50">{c.last_message_preview}</p>
                {c.admin_unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand" aria-label="New message" />}
                {c.status === "closed" && <span className="shrink-0 text-xs text-white/30">Closed</span>}
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Conversation */}
      <div className={`flex h-[36rem] flex-col overflow-hidden rounded-3xl border border-white/10 bg-charcoal ${selectedId ? "" : "hidden md:flex"}`}>
        {!selectedId ? (
          <p className="m-auto text-white/40">Select a chat to read and reply.</p>
        ) : !convo ? (
          <Loader2 className="m-auto animate-spin text-brand" size={28} />
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <button onClick={() => setSelectedId(null)} className="text-white/60 hover:text-white md:hidden" aria-label="Back to chats">
                <ArrowLeft size={20} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{convo.thread.visitor_name}</p>
                <p className="truncate text-sm text-white/50"><ContactLink value={convo.thread.contact} /></p>
              </div>
              <Button size="sm" variant="outlineLight" disabled={busy} onClick={toggleStatus}>
                {convo.thread.status === "open" ? "Close chat" : "Reopen"}
              </Button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {convo.messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.sender === "admin" ? "rounded-br-sm bg-brand" : "rounded-bl-sm bg-graphite"}`}>
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className="mt-1 text-right text-[10px] text-white/60">{when(m.created_at)}</p>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {error && (
              <p role="alert" className="flex items-center gap-2 px-5 pb-2 text-sm text-brand-light">
                <AlertCircle size={16} /> {error}
              </p>
            )}
            <form onSubmit={reply} className="flex items-end gap-2 border-t border-white/10 p-4">
              <textarea
                aria-label="Reply"
                placeholder="Type your reply... (Enter to send, Shift+Enter for a new line)"
                rows={2}
                maxLength={1000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && reply(e)}
                className="w-full resize-none rounded-xl border border-white/15 bg-ink px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
              <Button type="submit" disabled={busy || !text.trim()} aria-label="Send reply">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
