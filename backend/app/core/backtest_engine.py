import numpy as np
import pandas as pd
import yfinance as yf

from app.core.strategy import get_strategy
from app.models.schemas import BacktestRequest, BacktestResponse, BacktestMetrics


def run_backtest(request: BacktestRequest) -> BacktestResponse:
    strategy = get_strategy(request.strategy, request.parameters)

    ticker = yf.Ticker(request.symbol)
    df = ticker.history(start=request.start_date, end=request.end_date)

    if df.empty or len(df) < 2:
        raise ValueError(
            f"Insufficient data for {request.symbol} "
            f"between {request.start_date} and {request.end_date}"
        )

    signals = strategy.generate_signals(df)
    capital = request.initial_capital
    position = 0.0
    cash = capital
    trades: list[dict] = []
    equity_curve: list[dict] = []

    for i, (idx, row) in enumerate(df.iterrows()):
        price = row["Close"]
        signal = signals.iloc[i]
        date_str = idx.strftime("%Y-%m-%d") if isinstance(idx, pd.Timestamp) else str(idx)

        if signal == 1 and position == 0:
            shares = int(cash / price)
            if shares > 0:
                position = shares
                cash -= shares * price
                trades.append({
                    "date": date_str,
                    "action": "BUY",
                    "price": round(price, 2),
                    "shares": shares,
                })
        elif signal == -1 and position > 0:
            cash += position * price
            trades.append({
                "date": date_str,
                "action": "SELL",
                "price": round(price, 2),
                "shares": int(position),
            })
            position = 0

        portfolio_value = cash + position * price
        equity_curve.append({"date": date_str, "value": round(portfolio_value, 2)})

    final_price = df["Close"].iloc[-1]
    final_value = cash + position * final_price
    total_return_pct = ((final_value - capital) / capital) * 100

    equity_values = np.array([e["value"] for e in equity_curve])
    peak = np.maximum.accumulate(equity_values)
    drawdown = (equity_values - peak) / np.where(peak == 0, 1, peak)
    max_drawdown_pct = float(drawdown.min()) * 100

    daily_returns = np.diff(equity_values) / equity_values[:-1]
    sharpe_ratio = 0.0
    if len(daily_returns) > 1 and np.std(daily_returns) > 0:
        sharpe_ratio = float(
            (np.mean(daily_returns) / np.std(daily_returns)) * np.sqrt(252)
        )

    sell_trades = [t for t in trades if t["action"] == "SELL"]
    buy_trades = [t for t in trades if t["action"] == "BUY"]
    wins = 0
    for i, sell in enumerate(sell_trades):
        if i < len(buy_trades) and sell["price"] > buy_trades[i]["price"]:
            wins += 1
    win_rate = (wins / len(sell_trades) * 100) if sell_trades else 0.0

    return BacktestResponse(
        strategy=request.strategy,
        symbol=request.symbol.upper(),
        metrics=BacktestMetrics(
            initial_capital=capital,
            final_value=round(final_value, 2),
            total_return_pct=round(total_return_pct, 2),
            max_drawdown_pct=round(max_drawdown_pct, 2),
            sharpe_ratio=round(sharpe_ratio, 2),
            total_trades=len(trades),
            win_rate_pct=round(win_rate, 2),
        ),
        equity_curve=equity_curve,
        trades=trades,
    )
