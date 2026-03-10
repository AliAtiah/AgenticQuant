"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ChartWidget, {
  ChartType,
  OverlayIndicator,
  Drawing,
  CrosshairInfo,
  ChartWidgetHandle,
} from "@/components/ChartWidget";
import IndicatorPane, {
  IndicatorPaneHandle,
} from "@/components/IndicatorPane";
import { api, OHLCVBar } from "@/lib/api";
import { LogicalRange } from "lightweight-charts";

const PERIODS = [
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
  { label: "2Y", value: "2y" },
  { label: "5Y", value: "5y" },
];

const INTERVALS = [
  { label: "1D", value: "1d" },
  { label: "1W", value: "1wk" },
  { label: "1M", value: "1mo" },
];

const OVERLAY_OPTIONS: { id: string; label: string; type: OverlayIndicator["type"]; period?: number; color?: string }[] = [
  { id: "sma_20", label: "SMA (20)", type: "sma", period: 20, color: "#2962FF" },
  { id: "sma_50", label: "SMA (50)", type: "sma", period: 50, color: "#FF6D00" },
  { id: "sma_200", label: "SMA (200)", type: "sma", period: 200, color: "#AB47BC" },
  { id: "ema_12", label: "EMA (12)", type: "ema", period: 12, color: "#26A69A" },
  { id: "ema_26", label: "EMA (26)", type: "ema", period: 26, color: "#EF5350" },
  { id: "bb_20", label: "Bollinger Bands", type: "bb", period: 20, color: "#2962FF" },
];

const CHART_TYPES: { type: ChartType; icon: JSX.Element; label: string }[] = [
  {
    type: "candlestick",
    label: "Candles",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <rect x="6" y="3" width="2" height="14" rx="0.5" />
        <rect x="12" y="6" width="2" height="10" rx="0.5" />
        <line x1="7" y1="1" x2="7" y2="3" stroke="currentColor" strokeWidth="1" />
        <line x1="7" y1="17" x2="7" y2="19" stroke="currentColor" strokeWidth="1" />
        <line x1="13" y1="4" x2="13" y2="6" stroke="currentColor" strokeWidth="1" />
        <line x1="13" y1="16" x2="13" y2="18" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
  },
  {
    type: "line",
    label: "Line",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <polyline points="2,14 6,8 10,11 14,4 18,9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    type: "area",
    label: "Area",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
        <polyline points="2,14 6,8 10,11 14,4 18,9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2,14 L6,8 L10,11 L14,4 L18,9 L18,18 L2,18 Z" fill="currentColor" opacity="0.15" />
      </svg>
    ),
  },
];

const DRAWING_TOOLS = [
  {
    id: null as string | null,
    label: "Crosshair",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <line x1="10" y1="2" x2="10" y2="18" />
        <line x1="2" y1="10" x2="18" y2="10" />
      </svg>
    ),
  },
  {
    id: "trendline",
    label: "Trend Line",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <line x1="3" y1="16" x2="17" y2="4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "hline",
    label: "Horizontal Line",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <line x1="2" y1="10" x2="18" y2="10" strokeLinecap="round" />
        <line x1="2" y1="10" x2="2" y2="10" strokeLinecap="round" strokeWidth="3" />
        <line x1="18" y1="10" x2="18" y2="10" strokeLinecap="round" strokeWidth="3" />
      </svg>
    ),
  },
];

