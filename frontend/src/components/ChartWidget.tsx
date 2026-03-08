"use client";

import { useEffect, useRef } from "react";
import { createChart, IChartApi, CandlestickData, HistogramData, Time } from "lightweight-charts";
import { OHLCVBar } from "@/lib/api";

interface ChartWidgetProps {
  data: OHLCVBar[];
  height?: number;
}

export default function ChartWidget({ data, height = 500 }: ChartWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    if (chartRef.current) {
      try { chartRef.current.remove(); } catch { /* already disposed */ }
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { color: "#111720" },
        textColor: "#8b949e",
      },
      grid: {
        vertLines: { color: "#1e2636" },
        horzLines: { color: "#1e2636" },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: "#2a3347",
      },
      timeScale: {
        borderColor: "#2a3347",
        timeVisible: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#3fb950",
      downColor: "#f85149",
      borderUpColor: "#3fb950",
      borderDownColor: "#f85149",
      wickUpColor: "#3fb950",
      wickDownColor: "#f85149",
    });

    const candleData: CandlestickData[] = data.map((bar) => ({
      time: bar.date as Time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));

    candleSeries.setData(candleData);

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const volumeData: HistogramData[] = data.map((bar) => ({
      time: bar.date as Time,
      value: bar.volume,
      color: bar.close >= bar.open ? "rgba(63,185,80,0.3)" : "rgba(248,81,73,0.3)",
    }));

    volumeSeries.setData(volumeData);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      try { chart.remove(); } catch { /* already disposed */ }
      chartRef.current = null;
    };
  }, [data, height]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden border border-surface-600"
    />
  );
}
