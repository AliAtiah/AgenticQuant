"use client";

import { useState, useEffect } from "react";
import StrategyForm from "@/components/StrategyForm";
import { api, StrategyInfo } from "@/lib/api";

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<StrategyInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getStrategies()
      .then(setStrategies)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-surface-100">Strategies</h1>
        <p className="text-xs text-surface-400 mt-1">
          View and configure quantitative trading strategies
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="flex items-center gap-2 text-surface-400 text-xs">
            <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            <span className="ml-1">Loading strategies...</span>
          </div>
        </div>
      ) : strategies.length > 0 ? (
        <StrategyForm strategies={strategies} />
      ) : (
        <div className="text-center py-12 text-surface-400 text-xs">
          <p>No strategies loaded. Make sure the backend is running.</p>
        </div>
      )}
    </div>
  );
}
