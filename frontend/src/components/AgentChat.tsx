"use client";

import { useState, useRef, useEffect } from "react";
import { api, AgentResponse } from "@/lib/api";

interface Message {
  role: "user" | "agent";
  content: string;
  recommendation?: string | null;
  confidence?: string | null;
}

const recommendationColors: Record<string, string> = {
  "STRONG BUY": "bg-[#26a69a]",
  BUY: "bg-[#26a69a]/80",
  HOLD: "bg-[#FF9800]",
  SELL: "bg-[#ef5350]/80",
  "STRONG SELL": "bg-[#ef5350]",
};

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [symbol, setSymbol] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!symbol.trim()) return;
    const userMsg = input.trim() || `Analyze ${symbol}`;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res: AgentResponse = await api.analyzeMarket({
        symbol: symbol.toUpperCase(),
        question: input.trim() || undefined,
        include_technicals: true,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: res.analysis,
          recommendation: res.recommendation,
          confidence: res.confidence,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content:
            "Failed to get analysis. Make sure the backend is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-surface-400">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto mb-3 opacity-40">
                <rect x="8" y="18" width="32" height="20" rx="4" />
                <circle cx="24" cy="10" r="4" />
                <line x1="24" y1="14" x2="24" y2="18" />
                <circle cx="18" cy="28" r="2" fill="currentColor" stroke="none" />
                <circle cx="30" cy="28" r="2" fill="currentColor" stroke="none" />
              </svg>
              <p className="text-sm mb-1">AgenticQuant AI Agent</p>
              <p className="text-[11px] text-surface-500">
                Enter a stock symbol and ask about the market
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3.5 ${
                msg.role === "user"
                  ? "bg-brand-500 text-white"
                  : "bg-surface-800 border border-surface-700"
              }`}
            >
              {msg.role === "agent" && msg.recommendation && (
                <div className="flex gap-1.5 mb-2.5">
                  <span
                    className={`${
                      recommendationColors[msg.recommendation] || "bg-surface-600"
                    } text-white text-[10px] font-bold px-2 py-0.5 rounded`}
                  >
                    {msg.recommendation}
                  </span>
                  {msg.confidence && (
                    <span className="bg-surface-700 text-surface-300 text-[10px] px-2 py-0.5 rounded">
                      Confidence: {msg.confidence}
                    </span>
                  )}
                </div>
              )}
              <div className="text-xs whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-800 border border-surface-700 rounded-lg p-3.5">
              <div className="flex gap-1.5">
                <div
                  className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-surface-700 pt-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Symbol"
            className="bg-surface-900 border border-surface-700 rounded px-3 py-2 text-xs w-20 text-surface-100 focus:outline-none focus:border-brand-500 transition-colors"
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
            placeholder="Ask about the market... (or press Enter to analyze)"
            className="flex-1 bg-surface-900 border border-surface-700 rounded px-3 py-2 text-xs text-surface-100 focus:outline-none focus:border-brand-500 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !symbol.trim()}
            className="bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded text-xs font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>
    </div>
  );
}
