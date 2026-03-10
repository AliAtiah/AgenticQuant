"use client";

import { useEffect, useRef } from "react";
import { createChart, IChartApi, Time, LineStyle } from "lightweight-charts";
import { BacktestResponse } from "@/lib/api";

interface BacktestResultsProps {
  result: BacktestResponse;
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-surface-900 rounded-lg p-3 border border-surface-700">
      <p className="text-[10px] text-surface-400 mb-0.5 uppercase tracking-wider font-medium">
        {label}
      </p>
      <p className={`text-sm font-bold font-mono ${color || "text-surface-100"}`}>
        {value}
      </p>
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
      try {
        chartInstance.current.remove();
      } catch {
        /* already disposed */
      }
      chartInstance.current = null;
    }

    const chart = createChart(chartRef.current, {
      height: 280,
      layout: {
        background: { color: "#131722" },
        textColor: "#787B86",
        fontFamily: "'SF Mono', 'Monaco', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1e222d" },
        horzLines: { color: "#1e222d" },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: "rgba(120,123,134,0.4)",
          style: LineStyle.Dashed,
          labelBackgroundColor: "#2A2E39",
        },
        horzLine: {
          color: "rgba(120,123,134,0.4)",
          style: LineStyle.Dashed,
          labelBackgroundColor: "#2A2E39",
        },
      },
      rightPriceScale: { borderColor: "#2A2E39" },
      timeScale: { borderColor: "#2A2E39" },
    });

    const series = chart.addAreaSeries({
      lineColor: returnPositive ? "#26a69a" : "#ef5350",
      topColor: returnPositive
        ? "rgba(38,166,154,0.25)"
        : "rgba(239,83,80,0.25)",
      bottomColor: returnPositive
        ? "rgba(38,166,154,0.02)"
        : "rgba(239,83,80,0.02)",
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
      if (chartRef.current)
        chart.applyOptions({ width: chartRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      try {
        chart.remove();
      } catch {
        /* already disposed */
      }
      chartInstance.current = null;
    };
  }, [result, returnPositive]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <MetricCard
          label="Initial Capital"
          value={`$${metrics.initial_capital.toLocaleString()}`}
        />
        <MetricCard
          label="Final Value"
          value={`$${metrics.final_value.toLocaleString()}`}
        />
        <MetricCard
          label="Total Return"
          value={`${returnPositive ? "+" : ""}${metrics.total_return_pct}%`}
          color={returnPositive ? "text-[#26a69a]" : "text-[#ef5350]"}
        />
        <MetricCard
          label="Max Drawdown"
          value={`${metrics.max_drawdown_pct}%`}
          color="text-[#ef5350]"
        />
        <MetricCard
          label="Sharpe Ratio"
          value={metrics.sharpe_ratio.toFixed(2)}
        />
        <MetricCard
          label="Total Trades"
          value={String(metrics.total_trades)}
        />
        <MetricCard label="Win Rate" value={`${metrics.win_rate_pct}%`} />
      </div>

      <div>
        <h3 className="text-[10px] font-medium text-surface-400 mb-2 uppercase tracking-wider">
          Equity Curve
        </h3>
        <div
          ref={chartRef}
          className="w-full rounded-lg overflow-hidden border border-surface-700"
        />
      </div>

      {result.trades.length > 0 && (
        <div>
          <h3 className="text-[10px] font-medium text-surface-400 mb-2 uppercase tracking-wider">
            Trade Log ({result.trades.length} trades)
          </h3>
          <div className="bg-surface-800 rounded-lg border border-surface-700 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-700 text-surface-400">
                  <th className="text-left p-2.5 font-medium">Date</th>
                  <th className="text-left p-2.5 font-medium">Action</th>
                  <th className="text-right p-2.5 font-medium">Price</th>
                  <th className="text-right p-2.5 font-medium">Shares</th>
                </tr>
              </thead>
              <tbody>
                {result.trades.map((trade, i) => (
                  <tr
                    key={i}
                    className="border-b border-surface-700/50 last:border-0 hover:bg-surface-700/30 transition-colors"
                  >
                    <td className="p-2.5 text-surface-300 font-mono">
                      {trade.date}
                    </td>
                    <td
                      className={`p-2.5 font-semibold ${
                        trade.action === "BUY"
                          ? "text-[#26a69a]"
                          : "text-[#ef5350]"
                      }`}
                    >
                      {trade.action}
                    </td>
                    <td className="p-2.5 text-right font-mono text-surface-200">
                      ${trade.price.toFixed(2)}
                    </td>
                    <td className="p-2.5 text-right font-mono text-surface-300">
                      {trade.shares}
                    </td>
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
