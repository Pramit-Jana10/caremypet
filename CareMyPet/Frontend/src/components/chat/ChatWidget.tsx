// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import toast from "react-hot-toast";
// import clsx from "clsx";
// import { Button } from "@/components/ui/Button";
// import { chatbotService } from "@/services/chatbotService";
// import ReactMarkdown from "react-markdown";

// type Msg = { id: string; role: "user" | "bot"; text: string };

// export function ChatWidget() {
//   const [open, setOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [input, setInput] = useState("");
//   const [messages, setMessages] = useState<Msg[]>(() => [
//     { id: "m0", role: "bot", text: "Hi! Ask me about pet care, medicines, vaccines, or your orders." }
//   ]);
//   const listRef = useRef<HTMLDivElement | null>(null);

//   const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

//   useEffect(() => {
//     if (!open) return;
//     const el = listRef.current;
//     if (!el) return;
//     el.scrollTop = el.scrollHeight;
//   }, [messages, open]);

//   async function send() {
//     const text = input.trim();
//     if (!text) return;
//     setInput("");
//     const id = crypto.randomUUID();
//     setMessages((prev) => [...prev, { id, role: "user", text }]);
//     setLoading(true);
//     try {
//       const res = await chatbotService.sendMessage(text);
//       setMessages((prev) => [...prev, { id: `${id}-r`, role: "bot", text: res.reply }]);
//     } catch (e: any) {
//       toast.error(e?.response?.data?.message || "Chatbot is unavailable");
//       setMessages((prev) => [
//         ...prev,
//         { id: `${id}-r`, role: "bot", text: "Sorry—I'm having trouble reaching the server right now." }
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="fixed bottom-4 right-4 z-50">
//       {open ? (
//         <div className="w-[92vw] max-w-sm overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-ink-100">
//           <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
//             <p className="text-sm font-semibold text-ink-900">
//               AI Pet Assistant
//             </p>
//             <button
//               onClick={() => setOpen(false)}
//               className="rounded-lg px-2 py-1 text-sm text-ink-600 hover:bg-ink-50"
//               aria-label="Close chat"
//             >
//               ×
//             </button>
//           </div>

//           <div
//             ref={listRef}
//             className="h-[420px] space-y-3 overflow-y-auto px-4 py-3 flex flex-col"
//           >
//             {messages.map((m) => (
//               <div
//                 key={m.id}
//                 className={clsx(
//                   "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words leading-relaxed",
//                   m.role === "user"
//                     ? "ml-auto bg-brand-600 text-white"
//                     : "bg-ink-100 text-ink-900",
//                 )}
//               >
//                 <ReactMarkdown>{m.text}</ReactMarkdown>
//               </div>
//             ))}
//             {loading ? <p className="text-xs text-ink-500">Typing…</p> : null}
//           </div>

//           <div className="border-t border-ink-100 p-3">
//             <div className="flex gap-2">
//               <input
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") void send();
//                 }}
//                 className="h-10 flex-1 rounded-xl border border-ink-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
//                 placeholder="Ask a question…"
//               />
//               <Button size="sm" disabled={!canSend} onClick={() => void send()}>
//                 Send
//               </Button>
//             </div>
//             <p className="mt-2 text-[11px] text-ink-500">
//               Connected to backend via `chatbotService`.
//             </p>
//           </div>
//         </div>
//       ) : null}

//       {!open ? (
//         <button
//           onClick={() => setOpen(true)}
//           className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft hover:bg-brand-700"
//           aria-label="Open chat"
//         >
//           Chat
//         </button>
//       ) : null}
//     </div>
//   );
// }


"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { chatbotService } from "@/services/chatbotService";
import ReactMarkdown from "react-markdown";
import { Copy } from "lucide-react"; // NEW

type Msg = { id: string; role: "user" | "bot"; text: string };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      id: "m0",
      role: "bot",
      text: "Hi! Ask me about pet care, medicines, vaccines, or your orders.",
    },
  ]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading],
  );

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  // NEW: copy message function
  function copyMessage(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  }

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const id = crypto.randomUUID();
    setMessages((prev) => [...prev, { id, role: "user", text }]);
    setLoading(true);
    try {
      const res = await chatbotService.sendMessage(text);
      setMessages((prev) => [
        ...prev,
        { id: `${id}-r`, role: "bot", text: res.reply },
      ]);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Chatbot is unavailable");
      setMessages((prev) => [
        ...prev,
        {
          id: `${id}-r`,
          role: "bot",
          text: "Sorry—I'm having trouble reaching the server right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="w-[92vw] max-w-sm overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-ink-100">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">
              AI Pet Assistant
            </p>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-sm text-ink-600 hover:bg-ink-50"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div
            ref={listRef}
            className="h-[420px] space-y-3 overflow-y-auto px-4 py-3 flex flex-col"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={clsx(
                  "group relative max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-brand-600 text-white"
                    : "bg-ink-100 text-ink-900",
                )}
              >
                <ReactMarkdown>{m.text}</ReactMarkdown>

                {/* COPY BUTTON */}
                <button
                  onClick={() => copyMessage(m.text)}
                  className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 text-gray-500 hover:text-gray-700"
                  title="Copy message"
                >
                  <Copy size={16} />
                </button>
              </div>
            ))}
            {loading ? <p className="text-xs text-ink-500">Typing…</p> : null}
          </div>

          <div className="border-t border-ink-100 p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void send();
                }}
                className="h-10 flex-1 rounded-xl border border-ink-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
                placeholder="Ask a question…"
              />
              <Button size="sm" disabled={!canSend} onClick={() => void send()}>
                Send
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-ink-500">
              Connected to backend via `chatbotService`.
            </p>
          </div>
        </div>
      ) : null}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft hover:bg-brand-700"
          aria-label="Open chat"
        >
          Chat
        </button>
      ) : null}
    </div>
  );
}
