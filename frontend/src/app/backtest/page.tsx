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
    api.getStrategies().then((s) => {
      setStrategies(s);
      if (s.length > 0) setSelectedStrategy(s[0].name);
    }).catch(() => {});
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

  const currentStrategy = strategies.find((s) => s.name === selectedStrategy);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Backtesting Engine</h1>

      <div className="bg-surface-800 rounded-lg border border-surface-600 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Strategy</label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="w-full bg-surface-700 border border-surface-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
            >
              {strategies.map((s) => (
                <option key={s.name} value={s.name}>{s.display_name}</option>
              ))}
            </select>
            {currentStrategy && (
              <p className="text-xs text-gray-500 mt-1">{currentStrategy.description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full bg-surface-700 border border-surface-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Initial Capital ($)</label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              className="w-full bg-surface-700 border border-surface-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-surface-700 border border-surface-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-surface-700 border border-surface-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={runBacktest}
              disabled={loading || !selectedStrategy}
              className="w-full bg-brand-600 hover:bg-brand-700 px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Running..." : "Run Backtest"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {result && <BacktestResults result={result} />}
    </div>
  );
}
