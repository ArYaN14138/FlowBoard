import { Bot, Send, Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { api, getApiError } from "../api/client";

export default function AIChatPanel() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi, I am FlowBoard AI. Ask me what needs attention, or tell me to create a task."
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = async (event) => {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/ai/chat", { message: userMessage.content });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.reply,
          action: data.action
        }
      ]);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lift hover:bg-blue-700">
        <Sparkles size={18} />
        AI Assistant
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/30 p-4 backdrop-blur-sm">
          <motion.aside initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex h-[min(720px,90vh)] w-full max-w-md flex-col rounded-lg border border-slate-200 bg-white shadow-lift dark:border-slate-800 dark:bg-slate-900">
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-brand dark:bg-blue-950 dark:text-blue-200">
                  <Bot size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">FlowBoard AI</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tasks, insights, next actions</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-6 ${message.role === "user" ? "bg-brand text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {loading ? (
                <div className="inline-flex rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  AI is typing...
                </div>
              ) : null}
              {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p> : null}
            </div>

            <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
              <input value={input} onChange={(event) => setInput(event.target.value)} className="input" placeholder="Ask about projects or create a task..." />
              <button type="submit" disabled={loading} className="btn-primary px-3">
                <Send size={17} />
              </button>
            </form>
          </motion.aside>
        </div>
      ) : null}
    </>
  );
}
