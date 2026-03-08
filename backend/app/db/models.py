from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime, timezone

from app.db.database import Base


class BacktestResult(Base):
    __tablename__ = "backtest_results"

    id = Column(Integer, primary_key=True, index=True)
    strategy_name = Column(String, index=True)
    symbol = Column(String, index=True)
    start_date = Column(String)
    end_date = Column(String)
    initial_capital = Column(Float, default=10000.0)
    final_value = Column(Float)
    total_return_pct = Column(Float)
    max_drawdown_pct = Column(Float)
    sharpe_ratio = Column(Float)
    total_trades = Column(Integer)
    parameters = Column(JSON)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
