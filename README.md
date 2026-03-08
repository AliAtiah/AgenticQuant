# AgenticQuant

**AI-powered quantitative trading platform** with backtesting, live charting, and autonomous trading agents. This is the 
third version
Built to compete with TradingView and QuantConnect -- with an AI-first approach.

---

## Features

- **Interactive Charts** -- Candlestick charts with volume using TradingView's Lightweight Charts
- **Backtesting Engine** -- Test strategies against historical data with equity curves, trade logs, and performance metrics
- **Built-in Strategies** -- SMA Crossover and RSI Mean Reversion (extensible)
- **AI Trading Agent** -- Chat-based market analysis powered by OpenAI GPT-4o
- **Live Market Data** -- Real-time quotes via Yahoo Finance
- **Modern Dark UI** -- Professional trading interface built with Next.js and Tailwind CSS

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python, FastAPI, SQLAlchemy, yfinance |
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS |
| **Charting** | TradingView Lightweight Charts |
| **AI** | OpenAI GPT-4o |
| **Database** | SQLite (swappable to PostgreSQL) |
| **Deployment** | Docker Compose |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- (Optional) Docker & Docker Compose

### Option 1: Run Locally

**Backend:**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Docker Compose

```bash
docker-compose up --build
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
OPENAI_API_KEY=sk-your-key-here   # Optional: enables AI agent
DATABASE_URL=sqlite:///./agenticquant.db
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/market/{symbol}` | Fetch OHLCV data |
| GET | `/api/market/{symbol}/quote` | Get current price quote |
| POST | `/api/backtest/run` | Run a strategy backtest |
| GET | `/api/strategies/` | List available strategies |
| POST | `/api/agents/analyze` | AI market analysis |
| GET | `/health` | Health check |

## Project Structure

```
AgenticQuant/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # API route handlers
│   │   ├── core/             # Business logic (backtest, strategies, agent)
│   │   ├── models/           # Pydantic schemas
│   │   └── db/               # Database models
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages (dashboard, chart, backtest, agents)
│   │   ├── components/       # React components
│   │   └── lib/              # API client
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Strategies

### SMA Crossover
Buy when the short-period Simple Moving Average crosses above the long-period SMA; sell when it crosses below.

**Parameters:** `short_window` (default: 20), `long_window` (default: 50)

### RSI Mean Reversion
Buy when RSI drops below the oversold threshold; sell when RSI rises above the overbought threshold.

**Parameters:** `rsi_period` (default: 14), `oversold` (default: 30), `overbought` (default: 70)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and commit: `git commit -m "Add your feature"`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request

## License

MIT
