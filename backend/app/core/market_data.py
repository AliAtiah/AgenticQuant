import yfinance as yf
import pandas as pd
from app.models.schemas import OHLCVBar, MarketDataResponse


def fetch_market_data(
    symbol: str,
    period: str = "6mo",
    interval: str = "1d",
) -> MarketDataResponse:
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=period, interval=interval)

    if hist.empty:
        raise ValueError(f"No data found for symbol: {symbol}")

    bars: list[OHLCVBar] = []
    for idx, row in hist.iterrows():
        ts = idx
        if isinstance(ts, pd.Timestamp):
            date_str = ts.strftime("%Y-%m-%d")
        else:
            date_str = str(ts)

        bars.append(
            OHLCVBar(
                date=date_str,
                open=round(row["Open"], 4),
                high=round(row["High"], 4),
                low=round(row["Low"], 4),
                close=round(row["Close"], 4),
                volume=int(row["Volume"]),
            )
        )

    info = ticker.info
    currency = info.get("currency", "USD") if info else "USD"

    return MarketDataResponse(symbol=symbol.upper(), bars=bars, currency=currency)


def get_current_price(symbol: str) -> dict:
    ticker = yf.Ticker(symbol)
    info = ticker.info
    return {
        "symbol": symbol.upper(),
        "price": info.get("currentPrice") or info.get("regularMarketPrice", 0),
        "change": info.get("regularMarketChange", 0),
        "change_pct": info.get("regularMarketChangePercent", 0),
        "volume": info.get("regularMarketVolume", 0),
        "market_cap": info.get("marketCap", 0),
        "name": info.get("shortName", symbol),
    }
