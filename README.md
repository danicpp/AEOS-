# ⬡ AEOS — Autonomous E-Commerce Operating System

A production-ready multi-agent AI system built on a **Band of Agents** architecture.
13 specialized Gemini agents collaborate autonomously to operate a Shopify e-commerce business
from product discovery to customer support.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 React Frontend                  │
│  MissionControl · AgentFleet · MessageBus       │
│  KPIDashboard · FinanceChart · ReportsPanel     │
└────────────────────┬────────────────────────────┘
                     │ SSE stream + REST
┌────────────────────▼────────────────────────────┐
│              FastAPI Backend                    │
│  Agent Orchestrator · Communication Bus         │
│  6-Phase Mission Engine · Chat Endpoint         │
└────────────────────┬────────────────────────────┘
                     │ Async API calls
┌────────────────────▼────────────────────────────┐
│           Google Gemini API                     │
│    13 specialized agents (gemini-2.5-flash)     │
└─────────────────────────────────────────────────┘
```

## Agent Fleet

| Agent              | Responsibility                            |
|--------------------|-------------------------------------------|
| CEO Agent          | Orchestration, strategy, synthesis        |
| Product Research   | Trend discovery, demand analysis          |
| Market Intel       | Competitors, SWOT, positioning            |
| Supplier Scout     | Sourcing, procurement, cost analysis      |
| Pricing Agent      | Margins, break-even, profitability        |
| Inventory Forecast | Demand prediction, stock planning         |
| Store Builder      | Shopify listings, SEO, conversion         |
| Marketing Agent    | Campaigns, audience, funnel design        |
| Content Creator    | Ad copy, video scripts, UGC               |
| Support Agent      | FAQs, templates, customer comms           |
| Logistics Agent    | Fulfillment, shipping, delivery           |
| Finance Agent      | P&L, forecasting, cash flow               |
| Risk & Compliance  | Policy, legal, supplier risk              |

## Mission Phases

1. **CEO Strategic Brief** — Decompose objective, brief the fleet
2. **Research** (parallel) — Product opportunities + Market intelligence
3. **Economics** (parallel) — Supplier sourcing + Profitability modeling
4. **Go-to-Market** (parallel) — Store listing + Campaign + Content
5. **Operations** (parallel) — Logistics + Finance + Risk + Inventory + Support
6. **CEO Synthesis** — Executive launch strategy

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API key

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm start
# Opens at http://localhost:3000
```

### Environment Variables

**Backend** (`backend/.env`):
```
GEMINI_API_KEY=your_api_key_here
```

**Frontend** (optional `frontend/.env`):
```
REACT_APP_API_URL=http://localhost:8000
```

---

## API Reference

### `POST /mission/stream`
Stream a full mission. Returns Server-Sent Events.

```json
{ "goal": "Launch a profitable Shopify business in the fitness niche" }
```

**SSE Event Types:**
- `agent_status` — `{ agent_id, status: idle|active|done|error }`
- `message` — `{ sender, receiver, type, content, timestamp }`
- `report` — `{ agent_id, title, body }`
- `kpi` — `{ key, value }`
- `log` — `{ text }`
- `mission_complete` — `{ goal, results, agent_count }`

### `POST /agent/chat`
Direct chat with any agent.

```json
{ "agent_id": "ceo", "message": "Should we expand to TikTok Shop?", "context": "..." }
```

### `GET /agents`
List all agents with IDs, names, and colors.

### `GET /health`
Health check.

---

## Project Structure

```
aeos/
├── backend/
│   ├── main.py              # FastAPI app + all agent logic
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js           # Root layout
    │   ├── index.js
    │   ├── index.css        # Global tokens
    │   ├── agents/
    │   │   └── config.js    # Agent definitions + constants
    │   ├── hooks/
    │   │   └── useMission.js # SSE stream + state management
    │   └── components/
    │       ├── TopBar.js
    │       ├── MissionControl.js
    │       ├── AgentFleet.js
    │       ├── MessageBus.js
    │       ├── KPIDashboard.js
    │       ├── ReportsPanel.js
    │       ├── FinanceChart.js
    │       └── SystemLog.js
    └── package.json
```

---

## Customization

### Add a new agent
1. Add to `AGENTS` dict in `backend/main.py`
2. Add to `AGENTS` array in `frontend/src/agents/config.js`
3. Add a `run_agent('your_agent', ...)` call in `orchestrate_mission()`

### Change the LLM model
In `backend/main.py`, change `model='gemini-2.5-flash'` in `run_agent()`.

### Extend agent prompts
Each agent has a `system` prompt in the `AGENTS` dict. Edit these to specialize behavior.

### Add memory / persistence
The `run_agent()` function accepts `extra_context`. Pass historical results or 
database-fetched data as context to give agents memory.

---

## Tech Stack

- **Backend**: FastAPI, Python, Google GenAI SDK, asyncio
- **Frontend**: React 18, Recharts, Lucide React
- **AI**: Gemini 2.5 Flash (13 specialized instances)
- **Streaming**: Server-Sent Events (SSE)
- **Communication**: Structured JSON message bus

---

## License

MIT — build on this freely.
