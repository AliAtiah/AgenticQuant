"use client";

import { useEffect, useRef } from "react";
import { createChart, IChartApi, Time } from "lightweight-charts";
import { BacktestResponse } from "@/lib/api";

interface BacktestResultsProps {
  result: BacktestResponse;
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface-700 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color || "text-white"}`}>{value}</p>
    </div>
  );
}

export default function BacktestResults({ result }: BacktestResultsProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<IChartApi | null>(null);

  const { metrics } = result;
  const returnPositive = metrics.total_return_pct >= 0;

  useEffect(() => {
    if (!chartRef.current || result.equity_curve.length === 0) return;

    if (chartInstance.current) {
      try { chartInstance.current.remove(); } catch { /* already disposed */ }
      chartInstance.current = null;
    }

    const chart = createChart(chartRef.current, {
      height: 300,
      layout: {
        background: { color: "#111720" },
        textColor: "#8b949e",
      },
      grid: {
        vertLines: { color: "#1e2636" },
        horzLines: { color: "#1e2636" },
      },
      rightPriceScale: { borderColor: "#2a3347" },
      timeScale: { borderColor: "#2a3347" },
    });

    const series = chart.addAreaSeries({
      lineColor: returnPositive ? "#3fb950" : "#f85149",
      topColor: returnPositive ? "rgba(63,185,80,0.3)" : "rgba(248,81,73,0.3)",
      bottomColor: returnPositive ? "rgba(63,185,80,0.02)" : "rgba(248,81,73,0.02)",
      lineWidth: 2,
    });

    series.setData(
      result.equity_curve.map((point) => ({
        time: point.date as Time,
        value: point.value,
      }))
    );

    chart.timeScale().fitContent();
    chartInstance.current = chart;

    const handleResize = () => {
      if (chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      try { chart.remove(); } catch { /* already disposed */ }
      chartInstance.current = null;
    };
  }, [result, returnPositive]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard label="Initial Capital" value={`$${metrics.initial_capital.toLocaleString()}`} />
        <MetricCard label="Final Value" value={`$${metrics.final_value.toLocaleString()}`} />
        <MetricCard
          label="Total Return"
          value={`${returnPositive ? "+" : ""}${metrics.total_return_pct}%`}
          color={returnPositive ? "text-green-400" : "text-red-400"}
        />
        <MetricCard
          label="Max Drawdown"
          value={`${metrics.max_drawdown_pct}%`}
          color="text-red-400"
        />
        <MetricCard label="Sharpe Ratio" value={metrics.sharpe_ratio.toFixed(2)} />
        <MetricCard label="Total Trades" value={String(metrics.total_trades)} />
        <MetricCard label="Win Rate" value={`${metrics.win_rate_pct}%`} />
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Equity Curve</h3>
        <div ref={chartRef} className="w-full rounded-lg overflow-hidden border border-surface-600" />
      </div>

      {result.trades.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            Trade Log ({result.trades.length} trades)
          </h3>
          <div className="bg-surface-800 rounded-lg border border-surface-600 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-600 text-gray-500">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Action</th>
                  <th className="text-right p-3">Price</th>
                  <th className="text-right p-3">Shares</th>
                </tr>
              </thead>
              <tbody>
                {result.trades.map((trade, i) => (
                  <tr key={i} className="border-b border-surface-700 last:border-0">
                    <td className="p-3 text-gray-300">{trade.date}</td>
                    <td className={`p-3 font-medium ${trade.action === "BUY" ? "text-green-400" : "text-red-400"}`}>
                      {trade.action}
                    </td>
                    <td className="p-3 text-right">${trade.price.toFixed(2)}</td>
                    <td className="p-3 text-right">{trade.shares}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
