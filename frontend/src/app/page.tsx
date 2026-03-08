"use client";

import { useState } from "react";
import Link from "next/link";
import { api, OHLCVBar } from "@/lib/api";

const WATCHLIST_SYMBOLS = ["AAPL", "TSLA", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "SPY"];

interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  bars: OHLCVBar[];
}

function MiniSparkline({ bars }: { bars: OHLCVBar[] }) {
  if (bars.length < 2) return null;

  const closes = bars.slice(-30).map((b) => b.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const w = 120;
  const h = 32;

  const points = closes
    .map((c, i) => {
      const x = (i / (closes.length - 1)) * w;
      const y = h - ((c - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  const positive = closes[closes.length - 1] >= closes[0];

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#3fb950" : "#f85149"}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  accent,
}: {
  title: string;
  value: string;
  subtitle?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface-800 rounded-lg border border-surface-600 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? "text-brand-400" : "text-white"}`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadWatchlist = async () => {
    setLoadingWatchlist(true);
    const items: WatchlistItem[] = [];

    for (const sym of WATCHLIST_SYMBOLS) {
      try {
        const data = await api.getMarketData(sym, "1mo", "1d");
        const bars = data.bars;
        if (bars.length >= 2) {
          const last = bars[bars.length - 1].close;
          const prev = bars[bars.length - 2].close;
          items.push({
            symbol: sym,
            price: last,
            change: last - prev,
            changePct: ((last - prev) / prev) * 100,
            bars,
          });
        }
      } catch {
        /* skip symbols that fail */
      }
    }

    setWatchlist(items);
    setLoadingWatchlist(false);
    setLoaded(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome to AgenticQuant - your AI-powered trading command center
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Platform" value="AgenticQuant" subtitle="v0.1.0 Beta" accent />
        <StatCard title="Strategies" value="2" subtitle="SMA Crossover, RSI" />
        <StatCard title="AI Agent" value="Ready" subtitle="OpenAI GPT-4o" />
        <StatCard title="Market Data" value="Live" subtitle="Yahoo Finance" />
      </div>

      <div className="bg-surface-800 rounded-lg border border-surface-600 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Watchlist</h2>
          {!loaded && (
            <button
              onClick={loadWatchlist}
              disabled={loadingWatchlist}
              className="bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loadingWatchlist ? "Loading..." : "Load Watchlist"}
            </button>
          )}
        </div>

        {!loaded && !loadingWatchlist && (
          <p className="text-sm text-gray-500">
            Click &quot;Load Watchlist&quot; to fetch live prices (requires backend running)
          </p>
        )}

        {loadingWatchlist && (
          <div className="text-center py-8 text-gray-500">
            Fetching market data for {WATCHLIST_SYMBOLS.length} symbols...
          </div>
        )}

        {loaded && watchlist.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-600 text-gray-500">
                  <th className="text-left py-3 px-2">Symbol</th>
                  <th className="text-right py-3 px-2">Price</th>
                  <th className="text-right py-3 px-2">Change</th>
                  <th className="text-right py-3 px-2">%</th>
                  <th className="text-right py-3 px-2">30D Trend</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item) => {
                  const positive = item.change >= 0;
                  return (
                    <tr
                      key={item.symbol}
                      className="border-b border-surface-700 last:border-0 hover:bg-surface-700/50 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <Link
                          href={`/chart?symbol=${item.symbol}`}
                          className="font-semibold text-white hover:text-brand-400 transition-colors"
                        >
                          {item.symbol}
                        </Link>
                      </td>
                      <td className="text-right py-3 px-2 font-mono">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className={`text-right py-3 px-2 ${positive ? "text-green-400" : "text-red-400"}`}>
                        {positive ? "+" : ""}{item.change.toFixed(2)}
                      </td>
                      <td className={`text-right py-3 px-2 ${positive ? "text-green-400" : "text-red-400"}`}>
                        {positive ? "+" : ""}{item.changePct.toFixed(2)}%
                      </td>
                      <td className="text-right py-3 px-2">
                        <MiniSparkline bars={item.bars} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {loaded && watchlist.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Could not fetch data. Make sure the backend is running on port 8000.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/chart"
          className="bg-surface-800 rounded-lg border border-surface-600 p-5 hover:border-brand-500/50 transition-colors group"
        >
          <h3 className="font-semibold group-hover:text-brand-400 transition-colors">
            Charts
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Interactive candlestick charts with volume and indicators
          </p>
        </Link>
        <Link
          href="/backtest"
          className="bg-surface-800 rounded-lg border border-surface-600 p-5 hover:border-brand-500/50 transition-colors group"
        >
          <h3 className="font-semibold group-hover:text-brand-400 transition-colors">
            Backtest
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Test strategies against historical data with detailed metrics
          </p>
        </Link>
        <Link
          href="/agents"
          className="bg-surface-800 rounded-lg border border-surface-600 p-5 hover:border-brand-500/50 transition-colors group"
        >
          <h3 className="font-semibold group-hover:text-brand-400 transition-colors">
            AI Agent
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Get AI-powered market analysis and trade recommendations
          </p>
        </Link>
      </div>
    </div>
  );
}
