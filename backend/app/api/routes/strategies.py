from fastapi import APIRouter

from app.core.strategy import list_strategies
from app.models.schemas import StrategyInfo

router = APIRouter()


@router.get("/", response_model=list[StrategyInfo])
async def get_strategies():
    return list_strategies()
