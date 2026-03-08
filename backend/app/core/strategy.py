from abc import ABC, abstractmethod
import numpy as np
import pandas as pd


class BaseStrategy(ABC):
    name: str = "base"
    display_name: str = "Base Strategy"
    description: str = ""
    default_parameters: dict = {}

    def __init__(self, parameters: dict | None = None):
        self.parameters = {**self.default_parameters, **(parameters or {})}

    @abstractmethod
    def generate_signals(self, df: pd.DataFrame) -> pd.Series:
        """Return a Series of signals: 1 = buy, -1 = sell, 0 = hold."""
        ...

    def info(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "description": self.description,
            "parameters": self.default_parameters,
        }


class SMACrossover(BaseStrategy):
    name = "sma_crossover"
    display_name = "SMA Crossover"
    description = (
        "Buy when the short-period SMA crosses above the long-period SMA; "
        "sell when it crosses below."
    )
    default_parameters = {"short_window": 20, "long_window": 50}

    def generate_signals(self, df: pd.DataFrame) -> pd.Series:
        short = df["Close"].rolling(window=self.parameters["short_window"]).mean()
        long = df["Close"].rolling(window=self.parameters["long_window"]).mean()

        signals = pd.Series(0, index=df.index)
        signals[short > long] = 1
        signals[short <= long] = -1

        # Only emit on transitions
        return signals.diff().fillna(0).apply(
            lambda x: 1 if x > 0 else (-1 if x < 0 else 0)
        )


class RSIMeanReversion(BaseStrategy):
    name = "rsi_mean_reversion"
    display_name = "RSI Mean Reversion"
    description = (
        "Buy when RSI drops below the oversold threshold; "
        "sell when RSI rises above the overbought threshold."
    )
    default_parameters = {"rsi_period": 14, "oversold": 30, "overbought": 70}

    def generate_signals(self, df: pd.DataFrame) -> pd.Series:
        delta = df["Close"].diff()
        gain = delta.where(delta > 0, 0.0).rolling(self.parameters["rsi_period"]).mean()
        loss = (-delta.where(delta < 0, 0.0)).rolling(self.parameters["rsi_period"]).mean()
        rs = gain / loss.replace(0, np.nan)
        rsi = 100 - (100 / (1 + rs))

        signals = pd.Series(0, index=df.index)
        signals[rsi < self.parameters["oversold"]] = 1
        signals[rsi > self.parameters["overbought"]] = -1
        return signals


STRATEGY_REGISTRY: dict[str, type[BaseStrategy]] = {
    "sma_crossover": SMACrossover,
    "rsi_mean_reversion": RSIMeanReversion,
}


def get_strategy(name: str, parameters: dict | None = None) -> BaseStrategy:
    cls = STRATEGY_REGISTRY.get(name)
    if cls is None:
        raise ValueError(
            f"Unknown strategy: {name}. Available: {list(STRATEGY_REGISTRY.keys())}"
        )
    return cls(parameters)


def list_strategies() -> list[dict]:
    return [cls().info() for cls in STRATEGY_REGISTRY.values()]
