import { OHLCVBar } from "./api";
import { Time } from "lightweight-charts";

export interface IndicatorPoint {
  time: Time;
  value: number;
}

export interface BollingerBandsResult {
  upper: IndicatorPoint[];
  middle: IndicatorPoint[];
  lower: IndicatorPoint[];
}

export interface MACDResult {
  macd: IndicatorPoint[];
  signal: IndicatorPoint[];
  histogram: IndicatorPoint[];
}

export function calculateSMA(
  bars: OHLCVBar[],
  period: number
): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  for (let i = period - 1; i < bars.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += bars[j].close;
    }
    result.push({ time: bars[i].date as Time, value: sum / period });
  }
  return result;
}

export function calculateEMA(
  bars: OHLCVBar[],
  period: number
): IndicatorPoint[] {
  if (bars.length < period) return [];
  const multiplier = 2 / (period + 1);
  const result: IndicatorPoint[] = [];

  let sum = 0;
  for (let i = 0; i < period; i++) sum += bars[i].close;
  let ema = sum / period;
  result.push({ time: bars[period - 1].date as Time, value: ema });

  for (let i = period; i < bars.length; i++) {
    ema = (bars[i].close - ema) * multiplier + ema;
    result.push({ time: bars[i].date as Time, value: ema });
  }
  return result;
}

function emaFromValues(values: number[], period: number): (number | null)[] {
  if (values.length < period) return values.map(() => null);
  const multiplier = 2 / (period + 1);
  const result: (number | null)[] = [];

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
    result.push(null);
  }
  let ema = sum / period;
  result[period - 1] = ema;

  for (let i = period; i < values.length; i++) {
    ema = (values[i] - ema) * multiplier + ema;
    result.push(ema);
  }
  return result;
}

export function calculateBollingerBands(
  bars: OHLCVBar[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBandsResult {
  const upper: IndicatorPoint[] = [];
  const middle: IndicatorPoint[] = [];
  const lower: IndicatorPoint[] = [];

  for (let i = period - 1; i < bars.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += bars[j].close;
    const mean = sum / period;

    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSq += (bars[j].close - mean) ** 2;
    }
    const std = Math.sqrt(sumSq / period);
    const time = bars[i].date as Time;

    upper.push({ time, value: mean + stdDevMultiplier * std });
    middle.push({ time, value: mean });
    lower.push({ time, value: mean - stdDevMultiplier * std });
  }

  return { upper, middle, lower };
}

export function calculateRSI(
  bars: OHLCVBar[],
  period: number = 14
): IndicatorPoint[] {
  if (bars.length < period + 1) return [];
  const result: IndicatorPoint[] = [];

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = bars[i].close - bars[i - 1].close;
    if (change >= 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  const rs0 = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push({
    time: bars[period].date as Time,
    value: 100 - 100 / (1 + rs0),
  });

  for (let i = period + 1; i < bars.length; i++) {
    const change = bars[i].close - bars[i - 1].close;
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push({
      time: bars[i].date as Time,
      value: 100 - 100 / (1 + rs),
    });
  }

  return result;
}

export function calculateMACD(
  bars: OHLCVBar[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const closes = bars.map((b) => b.close);
  const fastEMA = emaFromValues(closes, fastPeriod);
  const slowEMA = emaFromValues(closes, slowPeriod);

  const macdValues: number[] = [];
  const macdTimes: Time[] = [];

  for (let i = 0; i < bars.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdValues.push(fastEMA[i]! - slowEMA[i]!);
      macdTimes.push(bars[i].date as Time);
    }
  }

  const signalRaw = emaFromValues(macdValues, signalPeriod);

  const macd: IndicatorPoint[] = [];
  const signal: IndicatorPoint[] = [];
  const histogram: IndicatorPoint[] = [];

  for (let i = 0; i < macdValues.length; i++) {
    const time = macdTimes[i];
    macd.push({ time, value: macdValues[i] });
    if (signalRaw[i] !== null) {
      signal.push({ time, value: signalRaw[i]! });
      histogram.push({ time, value: macdValues[i] - signalRaw[i]! });
    }
  }

  return { macd, signal, histogram };
}

export function calculateVWAP(bars: OHLCVBar[]): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;

  for (const bar of bars) {
    const tp = (bar.high + bar.low + bar.close) / 3;
    cumulativeTPV += tp * bar.volume;
    cumulativeVolume += bar.volume;
    if (cumulativeVolume > 0) {
      result.push({
        time: bar.date as Time,
        value: cumulativeTPV / cumulativeVolume,
      });
    }
  }
  return result;
}
