"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  HistogramData,
  Time,
  LineStyle,
  IPriceLine,
  MouseEventParams,
  LogicalRange,
} from "lightweight-charts";
import { OHLCVBar } from "@/lib/api";
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  IndicatorPoint,
} from "@/lib/indicators";

export type ChartType = "candlestick" | "line" | "area";

export interface OverlayIndicator {
  id: string;
  type: "sma" | "ema" | "bb" | "vwap";
  period?: number;
  color?: string;
}

export interface DrawingPoint {
  time: Time;
  price: number;
}

export interface Drawing {
  id: string;
  type: "hline" | "trendline";
  color: string;
  price?: number;
  points?: [DrawingPoint, DrawingPoint];
}

export interface CrosshairInfo {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePct: number;
}

export interface ChartWidgetHandle {
  getChartApi: () => IChartApi | null;
  getVisibleRange: () => LogicalRange | null;
  setVisibleRange: (range: LogicalRange) => void;
}

interface ChartWidgetProps {
  data: OHLCVBar[];
  height?: number;
  chartType?: ChartType;
  overlayIndicators?: OverlayIndicator[];
  drawings?: Drawing[];
  onDrawingsChange?: (drawings: Drawing[]) => void;
  activeDrawingTool?: "hline" | "trendline" | null;
  onCrosshairData?: (data: CrosshairInfo | null) => void;
  showVolume?: boolean;
}

const CHART_COLORS = {
  background: "#131722",
  text: "#787B86",
  textBright: "#D1D4DC",
  grid: "#1e222d",
  border: "#2A2E39",
  upColor: "#26a69a",
  downColor: "#ef5350",
  volumeUp: "rgba(38,166,154,0.25)",
  volumeDown: "rgba(239,83,80,0.25)",
};

const INDICATOR_COLORS = [
  "#2962FF",
  "#FF6D00",
  "#AB47BC",
  "#26A69A",
  "#EF5350",
  "#42A5F5",
];