export default function ChartPage() {
  const [symbol, setSymbol] = useState("AAPL");
  const [inputSymbol, setInputSymbol] = useState("AAPL");
  const [period, setPeriod] = useState("6mo");
  const [interval, setInterval] = useState("1d");
  const [data, setData] = useState<OHLCVBar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [overlayIndicators, setOverlayIndicators] = useState<OverlayIndicator[]>([]);
  const [showIndicatorPanel, setShowIndicatorPanel] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string | null>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [crosshairData, setCrosshairData] = useState<CrosshairInfo | null>(null);

  const mainChartRef = useRef<ChartWidgetHandle>(null);
  const rsiPaneRef = useRef<IndicatorPaneHandle>(null);
  const macdPaneRef = useRef<IndicatorPaneHandle>(null);
  const indicatorPanelRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

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

  const handleSubVisibleRangeChange = useCallback((range: LogicalRange | null) => {
    if (isSyncingRef.current || !range) return;
    isSyncingRef.current = true;
    const mainChart = mainChartRef.current?.getChartApi();
    mainChart?.timeScale().setVisibleLogicalRange(range);
    rsiPaneRef.current?.setVisibleRange(range);
    macdPaneRef.current?.setVisibleRange(range);
    isSyncingRef.current = false;
  }, []);

  // Sync main chart with sub-panes
  useEffect(() => {
    const mainChart = mainChartRef.current?.getChartApi();
    if (!mainChart) return;

    const handler = (range: LogicalRange | null) => {
      if (isSyncingRef.current || !range) return;
      isSyncingRef.current = true;
      rsiPaneRef.current?.setVisibleRange(range);
      macdPaneRef.current?.setVisibleRange(range);
      isSyncingRef.current = false;
    };

    mainChart.timeScale().subscribeVisibleLogicalRangeChange(handler);

    return () => {
      try {
        mainChart.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
      } catch {
        /* chart may already be disposed */
      }
    };
  }, [data, showRSI, showMACD]);

  const toggleOverlayIndicator = (option: typeof OVERLAY_OPTIONS[number]) => {
    setOverlayIndicators((prev) => {
      const exists = prev.find((ind) => ind.id === option.id);
      if (exists) return prev.filter((ind) => ind.id !== option.id);
      return [
        ...prev,
        { id: option.id, type: option.type, period: option.period, color: option.color },
      ];
    });
  };

  // Close indicator panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        indicatorPanelRef.current &&
        !indicatorPanelRef.current.contains(e.target as Node)
      ) {
        setShowIndicatorPanel(false);
      }
    };
    if (showIndicatorPanel) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [showIndicatorPanel]);

  const lastBar = data.length > 0 ? data[data.length - 1] : null;
  const prevBar = data.length > 1 ? data[data.length - 2] : null;
  const displayData = crosshairData || (lastBar && prevBar
    ? {
        open: lastBar.open,
        high: lastBar.high,
        low: lastBar.low,
        close: lastBar.close,
        volume: lastBar.volume,
        change: lastBar.close - prevBar.close,
        changePct: ((lastBar.close - prevBar.close) / prevBar.close) * 100,
      }
    : null);
  const isPositive = displayData ? displayData.close >= displayData.open : true;

  const subChartHeight = 120;
  const mainChartHeight = (() => {
    const base = 600;
    let sub = 0;
    if (showRSI) sub += subChartHeight + 24;
    if (showMACD) sub += subChartHeight + 24;
    return Math.max(300, base - sub);
  })();

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] -m-6">
      {/* Top Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#2A2E39] bg-[#1E222D] flex-shrink-0">
        {/* Symbol */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchData(inputSymbol);
          }}
          className="flex items-center"
        >
          <input
            type="text"
            value={inputSymbol}
            onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
            className="bg-transparent text-[#D1D4DC] font-semibold text-sm w-20 px-2 py-1 rounded hover:bg-[#2A2E39] focus:bg-[#2A2E39] focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="text-[10px] text-[#787B86] hover:text-[#D1D4DC] px-1.5 py-1 rounded hover:bg-[#2A2E39] transition-colors disabled:opacity-40"
          >
            {loading ? "..." : "Go"}
          </button>
        </form>

        <div className="w-px h-5 bg-[#2A2E39] mx-1" />

        {/* Interval */}
        <div className="flex items-center gap-0.5">
          {INTERVALS.map((i) => (
            <button
              key={i.value}
              onClick={() => {
                setInterval(i.value);
                if (data.length > 0) fetchData(symbol, period, i.value);
              }}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                interval === i.value
                  ? "text-[#D1D4DC] bg-[#2962FF22]"
                  : "text-[#787B86] hover:text-[#D1D4DC]"
              }`}
            >
              {i.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-[#2A2E39] mx-1" />

        {/* Period */}
        <div className="flex items-center gap-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                setPeriod(p.value);
                if (data.length > 0) fetchData(symbol, p.value, interval);
              }}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                period === p.value
                  ? "text-[#D1D4DC] bg-[#2962FF22]"
                  : "text-[#787B86] hover:text-[#D1D4DC]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-[#2A2E39] mx-1" />

        {/* Chart Type */}
        <div className="flex items-center gap-0.5">
          {CHART_TYPES.map((ct) => (
            <button
              key={ct.type}
              onClick={() => setChartType(ct.type)}
              title={ct.label}
              className={`p-1.5 rounded transition-colors ${
                chartType === ct.type
                  ? "text-[#D1D4DC] bg-[#2962FF22]"
                  : "text-[#787B86] hover:text-[#D1D4DC]"
              }`}
            >
              {ct.icon}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-[#2A2E39] mx-1" />

        {/* Indicators Button */}
        <div className="relative" ref={indicatorPanelRef}>
          <button
            onClick={() => setShowIndicatorPanel(!showIndicatorPanel)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              overlayIndicators.length > 0 || showRSI || showMACD
                ? "text-[#2962FF]"
                : "text-[#787B86] hover:text-[#D1D4DC]"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M2 15 L6 8 L10 12 L14 5 L18 10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Indicators
            {(overlayIndicators.length > 0 || showRSI || showMACD) && (
              <span className="bg-[#2962FF] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                {overlayIndicators.length + (showRSI ? 1 : 0) + (showMACD ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Indicator Dropdown */}
          {showIndicatorPanel && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#1E222D] border border-[#2A2E39] rounded-lg shadow-2xl z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-[#2A2E39]">
                <span className="text-[10px] text-[#787B86] uppercase tracking-wider font-semibold">
                  Overlays
                </span>
              </div>
              {OVERLAY_OPTIONS.map((opt) => {
                const active = overlayIndicators.some((i) => i.id === opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleOverlayIndicator(opt)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs hover:bg-[#2A2E39] transition-colors"
                  >
                    <div
                      className={`w-3 h-3 rounded-sm border ${
                        active
                          ? "bg-[#2962FF] border-[#2962FF]"
                          : "border-[#787B86]"
                      } flex items-center justify-center`}
                    >
                      {active && (
                        <svg viewBox="0 0 12 12" className="w-2 h-2 text-white" fill="currentColor">
                          <path d="M9.7 3.3a1 1 0 0 1 0 1.4l-4 4a1 1 0 0 1-1.4 0l-2-2a1 1 0 0 1 1.4-1.4L5 6.6l3.3-3.3a1 1 0 0 1 1.4 0z" />
                        </svg>
                      )}
                    </div>
                    <span
                      className="w-2 h-0.5 rounded"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className={active ? "text-[#D1D4DC]" : "text-[#787B86]"}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}

              <div className="px-3 py-2 border-t border-[#2A2E39]">
                <span className="text-[10px] text-[#787B86] uppercase tracking-wider font-semibold">
                  Oscillators
                </span>
              </div>
              <button
                onClick={() => setShowRSI(!showRSI)}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs hover:bg-[#2A2E39] transition-colors"
              >
                <div
                  className={`w-3 h-3 rounded-sm border ${
                    showRSI ? "bg-[#2962FF] border-[#2962FF]" : "border-[#787B86]"
                  } flex items-center justify-center`}
                >
                  {showRSI && (
                    <svg viewBox="0 0 12 12" className="w-2 h-2 text-white" fill="currentColor">
                      <path d="M9.7 3.3a1 1 0 0 1 0 1.4l-4 4a1 1 0 0 1-1.4 0l-2-2a1 1 0 0 1 1.4-1.4L5 6.6l3.3-3.3a1 1 0 0 1 1.4 0z" />
                    </svg>
                  )}
                </div>
                <span className="w-2 h-0.5 rounded bg-[#AB47BC]" />
                <span className={showRSI ? "text-[#D1D4DC]" : "text-[#787B86]"}>
                  RSI (14)
                </span>
              </button>
              <button
                onClick={() => setShowMACD(!showMACD)}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs hover:bg-[#2A2E39] transition-colors"
              >
                <div
                  className={`w-3 h-3 rounded-sm border ${
                    showMACD ? "bg-[#2962FF] border-[#2962FF]" : "border-[#787B86]"
                  } flex items-center justify-center`}
                >
                  {showMACD && (
                    <svg viewBox="0 0 12 12" className="w-2 h-2 text-white" fill="currentColor">
                      <path d="M9.7 3.3a1 1 0 0 1 0 1.4l-4 4a1 1 0 0 1-1.4 0l-2-2a1 1 0 0 1 1.4-1.4L5 6.6l3.3-3.3a1 1 0 0 1 1.4 0z" />
                    </svg>
                  )}
                </div>
                <span className="w-2 h-0.5 rounded bg-[#2962FF]" />
                <span className={showMACD ? "text-[#D1D4DC]" : "text-[#787B86]"}>
                  MACD (12, 26, 9)
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Clear Drawings */}
        {drawings.length > 0 && (
          <button
            onClick={() => setDrawings([])}
            className="text-[11px] text-[#787B86] hover:text-[#EF5350] px-2 py-1 rounded hover:bg-[#2A2E39] transition-colors"
            title="Clear all drawings"
          >
            Clear Drawings
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Drawing Toolbar (Left) */}
        <div className="flex flex-col items-center w-10 border-r border-[#2A2E39] bg-[#1E222D] py-2 gap-0.5 flex-shrink-0">
          {DRAWING_TOOLS.map((tool) => (
            <button
              key={tool.id ?? "cursor"}
              onClick={() => setActiveDrawingTool(tool.id)}
              title={tool.label}
              className={`p-2 rounded transition-colors ${
                activeDrawingTool === tool.id
                  ? "text-[#D1D4DC] bg-[#2962FF33]"
                  : "text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E39]"
              }`}
            >
              {tool.icon}
            </button>
          ))}

          <div className="w-5 h-px bg-[#2A2E39] my-1" />

          {/* Delete all drawings */}
          {drawings.length > 0 && (
            <button
              onClick={() => setDrawings([])}
              title="Delete all drawings"
              className="p-2 rounded text-[#787B86] hover:text-[#EF5350] hover:bg-[#2A2E39] transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                <path d="M4 6h12M8 6V4h4v2m-6 0v10h8V6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Chart Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#131722]">
          {error && (
            <div className="m-2 bg-[#ef535022] border border-[#ef535044] text-[#EF5350] rounded px-3 py-2 text-xs">
              {error}
            </div>
          )}

          {data.length > 0 ? (
            <>
              {/* OHLCV Legend */}
              <div className="flex items-center gap-3 px-3 py-1.5 text-[11px] flex-shrink-0 z-20">
                <span className="font-semibold text-[#D1D4DC] text-sm">
                  {symbol}
                </span>
                {displayData && (
                  <>
                    <span className="text-[#787B86]">
                      O{" "}
                      <span className={isPositive ? "text-[#26a69a]" : "text-[#ef5350]"}>
                        {displayData.open.toFixed(2)}
                      </span>
                    </span>
                    <span className="text-[#787B86]">
                      H{" "}
                      <span className={isPositive ? "text-[#26a69a]" : "text-[#ef5350]"}>
                        {displayData.high.toFixed(2)}
                      </span>
                    </span>
                    <span className="text-[#787B86]">
                      L{" "}
                      <span className={isPositive ? "text-[#26a69a]" : "text-[#ef5350]"}>
                        {displayData.low.toFixed(2)}
                      </span>
                    </span>
                    <span className="text-[#787B86]">
                      C{" "}
                      <span className={isPositive ? "text-[#26a69a]" : "text-[#ef5350]"}>
                        {displayData.close.toFixed(2)}
                      </span>
                    </span>
                    <span className={isPositive ? "text-[#26a69a]" : "text-[#ef5350]"}>
                      {displayData.change >= 0 ? "+" : ""}
                      {displayData.change.toFixed(2)} (
                      {displayData.changePct >= 0 ? "+" : ""}
                      {displayData.changePct.toFixed(2)}%)
                    </span>
                    <span className="text-[#787B86]">
                      Vol{" "}
                      <span className="text-[#D1D4DC]">
                        {displayData.volume >= 1e9
                          ? (displayData.volume / 1e9).toFixed(2) + "B"
                          : displayData.volume >= 1e6
                          ? (displayData.volume / 1e6).toFixed(2) + "M"
                          : displayData.volume >= 1e3
                          ? (displayData.volume / 1e3).toFixed(1) + "K"
                          : displayData.volume}
                      </span>
                    </span>
                  </>
                )}

                {/* Active indicators legend */}
                {overlayIndicators.map((ind) => (
                  <span key={ind.id} className="text-[10px]" style={{ color: ind.color }}>
                    {ind.type.toUpperCase()}({ind.period})
                  </span>
                ))}
              </div>

              {/* Main Chart */}
              <div className="flex-1 min-h-0">
                <ChartWidget
                  ref={mainChartRef}
                  data={data}
                  height={mainChartHeight}
                  chartType={chartType}
                  overlayIndicators={overlayIndicators}
                  drawings={drawings}
                  onDrawingsChange={setDrawings}
                  activeDrawingTool={activeDrawingTool as "hline" | "trendline" | null}
                  onCrosshairData={setCrosshairData}
                  showVolume
                />
              </div>

              {/* RSI Pane */}
              {showRSI && (
                <IndicatorPane
                  ref={rsiPaneRef}
                  type="rsi"
                  data={data}
                  height={subChartHeight}
                  onVisibleRangeChange={handleSubVisibleRangeChange}
                />
              )}

              {/* MACD Pane */}
              {showMACD && (
                <IndicatorPane
                  ref={macdPaneRef}
                  type="macd"
                  data={data}
                  height={subChartHeight}
                  onVisibleRangeChange={handleSubVisibleRangeChange}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[#787B86] mb-4">
                  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16 mx-auto opacity-40">
                    <rect x="8" y="12" width="4" height="20" rx="1" />
                    <line x1="10" y1="8" x2="10" y2="12" />
                    <line x1="10" y1="32" x2="10" y2="36" />
                    <rect x="18" y="16" width="4" height="14" rx="1" />
                    <line x1="20" y1="12" x2="20" y2="16" />
                    <line x1="20" y1="30" x2="20" y2="34" />
                    <rect x="28" y="10" width="4" height="18" rx="1" />
                    <line x1="30" y1="6" x2="30" y2="10" />
                    <line x1="30" y1="28" x2="30" y2="32" />
                    <rect x="38" y="14" width="4" height="16" rx="1" />
                    <line x1="40" y1="10" x2="40" y2="14" />
                    <line x1="40" y1="30" x2="40" y2="36" />
                  </svg>
                </div>
                <p className="text-[#787B86] text-sm mb-2">
                  Enter a symbol and press Go to load chart data
                </p>
                <p className="text-[#4A4E59] text-xs">
                  Try AAPL, TSLA, MSFT, GOOGL, AMZN, NVDA, META, SPY
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
