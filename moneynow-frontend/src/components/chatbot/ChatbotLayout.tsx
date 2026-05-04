"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Minus,
  Maximize2,
  SendHorizontal,
  RotateCcw,
  MessageSquare,
  X,
} from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_CHAT_API_URL ?? "http://localhost:5000";

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    content: "Hello! I'm your Money Now assistant. How can I help you today?",
  },
];

const quickPrompts = [
  "Personal loan docs?",
  "EMI for 5 Lakh",
  "Approval time?",
];

export default function ChatbotLayout() {
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [error, setError] = useState("");

  const chatRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setIsFullScreen(false);
      }
    }
    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = input.trim();
    if (!trimmedMessage || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmedMessage }]);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedMessage, history: messages }),
      });
      const data = await response.json();
      if (!response.ok || !data.reply)
        throw new Error(data.error || "Service unavailable.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection error.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="fixed bottom-6 right-6 z-[9999] font-sans flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      <div
        ref={chatRef}
        className={`flex flex-col bg-white shadow-2xl transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) overflow-hidden border border-slate-200 pointer-events-auto
        ${isExpanded ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95 pointer-events-none"}
        ${
          isFullScreen
            ? "fixed inset-4 md:inset-10 w-auto h-auto z-[9999] rounded-xl"
            : "w-[90vw] md:w-[400px] h-[70vh] md:h-[560px] rounded-2xl mb-4"
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 bg-[#033261] text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-bold text-lg shadow-inner">
              MN
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Money Now Wealth
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#033261] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider opacity-90">
                  Assistant Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMessages(starterMessages)}
              className="p-2 hover:bg-white/10 rounded-full transition-all"
              title="Reset Chat"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-all"
              title="Toggle Fullscreen"
            >
              <Maximize2 size={16} />
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Messages Viewport */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all ${
                  msg.role === "user"
                    ? "bg-[#033261] text-white rounded-br-none font-medium"
                    : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-bl-none shadow-sm flex gap-1.5">
                <div className="w-2 h-2 bg-[#033261] rounded-full animate-bounce [animation-duration:0.8s]" />
                <div className="w-2 h-2 bg-[#033261] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-[#033261] rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          {error && (
            <div className="mx-auto bg-red-50 text-red-600 text-[11px] px-3 py-1.5 rounded-full border border-red-100 animate-shake">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <footer className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => setInput(p)}
                className="whitespace-nowrap px-4 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 rounded-sm text-xs font-semibold transition-all border border-slate-200 hover:border-emerald-200 active:scale-95"
              >
                {p}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="relative group">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about loans or EMI..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 pr-14 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1.5 p-2 bg-[#033261] text-white rounded-xl shadow-sm hover:bg-[#22588f] disabled:bg-slate-300 disabled:shadow-none transition-all active:scale-90"
            >
              <SendHorizontal size={20} />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
            Powered by Money Now Wealth AI
          </p>
        </footer>
      </div>

      {/* Launcher Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-3 pointer-events-auto bg-[#033261] text-white pl-4 pr-6 py-3.5 rounded-xl shadow-[0_10px_25px_-5px_rgba(5,150,105,0.4)] hover:scale-105 active:scale-95 transition-all group"
        >
          <div className="relative">
            <MessageSquare
              size={24}
              className="group-hover:rotate-12 transition-transform duration-300"
            />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          </div>
          <span className="font-bold text-sm tracking-wide">
            Chat with Money Now
          </span>
        </button>
      )}
    </main>
  );
}
