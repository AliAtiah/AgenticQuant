from fastapi import APIRouter, HTTPException

from app.core.backtest_engine import run_backtest
from app.models.schemas import BacktestRequest, BacktestResponse

router = APIRouter()


@router.post("/run", response_model=BacktestResponse)
async def execute_backtest(request: BacktestRequest):
    try:
        return run_backtest(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest failed: {e}")
