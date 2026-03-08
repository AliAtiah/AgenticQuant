"use client";

import { useState, useRef, useEffect } from "react";
import { api, AgentResponse } from "@/lib/api";

interface Message {
  role: "user" | "agent";
  content: string;
  recommendation?: string | null;
  confidence?: string | null;
}

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
        { role: "agent", content: "Failed to get analysis. Make sure the backend is running." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const recommendationColor: Record<string, string> = {
    "STRONG BUY": "bg-green-500",
    BUY: "bg-green-600",
    HOLD: "bg-yellow-500",
    SELL: "bg-red-500",
    "STRONG SELL": "bg-red-600",
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">🤖</div>
              <p className="text-lg mb-2">AgenticQuant AI Agent</p>
              <p className="text-sm">Enter a stock symbol and ask me anything about the market</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                msg.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-surface-700 border border-surface-500"
              }`}
            >
              {msg.role === "agent" && msg.recommendation && (
                <div className="flex gap-2 mb-3">
                  <span className={`${recommendationColor[msg.recommendation] || "bg-gray-500"} text-white text-xs font-bold px-2 py-1 rounded`}>
                    {msg.recommendation}
                  </span>
                  {msg.confidence && (
                    <span className="bg-surface-500 text-gray-300 text-xs px-2 py-1 rounded">
                      Confidence: {msg.confidence}
                    </span>
                  )}
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-700 border border-surface-500 rounded-lg p-4">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-surface-600 pt-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Symbol"
            className="bg-surface-700 border border-surface-500 rounded-lg px-3 py-2.5 text-sm w-24 focus:outline-none focus:border-brand-500"
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
            placeholder="Ask about the market... (or press Enter to analyze)"
            className="flex-1 bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !symbol.trim()}
            className="bg-brand-600 hover:bg-brand-700 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>
    </div>
  );
}
