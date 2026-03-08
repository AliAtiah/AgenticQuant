from fastapi import APIRouter, HTTPException, Query

from app.core.market_data import fetch_market_data, get_current_price
from app.models.schemas import MarketDataResponse

router = APIRouter()


@router.get("/{symbol}", response_model=MarketDataResponse)
async def get_market_data(
    symbol: str,
    period: str = Query("6mo", description="Data period: 1d,5d,1mo,3mo,6mo,1y,2y,5y,max"),
    interval: str = Query("1d", description="Bar interval: 1m,5m,15m,1h,1d,1wk,1mo"),
):
    try:
        return fetch_market_data(symbol, period=period, interval=interval)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data: {e}")


@router.get("/{symbol}/quote")
async def get_quote(symbol: str):
    try:
        return get_current_price(symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quote: {e}")