const ChartWidget = forwardRef<ChartWidgetHandle, ChartWidgetProps>(
  function ChartWidget(
    {
      data,
      height = 500,
      chartType = "candlestick",
      overlayIndicators = [],
      drawings = [],
      onDrawingsChange,
      activeDrawingTool,
      onCrosshairData,
      showVolume = true,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const mainSeriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | ISeriesApi<"Area"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const indicatorSeriesRef = useRef<ISeriesApi<"Line">[]>([]);
    const priceLinesRef = useRef<IPriceLine[]>([]);
    const svgRef = useRef<SVGSVGElement>(null);

    const [pendingPoint, setPendingPoint] = useState<DrawingPoint | null>(null);
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
    const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
    const dataMapRef = useRef<Map<string, OHLCVBar>>(new Map());

    useImperativeHandle(ref, () => ({
      getChartApi: () => chartRef.current,
      getVisibleRange: () =>
        chartRef.current?.timeScale().getVisibleLogicalRange() ?? null,
      setVisibleRange: (range: LogicalRange) =>
        chartRef.current?.timeScale().setVisibleLogicalRange(range),
    }));

    useEffect(() => {
      const map = new Map<string, OHLCVBar>();
      data.forEach((bar) => map.set(bar.date, bar));
      dataMapRef.current = map;
    }, [data]);

    useEffect(() => {
      if (!containerRef.current || data.length === 0) return;

      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch {
          /* already disposed */
        }
        chartRef.current = null;
        mainSeriesRef.current = null;
        volumeSeriesRef.current = null;
        indicatorSeriesRef.current = [];
        priceLinesRef.current = [];
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
          scaleMargins: { top: 0.05, bottom: showVolume ? 0.2 : 0.05 },
        },
        timeScale: {
          borderColor: CHART_COLORS.border,
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: { vertTouchDrag: false },
      });

      // Main series
      let mainSeries: typeof mainSeriesRef.current;
      if (chartType === "line") {
        mainSeries = chart.addLineSeries({
          color: CHART_COLORS.upColor,
          lineWidth: 2,
        });
        const lineData: LineData[] = data.map((bar) => ({
          time: bar.date as Time,
          value: bar.close,
        }));
        mainSeries.setData(lineData);
      } else if (chartType === "area") {
        mainSeries = chart.addAreaSeries({
          lineColor: CHART_COLORS.upColor,
          topColor: "rgba(38,166,154,0.28)",
          bottomColor: "rgba(38,166,154,0.02)",
          lineWidth: 2,
        }) as unknown as typeof mainSeriesRef.current;
        const areaData: LineData[] = data.map((bar) => ({
          time: bar.date as Time,
          value: bar.close,
        }));
        (mainSeries as ISeriesApi<"Area">).setData(areaData);
      } else {
        mainSeries = chart.addCandlestickSeries({
          upColor: CHART_COLORS.upColor,
          downColor: CHART_COLORS.downColor,
          borderUpColor: CHART_COLORS.upColor,
          borderDownColor: CHART_COLORS.downColor,
          wickUpColor: CHART_COLORS.upColor,
          wickDownColor: CHART_COLORS.downColor,
        });
        const candleData: CandlestickData[] = data.map((bar) => ({
          time: bar.date as Time,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
        }));
        mainSeries.setData(candleData);
      }
      mainSeriesRef.current = mainSeries;

      // Volume
      if (showVolume) {
        const volumeSeries = chart.addHistogramSeries({
          priceFormat: { type: "volume" },
          priceScaleId: "volume",
        });
        chart.priceScale("volume").applyOptions({
          scaleMargins: { top: 0.85, bottom: 0 },
        });
        const volumeData: HistogramData[] = data.map((bar) => ({
          time: bar.date as Time,
          value: bar.volume,
          color:
            bar.close >= bar.open
              ? CHART_COLORS.volumeUp
              : CHART_COLORS.volumeDown,
        }));
        volumeSeries.setData(volumeData);
        volumeSeriesRef.current = volumeSeries;
      }

      // Overlay indicators
      const newIndicatorSeries: ISeriesApi<"Line">[] = [];
      overlayIndicators.forEach((indicator, idx) => {
        const color = indicator.color || INDICATOR_COLORS[idx % INDICATOR_COLORS.length];
        let points: IndicatorPoint[] = [];

        if (indicator.type === "sma") {
          points = calculateSMA(data, indicator.period || 20);
        } else if (indicator.type === "ema") {
          points = calculateEMA(data, indicator.period || 20);
        } else if (indicator.type === "bb") {
          const bb = calculateBollingerBands(data, indicator.period || 20);
          const upperSeries = chart.addLineSeries({
            color: "rgba(41,98,255,0.4)",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
          });
          upperSeries.setData(
            bb.upper.map((p) => ({ time: p.time, value: p.value }))
          );
          newIndicatorSeries.push(upperSeries);

          const middleSeries = chart.addLineSeries({
            color: "rgba(41,98,255,0.6)",
            lineWidth: 1,
          });
          middleSeries.setData(
            bb.middle.map((p) => ({ time: p.time, value: p.value }))
          );
          newIndicatorSeries.push(middleSeries);

          const lowerSeries = chart.addLineSeries({
            color: "rgba(41,98,255,0.4)",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
          });
          lowerSeries.setData(
            bb.lower.map((p) => ({ time: p.time, value: p.value }))
          );
          newIndicatorSeries.push(lowerSeries);
          return;
        }

        if (points.length > 0) {
          const series = chart.addLineSeries({
            color,
            lineWidth: 1,
          });
          series.setData(
            points.map((p) => ({ time: p.time, value: p.value }))
          );
          newIndicatorSeries.push(series);
        }
      });
      indicatorSeriesRef.current = newIndicatorSeries;

      // Horizontal line drawings (use native price lines)
      const priceLines: IPriceLine[] = [];
      drawings.forEach((d) => {
        if (d.type === "hline" && d.price != null && mainSeries) {
          const pl = mainSeries.createPriceLine({
            price: d.price,
            color: d.color || "#787B86",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
          });
          priceLines.push(pl);
        }
      });
      priceLinesRef.current = priceLines;

      chart.timeScale().fitContent();
      chartRef.current = chart;

      // Crosshair data reporting
      chart.subscribeCrosshairMove((param: MouseEventParams) => {
        if (!param.time || !param.point) {
          onCrosshairData?.(null);
          setCursorPos(null);
          return;
        }

        setCursorPos({ x: param.point.x, y: param.point.y });

        const bar = dataMapRef.current.get(param.time as string);
        if (bar) {
          const prevIdx = data.findIndex((b) => b.date === bar.date) - 1;
          const prevClose = prevIdx >= 0 ? data[prevIdx].close : bar.open;
          const change = bar.close - prevClose;
          const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0;
          onCrosshairData?.({
            time: param.time,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            volume: bar.volume,
            change,
            changePct,
          });
        }
      });

      // Click handler for drawing tools
      chart.subscribeClick((param: MouseEventParams) => {
        if (!activeDrawingTool || !param.time || !param.point || !mainSeries) return;

        const rawPrice = (mainSeries as ISeriesApi<"Candlestick">).coordinateToPrice(param.point.y);
        if (rawPrice === null) return;
        const price = rawPrice as number;
        const time = param.time;

        if (activeDrawingTool === "hline") {
          const newDrawing: Drawing = {
            id: `hline_${Date.now()}`,
            type: "hline",
            price,
            color: "#787B86",
          };
          onDrawingsChange?.([...drawings, newDrawing]);
        } else if (activeDrawingTool === "trendline") {
          if (!pendingPoint) {
            setPendingPoint({ time, price });
          } else {
            const newDrawing: Drawing = {
              id: `trendline_${Date.now()}`,
              type: "trendline",
              points: [pendingPoint, { time, price }],
              color: "#2962FF",
            };
            onDrawingsChange?.([...drawings, newDrawing]);
            setPendingPoint(null);
          }
        }
      });

      // Update SVG dimensions
      const updateDimensions = () => {
        if (containerRef.current) {
          setSvgDimensions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      };
      updateDimensions();

      // Resize handler
      const handleResize = () => {
        if (containerRef.current) {
          chart.applyOptions({ width: containerRef.current.clientWidth });
          updateDimensions();
        }
      };
      window.addEventListener("resize", handleResize);

      // Re-render SVG on visible range change
      chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
        setSvgDimensions((prev) => ({ ...prev }));
      });

      return () => {
        window.removeEventListener("resize", handleResize);
        try {
          chart.remove();
        } catch {
          /* already disposed */
        }
        chartRef.current = null;
        mainSeriesRef.current = null;
        volumeSeriesRef.current = null;
        indicatorSeriesRef.current = [];
        priceLinesRef.current = [];
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, height, chartType, overlayIndicators, drawings, showVolume]);

    const getTrendlineSVGPoints = useCallback(
      (drawing: Drawing): { x1: number; y1: number; x2: number; y2: number } | null => {
        if (
          drawing.type !== "trendline" ||
          !drawing.points ||
          !chartRef.current ||
          !mainSeriesRef.current
        )
          return null;

        const chart = chartRef.current;
        const series = mainSeriesRef.current as ISeriesApi<"Candlestick">;
        const [p1, p2] = drawing.points;

        const x1 = chart.timeScale().timeToCoordinate(p1.time);
        const y1 = series.priceToCoordinate(p1.price);
        const x2 = chart.timeScale().timeToCoordinate(p2.time);
        const y2 = series.priceToCoordinate(p2.price);

        if (x1 === null || y1 === null || x2 === null || y2 === null)
          return null;

        return { x1, y1, x2, y2 };
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [svgDimensions]
    );

    const getPendingLineSVGPoints = useCallback((): {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    } | null => {
      if (
        !pendingPoint ||
        !cursorPos ||
        !chartRef.current ||
        !mainSeriesRef.current
      )
        return null;

      const chart = chartRef.current;
      const series = mainSeriesRef.current as ISeriesApi<"Candlestick">;

      const x1 = chart.timeScale().timeToCoordinate(pendingPoint.time);
      const y1 = series.priceToCoordinate(pendingPoint.price);

      if (x1 === null || y1 === null) return null;
      return { x1, y1, x2: cursorPos.x, y2: cursorPos.y };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingPoint, cursorPos, svgDimensions]);

    return (
      <div className="relative" ref={containerRef}>
        <svg
          ref={svgRef}
          className="absolute inset-0 z-10"
          width={svgDimensions.width}
          height={svgDimensions.height}
          style={{ pointerEvents: "none" }}
        >
          {/* Trendline drawings */}
          {drawings
            .filter((d) => d.type === "trendline")
            .map((d) => {
              const pts = getTrendlineSVGPoints(d);
              if (!pts) return null;
              return (
                <line
                  key={d.id}
                  x1={pts.x1}
                  y1={pts.y1}
                  x2={pts.x2}
                  y2={pts.y2}
                  stroke={d.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              );
            })}

          {/* Pending trendline preview */}
          {activeDrawingTool === "trendline" &&
            (() => {
              const pts = getPendingLineSVGPoints();
              if (!pts) return null;
              return (
                <line
                  x1={pts.x1}
                  y1={pts.y1}
                  x2={pts.x2}
                  y2={pts.y2}
                  stroke="#2962FF"
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  strokeLinecap="round"
                />
              );
            })()}
        </svg>
      </div>
    );
  }
);

export default ChartWidget;
