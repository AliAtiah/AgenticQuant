const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API error ${res.status}: ${detail}`);
  }

  return res.json();
}

export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataResponse {
  symbol: string;
  bars: OHLCVBar[];
  currency: string;
}

export interface BacktestMetrics {
  initial_capital: number;
  final_value: number;
  total_return_pct: number;
  max_drawdown_pct: number;
  sharpe_ratio: number;
  total_trades: number;
  win_rate_pct: number;
}

export interface BacktestResponse {
  strategy: string;
  symbol: string;
  metrics: BacktestMetrics;
  equity_curve: { date: string; value: number }[];
  trades: { date: string; action: string; price: number; shares: number }[];
}

export interface StrategyInfo {
  name: string;
  display_name: string;
  description: string;
  parameters: Record<string, number>;
}

export interface AgentResponse {
  symbol: string;
  analysis: string;
  recommendation: string | null;
  confidence: string | null;
}

export const api = {
  getMarketData: (symbol: string, period = "6mo", interval = "1d") =>
    apiFetch<MarketDataResponse>(
      `/market/${symbol}?period=${period}&interval=${interval}`
    ),

  getQuote: (symbol: string) =>
    apiFetch<Record<string, unknown>>(`/market/${symbol}/quote`),

  runBacktest: (params: {
    strategy: string;
    symbol: string;
    start_date: string;
    end_date: string;
    initial_capital?: number;
    parameters?: Record<string, number>;
  }) =>
    apiFetch<BacktestResponse>("/backtest/run", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  getStrategies: () => apiFetch<StrategyInfo[]>("/strategies/"),

  analyzeMarket: (params: {
    symbol: string;
    question?: string;
    include_technicals?: boolean;
  }) =>
    apiFetch<AgentResponse>("/agents/analyze", {
      method: "POST",
      body: JSON.stringify(params),
    }),
};
