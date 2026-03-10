"use client";

import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  HistogramData,
  Time,
  LineStyle,
  LogicalRange,
} from "lightweight-charts";
import { OHLCVBar } from "@/lib/api";
import { calculateRSI, calculateMACD } from "@/lib/indicators";

export interface IndicatorPaneHandle {
  getChartApi: () => IChartApi | null;
  setVisibleRange: (range: LogicalRange) => void;
}

interface IndicatorPaneProps {
  type: "rsi" | "macd";
  data: OHLCVBar[];
  height?: number;
  period?: number;
  onVisibleRangeChange?: (range: LogicalRange | null) => void;
}

const CHART_COLORS = {
  background: "#131722",
  text: "#787B86",
  grid: "#1e222d",
  border: "#2A2E39",
};

const IndicatorPane = forwardRef<IndicatorPaneHandle, IndicatorPaneProps>(
  function IndicatorPane(
    { type, data, height = 120, period, onVisibleRangeChange },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useImperativeHandle(ref, () => ({
      getChartApi: () => chartRef.current,
      setVisibleRange: (range: LogicalRange) => {
        chartRef.current?.timeScale().setVisibleLogicalRange(range);
      },
    }));

    useEffect(() => {
      if (!containerRef.current || data.length === 0) return;

      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch {
          /* already disposed */
        }
        chartRef.current = null;
      }

      const chart = createChart(containerRef.current, {
        height,
        layout: {
          background: { color: CHART_COLORS.background },
          textColor: CHART_COLORS.text,
          fontFamily:
            "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: CHART_COLORS.grid },
          horzLines: { color: CHART_COLORS.grid },
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
        rightPriceScale: {
          borderColor: CHART_COLORS.border,
        },
        timeScale: {
          borderColor: CHART_COLORS.border,
          visible: false,
        },
        handleScroll: { vertTouchDrag: false },
      });

      if (type === "rsi") {
        const rsiData = calculateRSI(data, period || 14);
        const series = chart.addLineSeries({
          color: "#AB47BC",
          lineWidth: 1,
          priceFormat: { type: "custom", formatter: (v: number) => v.toFixed(1) },
        });
        const lineData: LineData[] = rsiData.map((p) => ({
          time: p.time,
          value: p.value,
        }));
        series.setData(lineData);

        // Overbought / oversold lines
        series.createPriceLine({
          price: 70,
          color: "rgba(239,83,80,0.5)",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
        });
        series.createPriceLine({
          price: 30,
          color: "rgba(38,166,154,0.5)",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
        });

        chart.priceScale("right").applyOptions({
          scaleMargins: { top: 0.1, bottom: 0.1 },
          autoScale: false,
        });
      } else if (type === "macd") {
        const macdData = calculateMACD(data);

        const macdSeries = chart.addLineSeries({
          color: "#2962FF",
          lineWidth: 1,
          priceFormat: { type: "custom", formatter: (v: number) => v.toFixed(2) },
        });
        macdSeries.setData(
          macdData.macd.map((p) => ({ time: p.time, value: p.value }))
        );

        const signalSeries = chart.addLineSeries({
          color: "#FF6D00",
          lineWidth: 1,
        });
        signalSeries.setData(
          macdData.signal.map((p) => ({ time: p.time, value: p.value }))
        );

        const histSeries = chart.addHistogramSeries({
          priceFormat: { type: "custom", formatter: (v: number) => v.toFixed(2) },
        });
        const histData: HistogramData[] = macdData.histogram.map((p) => ({
          time: p.time,
          value: p.value,
          color:
            p.value >= 0
              ? "rgba(38,166,154,0.6)"
              : "rgba(239,83,80,0.6)",
        }));
        histSeries.setData(histData);

        chart.priceScale("right").applyOptions({
          scaleMargins: { top: 0.1, bottom: 0.1 },
        });
      }

      chart.timeScale().fitContent();
      chartRef.current = chart;

      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        onVisibleRangeChange?.(range);
      });

      const handleResize = () => {
        if (containerRef.current) {
          chart.applyOptions({ width: containerRef.current.clientWidth });
        }
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        try {
          chart.remove();
        } catch {
          /* already disposed */
        }
        chartRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, height, type, period]);

    const label = type === "rsi" ? `RSI (${period || 14})` : "MACD (12,26,9)";

    return (
      <div className="border-t border-[#2A2E39]">
        <div className="flex items-center px-3 py-1 bg-[#131722]">
          <span className="text-[10px] font-medium text-[#787B86] uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div ref={containerRef} className="w-full" />
      </div>
    );
  }
);

export default IndicatorPane;
