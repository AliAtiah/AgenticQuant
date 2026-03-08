"use client";

import { useState } from "react";
import ChartWidget from "@/components/ChartWidget";
import { api, OHLCVBar } from "@/lib/api";

const PERIODS = ["1mo", "3mo", "6mo", "1y", "2y", "5y"];
const INTERVALS = ["1d", "1wk", "1mo"];

export default function ChartPage() {
  const [symbol, setSymbol] = useState("AAPL");
  const [inputSymbol, setInputSymbol] = useState("AAPL");
  const [period, setPeriod] = useState("6mo");
  const [interval, setInterval] = useState("1d");
  const [data, setData] = useState<OHLCVBar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async (sym?: string, p?: string, i?: string) => {
    const s = sym || symbol;
    const per = p || period;
    const intv = i || interval;
    setLoading(true);
    setError("");
    try {
      const res = await api.getMarketData(s, per, intv);
      setData(res.bars);
      setSymbol(s.toUpperCase());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chart</h1>
        <div className="flex items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchData(inputSymbol);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
              placeholder="Symbol"
              className="bg-surface-700 border border-surface-500 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load"}
            </button>
          </form>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex gap-1 bg-surface-800 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                if (data.length > 0) fetchData(symbol, p, interval);
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                period === p
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-surface-800 rounded-lg p-1">
          {INTERVALS.map((i) => (
            <button
              key={i}
              onClick={() => {
                setInterval(i);
                if (data.length > 0) fetchData(symbol, period, i);
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                interval === i
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {i.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {data.length > 0 ? (
        <div>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-xl font-bold">{symbol}</span>
            <span className="text-lg">${data[data.length - 1]?.close.toFixed(2)}</span>
            {data.length >= 2 && (() => {
              const change = data[data.length - 1].close - data[data.length - 2].close;
              const changePct = (change / data[data.length - 2].close) * 100;
              const positive = change >= 0;
              return (
                <span className={positive ? "text-green-400" : "text-red-400"}>
                  {positive ? "+" : ""}{change.toFixed(2)} ({positive ? "+" : ""}{changePct.toFixed(2)}%)
                </span>
              );
            })()}
          </div>
          <ChartWidget data={data} height={550} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-96 bg-surface-800 rounded-lg border border-surface-600">
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">Enter a symbol and click Load</p>
            <p className="text-sm">Try AAPL, TSLA, MSFT, GOOGL, AMZN</p>
          </div>
        </div>
      )}
    </div>
  );
}
