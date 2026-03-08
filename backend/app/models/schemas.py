from pydantic import BaseModel
from typing import Optional


class MarketDataRequest(BaseModel):
    symbol: str
    period: str = "6mo"
    interval: str = "1d"


class OHLCVBar(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class MarketDataResponse(BaseModel):
    symbol: str
    bars: list[OHLCVBar]
    currency: str = "USD"


class BacktestRequest(BaseModel):
    strategy: str
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float = 10000.0
    parameters: dict = {}


class BacktestMetrics(BaseModel):
    initial_capital: float
    final_value: float
    total_return_pct: float
    max_drawdown_pct: float
    sharpe_ratio: float
    total_trades: int
    win_rate_pct: float


class BacktestResponse(BaseModel):
    strategy: str
    symbol: str
    metrics: BacktestMetrics
    equity_curve: list[dict]
    trades: list[dict]


class StrategyInfo(BaseModel):
    name: str
    display_name: str
    description: str
    parameters: dict


class AgentAnalyzeRequest(BaseModel):
    symbol: str
    question: Optional[str] = None
    include_technicals: bool = True


class AgentAnalyzeResponse(BaseModel):
    symbol: str
    analysis: str
    recommendation: Optional[str] = None
    confidence: Optional[str] = None
