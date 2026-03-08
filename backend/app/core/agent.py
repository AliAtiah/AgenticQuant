import json
from openai import OpenAI, APIError

from app.config import settings
from app.core.market_data import fetch_market_data
from app.models.schemas import AgentAnalyzeRequest, AgentAnalyzeResponse


SYSTEM_PROMPT = """You are AgenticQuant, an expert quantitative trading analyst AI.
You analyze financial market data and provide actionable trading insights.

When given OHLCV data for a stock, you should:
1. Identify the current trend (bullish, bearish, or sideways)
2. Highlight key support and resistance levels
3. Note any significant patterns (double top/bottom, head & shoulders, etc.)
4. Provide a clear recommendation: STRONG BUY, BUY, HOLD, SELL, or STRONG SELL
5. State your confidence level: HIGH, MEDIUM, or LOW

Be concise but thorough. Always mention risks."""


def _build_market_context(symbol: str) -> str:
    try:
        data = fetch_market_data(symbol, period="3mo", interval="1d")
        recent = data.bars[-20:] if len(data.bars) > 20 else data.bars

        lines = [f"Recent price data for {symbol} ({data.currency}):"]
        lines.append("Date       | Open    | High    | Low     | Close   | Volume")
        lines.append("-" * 65)
        for bar in recent:
            lines.append(
                f"{bar.date} | {bar.open:>7.2f} | {bar.high:>7.2f} | "
                f"{bar.low:>7.2f} | {bar.close:>7.2f} | {bar.volume:>10,}"
            )

        if len(data.bars) >= 2:
            first_close = data.bars[0].close
            last_close = data.bars[-1].close
            change_pct = ((last_close - first_close) / first_close) * 100
            lines.append(f"\n3-month change: {change_pct:+.2f}%")
            lines.append(f"Current price: {last_close:.2f}")

        return "\n".join(lines)
    except Exception as e:
        return f"Could not fetch market data for {symbol}: {e}"


def analyze_market(request: AgentAnalyzeRequest) -> AgentAnalyzeResponse:
    if not settings.openai_api_key:
        return _mock_analysis(request)

    context = _build_market_context(request.symbol)
    user_msg = f"Analyze {request.symbol}:\n\n{context}"
    if request.question:
        user_msg += f"\n\nSpecific question: {request.question}"

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.3,
            max_tokens=1000,
        )
        content = response.choices[0].message.content or ""

        recommendation = None
        confidence = None
        for keyword in ["STRONG BUY", "STRONG SELL", "BUY", "SELL", "HOLD"]:
            if keyword in content.upper():
                recommendation = keyword
                break
        for level in ["HIGH", "MEDIUM", "LOW"]:
            if f"confidence" in content.lower() and level in content.upper():
                confidence = level
                break

        return AgentAnalyzeResponse(
            symbol=request.symbol.upper(),
            analysis=content,
            recommendation=recommendation,
            confidence=confidence,
        )
    except APIError as e:
        return AgentAnalyzeResponse(
            symbol=request.symbol.upper(),
            analysis=f"OpenAI API error: {e}",
        )


def _mock_analysis(request: AgentAnalyzeRequest) -> AgentAnalyzeResponse:
    """Provide a demo analysis when no API key is configured."""
    context = _build_market_context(request.symbol)
    return AgentAnalyzeResponse(
        symbol=request.symbol.upper(),
        analysis=(
            f"[Demo Mode - No OpenAI API key configured]\n\n"
            f"Market data snapshot for {request.symbol}:\n{context}\n\n"
            f"To get real AI analysis, set OPENAI_API_KEY in your .env file."
        ),
        recommendation="HOLD",
        confidence="LOW",
    )
