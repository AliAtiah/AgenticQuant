"use client";

import { useState, useEffect } from "react";
import BacktestResults from "@/components/BacktestResults";
import { api, StrategyInfo, BacktestResponse } from "@/lib/api";

export default function BacktestPage() {
  const [strategies, setStrategies] = useState<StrategyInfo[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState("");
  const [symbol, setSymbol] = useState("AAPL");
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2024-01-01");
  const [capital, setCapital] = useState("10000");
  const [result, setResult] = useState<BacktestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getStrategies()
      .then((s) => {
        setStrategies(s);
        if (s.length > 0) setSelectedStrategy(s[0].name);
      })
      .catch(() => {});
  }, []);

  const runBacktest = async () => {
    if (!selectedStrategy) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.runBacktest({
        strategy: selectedStrategy,
        symbol: symbol.toUpperCase(),
        start_date: startDate,
        end_date: endDate,
        initial_capital: parseFloat(capital),
      });
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Backtest failed");
    } finally {
      setLoading(false);
    }
  };

  const currentStrategy = strategies.find(
    (s) => s.name === selectedStrategy
  );

  const inputClasses =
    "w-full bg-surface-900 border border-surface-700 rounded px-3 py-2 text-xs text-surface-100 focus:outline-none focus:border-brand-500 transition-colors";

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-surface-100">
          Backtesting Engine
        </h1>
        <p className="text-xs text-surface-400 mt-1">
          Test strategies against historical data
        </p>
      </div>

      <div className="bg-surface-800 rounded-lg border border-surface-700 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] text-surface-400 mb-1 uppercase tracking-wider font-medium">
              Strategy
            </label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className={inputClasses}
            >
              {strategies.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.display_name}
                </option>
              ))}
            </select>
            {currentStrategy && (
              <p className="text-[10px] text-surface-500 mt-1">
                {currentStrategy.description}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[10px] text-surface-400 mb-1 uppercase tracking-wider font-medium">
              Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className={inputClasses}
            />
          </div>

          <div>
            <label className="block text-[10px] text-surface-400 mb-1 uppercase tracking-wider font-medium">
              Initial Capital ($)
            </label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label className="block text-[10px] text-surface-400 mb-1 uppercase tracking-wider font-medium">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label className="block text-[10px] text-surface-400 mb-1 uppercase tracking-wider font-medium">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={runBacktest}
              disabled={loading || !selectedStrategy}
              className="w-full bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Running..." : "Run Backtest"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-[#ef535015] border border-[#ef535033] text-[#ef5350] rounded px-3 py-2.5 text-xs">
          {error}
        </div>
      )}

      {result && <BacktestResults result={result} />}
    </div>
  );
}
