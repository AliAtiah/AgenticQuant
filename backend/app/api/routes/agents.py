from fastapi import APIRouter, HTTPException

from app.core.agent import analyze_market
from app.models.schemas import AgentAnalyzeRequest, AgentAnalyzeResponse

router = APIRouter()


@router.post("/analyze", response_model=AgentAnalyzeResponse)
async def agent_analyze(request: AgentAnalyzeRequest):
    try:
        return analyze_market(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent analysis failed: {e}")
