from fastapi import APIRouter

from app.api.routes import market_data, backtest, strategies, agents

api_router = APIRouter()
api_router.include_router(market_data.router, prefix="/market", tags=["Market Data"])
api_router.include_router(backtest.router, prefix="/backtest", tags=["Backtest"])
api_router.include_router(strategies.router, prefix="/strategies", tags=["Strategies"])
api_router.include_router(agents.router, prefix="/agents", tags=["AI Agents"])
