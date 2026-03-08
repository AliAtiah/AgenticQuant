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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Strategies</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and configure quantitative trading strategies
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Loading strategies...</div>
        </div>
      ) : strategies.length > 0 ? (
        <StrategyForm strategies={strategies} />
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No strategies loaded. Make sure the backend is running.</p>
        </div>
      )}
    </div>
  );
}
