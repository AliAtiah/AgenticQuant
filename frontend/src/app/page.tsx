"use client";

import { useState } from "react";
import Link from "next/link";
import { api, OHLCVBar } from "@/lib/api";

const WATCHLIST_SYMBOLS = [
  "AAPL",
  "TSLA",
  "MSFT",
  "GOOGL",
  "AMZN",
  "NVDA",
  "META",
  "SPY",
];

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
  const w = 100;
  const h = 28;

  const points = closes
    .map((c, i) => {
      const x = (i / (closes.length - 1)) * w;
      const y = h - ((c - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const positive = closes[closes.length - 1] >= closes[0];

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#26a69a" : "#ef5350"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
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
    <div className="bg-surface-800 rounded-lg border border-surface-700 p-4 hover:border-surface-600 transition-colors">
      <p className="text-[10px] text-surface-400 uppercase tracking-wider font-medium">
        {title}
      </p>
      <p
        className={`text-xl font-bold mt-1 ${
          accent ? "text-brand-500" : "text-surface-100"
        }`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-[11px] text-surface-500 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

const FEATURE_CARDS = [
  {
    href: "/chart",
    title: "Charts",
    description: "Advanced candlestick charts with technical indicators and drawing tools",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="5" y="6" width="3" height="10" rx="0.5" />
        <line x1="6.5" y1="3" x2="6.5" y2="6" />
        <line x1="6.5" y1="16" x2="6.5" y2="19" />
        <rect x="13" y="8" width="3" height="8" rx="0.5" />
        <line x1="14.5" y1="5" x2="14.5" y2="8" />
        <line x1="14.5" y1="16" x2="14.5" y2="21" />
      </svg>
    ),
  },
  {
    href: "/backtest",
    title: "Backtest",
    description: "Test strategies against historical data with detailed metrics",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M9 3h6M10 3v7.4a2 2 0 0 1-.5 1.3L4 19a1 1 0 0 0 .8 1.6h14.4a1 1 0 0 0 .8-1.6l-5.5-7.3a2 2 0 0 1-.5-1.3V3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/agents",
    title: "AI Agent",
    description: "Get AI-powered market analysis and trade recommendations",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <line x1="12" y1="7" x2="12" y2="11" />
        <circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

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
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-surface-100">Dashboard</h1>
        <p className="text-xs text-surface-400 mt-1">
          Your AI-powered trading command center
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Platform"
          value="AgenticQuant"
          subtitle="v0.1.0 Beta"
          accent
        />
        <StatCard title="Strategies" value="2" subtitle="SMA Crossover, RSI" />
        <StatCard title="AI Agent" value="Ready" subtitle="OpenAI GPT-4o" />
        <StatCard
          title="Market Data"
          value="Live"
          subtitle="Yahoo Finance"
        />
      </div>

      {/* Watchlist */}
      <div className="bg-surface-800 rounded-lg border border-surface-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700">
          <h2 className="text-sm font-semibold text-surface-100">
            Watchlist
          </h2>
          {!loaded && (
            <button
              onClick={loadWatchlist}
              disabled={loadingWatchlist}
              className="bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded text-[11px] font-medium transition-colors disabled:opacity-50"
            >
              {loadingWatchlist ? "Loading..." : "Load Watchlist"}
            </button>
          )}
        </div>

        <div className="p-4">
          {!loaded && !loadingWatchlist && (
            <p className="text-xs text-surface-400">
              Click &quot;Load Watchlist&quot; to fetch live prices (requires
              backend running)
            </p>
          )}

          {loadingWatchlist && (
            <div className="text-center py-6 text-surface-400 text-xs">
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <p className="mt-2">
                Fetching data for {WATCHLIST_SYMBOLS.length} symbols...
              </p>
            </div>
          )}

          {loaded && watchlist.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-700 text-surface-400">
                    <th className="text-left py-2.5 px-2 font-medium">
                      Symbol
                    </th>
                    <th className="text-right py-2.5 px-2 font-medium">
                      Price
                    </th>
                    <th className="text-right py-2.5 px-2 font-medium">
                      Change
                    </th>
                    <th className="text-right py-2.5 px-2 font-medium">%</th>
                    <th className="text-right py-2.5 px-2 font-medium">
                      30D Trend
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.map((item) => {
                    const positive = item.change >= 0;
                    return (
                      <tr
                        key={item.symbol}
                        className="border-b border-surface-700/50 last:border-0 hover:bg-surface-700/30 transition-colors"
                      >
                        <td className="py-2.5 px-2">
                          <Link
                            href={`/chart?symbol=${item.symbol}`}
                            className="font-semibold text-surface-100 hover:text-brand-500 transition-colors"
                          >
                            {item.symbol}
                          </Link>
                        </td>
                        <td className="text-right py-2.5 px-2 font-mono text-surface-200">
                          ${item.price.toFixed(2)}
                        </td>
                        <td
                          className={`text-right py-2.5 px-2 font-mono ${
                            positive ? "text-[#26a69a]" : "text-[#ef5350]"
                          }`}
                        >
                          {positive ? "+" : ""}
                          {item.change.toFixed(2)}
                        </td>
                        <td
                          className={`text-right py-2.5 px-2 font-mono ${
                            positive ? "text-[#26a69a]" : "text-[#ef5350]"
                          }`}
                        >
                          {positive ? "+" : ""}
                          {item.changePct.toFixed(2)}%
                        </td>
                        <td className="text-right py-2.5 px-2">
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
            <p className="text-xs text-surface-400 text-center py-4">
              Could not fetch data. Make sure the backend is running on port
              8000.
            </p>
          )}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {FEATURE_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-surface-800 rounded-lg border border-surface-700 p-4 hover:border-brand-500/30 hover:bg-surface-800/80 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="text-surface-400 group-hover:text-brand-500 transition-colors">
                {card.icon}
              </div>
              <h3 className="text-sm font-semibold text-surface-100 group-hover:text-brand-500 transition-colors">
                {card.title}
              </h3>
            </div>
            <p className="text-[11px] text-surface-400 leading-relaxed">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
