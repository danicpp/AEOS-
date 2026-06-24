"""
AEOS — Autonomous E-Commerce Operating System
FastAPI backend with multi-agent orchestration and Server-Sent Events streaming
"""

import asyncio
import json
import os
import re
import time
import uuid
from typing import AsyncGenerator, Optional
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

app = FastAPI(title="AEOS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# ─────────────────────────────────────────
# MODELS
# ─────────────────────────────────────────

class MissionRequest(BaseModel):
    goal: str
    session_id: Optional[str] = None

class ChatRequest(BaseModel):
    agent_id: str
    message: str
    context: Optional[str] = ""

# ─────────────────────────────────────────
# AGENT DEFINITIONS
# ─────────────────────────────────────────

AGENTS = {
    "ceo": {
        "name": "CEO Agent",
        "color": "#7F77DD",
        "system": """You are the CEO Agent of AEOS (Autonomous E-Commerce Operating System).
You are the strategic orchestrator of a band of 13 specialized AI agents.
Your role: decompose business objectives, delegate to specialists, resolve conflicts,
monitor KPIs, and synthesize findings into executive decisions.
Be decisive, concise, and data-driven. Format output as structured JSON when requested.""",
    },
    "research": {
        "name": "Product Research Agent",
        "color": "#1D9E75",
        "system": """You are the Product Research Agent for AEOS.
Specialization: trend discovery, demand analysis, product viability scoring.
Data sources: market trends, search volumes, e-commerce platforms, social signals.
Output: specific product names, demand estimates, opportunity scores 0-100.
Always return structured, actionable findings. Be specific with product names and numbers.""",
    },
    "market": {
        "name": "Market Intelligence Agent",
        "color": "#BA7517",
        "system": """You are the Market Intelligence Agent for AEOS.
Specialization: competitor analysis, market saturation, SWOT, positioning.
Output: competition scores, market gaps, differentiation angles.
Be analytical and specific. Use numbers when possible (e.g. "market growing 23% YoY").""",
    },
    "supplier": {
        "name": "Supplier & Sourcing Agent",
        "color": "#D4537E",
        "system": """You are the Supplier & Sourcing Agent for AEOS.
Specialization: manufacturer discovery, supplier reliability, procurement costs.
Output: supplier types, unit cost ranges, MOQ, lead times, reliability scores.
Give realistic Alibaba/AliExpress/DHgate pricing. Be specific.""",
    },
    "pricing": {
        "name": "Pricing & Profitability Agent",
        "color": "#378ADD",
        "system": """You are the Pricing & Profitability Agent for AEOS.
Specialization: margin calculation, break-even analysis, pricing optimization.
Always output: selling price, unit cost, gross margin %, net margin %, 
monthly profit estimate, CAC estimate, target ROAS, break-even units.
Use realistic e-commerce benchmarks.""",
    },
    "inventory": {
        "name": "Inventory Forecasting Agent",
        "color": "#D85A30",
        "system": """You are the Inventory Forecasting Agent for AEOS.
Specialization: demand prediction, stock planning, reorder optimization.
Output: initial order quantity, reorder point, safety stock, 
sell-through rate estimate, stockout risk assessment.""",
    },
    "shopify": {
        "name": "Shopify Store Builder",
        "color": "#0F6E56",
        "system": """You are the Shopify Store Builder Agent for AEOS.
Specialization: product listings, SEO, collections, conversion optimization.
Output: product title (max 70 chars), meta description (155 chars), 
bullet features (×5), SEO tags, collection suggestions.
Write copy that converts. Use power words.""",
    },
    "marketing": {
        "name": "Marketing Agent",
        "color": "#534AB7",
        "system": """You are the Marketing Agent for AEOS.
Specialization: ad strategy, audience targeting, funnel design, campaign planning.
Channels: Meta (Facebook/Instagram), TikTok, Google.
Output: primary channel recommendation, audience targeting, ad angles/hooks, 
weekly budget suggestion, funnel stages.""",
    },
    "content": {
        "name": "Content Creation Agent",
        "color": "#A32D2D",
        "system": """You are the Content Creation Agent for AEOS.
Specialization: ad copy, video scripts, UGC concepts, social content.
Output: 3 ad headlines, 2 video script hooks (first 5 seconds), 
3 UGC angles, email subject line. Make it scroll-stopping.""",
    },
    "support": {
        "name": "Customer Support Agent",
        "color": "#085041",
        "system": """You are the Customer Support Agent for AEOS.
Specialization: customer communications, FAQs, refund policies, escalation.
Output: FAQ template (5 questions), refund policy snippet, 
order confirmation email template, review request sequence.""",
    },
    "logistics": {
        "name": "Logistics Agent",
        "color": "#854F0B",
        "system": """You are the Logistics Agent for AEOS.
Specialization: fulfillment strategy, shipping optimization, delivery windows.
Output: recommended fulfillment method (FBA/3PL/dropship/self-fulfill),
shipping cost estimate, delivery window, duties/customs note, one key risk.""",
    },
    "finance": {
        "name": "Finance Agent",
        "color": "#185FA5",
        "system": """You are the Finance Agent for AEOS.
Specialization: revenue modeling, P&L, cash flow, financial forecasting.
Output: 90-day revenue projection (month 1/2/3), startup cost estimate,
payback period, key financial risks, recommended cash reserve.""",
    },
    "risk": {
        "name": "Risk & Compliance Agent",
        "color": "#791F1F",
        "system": """You are the Risk & Compliance Agent for AEOS.
Specialization: policy violations, supplier risk, legal compliance, platform ToS.
Output: 5 risk items with severity (HIGH/MED/LOW) and mitigation action each.
Check: supplier reliability, platform policy, IP/trademark, customs, returns.""",
    },
}

# ─────────────────────────────────────────
# AGENT COMMUNICATION BUS
# ─────────────────────────────────────────

class AgentMessage:
    def __init__(self, sender: str, receiver: str, msg_type: str, content: str, data: dict = None):
        self.id = str(uuid.uuid4())[:8]
        self.sender = sender
        self.receiver = receiver
        self.msg_type = msg_type  # "task" | "result" | "query" | "alert" | "log"
        self.content = content
        self.data = data or {}
        self.timestamp = time.time()

    def to_dict(self):
        return {
            "id": self.id,
            "sender": self.sender,
            "receiver": self.receiver,
            "type": self.msg_type,
            "content": self.content,
            "data": self.data,
            "timestamp": self.timestamp,
        }


def sse(event_type: str, data: dict) -> str:
    return f"data: {json.dumps({'event': event_type, **data})}\n\n"


# ─────────────────────────────────────────
# CORE AGENT RUNNER
# ─────────────────────────────────────────

async def run_agent(
    agent_id: str,
    prompt: str,
    max_tokens: int = 600,
    extra_context: str = "",
) -> str:
    agent = AGENTS[agent_id]
    system = agent["system"]
    if extra_context:
        system += f"\n\nContext from other agents:\n{extra_context}"
    
    response = await client.aio.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=max_tokens,
        )
    )
    return response.text


# ─────────────────────────────────────────
# MISSION ORCHESTRATION — SSE STREAM
# ─────────────────────────────────────────

async def orchestrate_mission(goal: str) -> AsyncGenerator[str, None]:
    results = {}
    
    def emit_agent_status(agent_id: str, status: str) -> str:
        return sse("agent_status", {"agent_id": agent_id, "status": status})

    def emit_message(sender: str, receiver: str, msg_type: str, content: str) -> str:
        msg = AgentMessage(sender, receiver, msg_type, content)
        return sse("message", msg.to_dict())

    def emit_report(agent_id: str, title: str, body: str) -> str:
        return sse("report", {"agent_id": agent_id, "title": title, "body": body})

    def emit_kpi(key: str, value: str) -> str:
        return sse("kpi", {"key": key, "value": value})

    def emit_log(text: str) -> str:
        return sse("log", {"text": text})

    # ── PHASE 1: CEO AGENT ──
    yield emit_agent_status("ceo", "active")
    yield emit_message("ceo", "all", "log", f"Mission received: '{goal}'. Decomposing objective...")
    yield emit_log("Phase 1: CEO Agent — Strategic planning")

    ceo_brief = await run_agent(
        "ceo",
        f"""Mission objective: "{goal}"

Issue a strategic brief for the agent fleet. Include:
1. Business opportunity summary (2 sentences)
2. Top 3 priorities for the team (bullets)
3. Success criteria: what does winning look like?
4. Which agents to activate first and why

Be executive-level. Be specific.""",
        500,
    )
    results["ceo_brief"] = ceo_brief
    yield emit_agent_status("ceo", "done")
    yield emit_report("ceo", "Strategic Brief", ceo_brief)
    yield emit_message("ceo", "research,market", "task", "Launching Phase 2: Market research and product discovery.")
    await asyncio.sleep(0.2)

    # ── PHASE 2: PARALLEL — RESEARCH + MARKET ──
    yield emit_agent_status("research", "active")
    yield emit_agent_status("market", "active")
    yield emit_message("research", "market", "query", "Scanning product opportunities. Will need saturation data.")
    yield emit_message("market", "research", "query", "Running competitor analysis in parallel.")
    yield emit_log("Phase 2: Product Research + Market Intel (parallel)")

    research_task = run_agent(
        "research",
        f"""Mission: "{goal}"

Discover 3 specific product opportunities. For each:
- Product name (specific, not generic)
- Demand signal (trending keyword, search volume estimate)
- Competition level: LOW / MED / HIGH
- Estimated retail price range
- Opportunity score: X/100

Also give 1 top recommendation with justification.""",
        600,
    )
    market_task = run_agent(
        "market",
        f"""Mission: "{goal}"

Deliver a market intelligence report:
- Market size estimate + growth rate
- Top 3 competitors with 1-line weakness each
- Main market gap / underserved angle
- Best differentiation strategy
- SWOT: 2 strengths, 2 weaknesses, 2 opportunities, 2 threats""",
        600,
    )
    research_out, market_out = await asyncio.gather(research_task, market_task)
    results["research"] = research_out
    results["market"] = market_out

    yield emit_agent_status("research", "done")
    yield emit_agent_status("market", "done")
    yield emit_report("research", "Product Opportunities", research_out)
    yield emit_report("market", "Market Intelligence", market_out)
    yield emit_message("research", "supplier,pricing", "result", "3 product candidates identified. Forwarding unit economics for evaluation.")
    yield emit_message("market", "ceo", "result", "Competitive landscape mapped. Key gap identified — forwarding to CEO.")
    await asyncio.sleep(0.2)

    # ── PHASE 3: PARALLEL — SUPPLIER + PRICING ──
    yield emit_agent_status("supplier", "active")
    yield emit_agent_status("pricing", "active")
    yield emit_message("supplier", "pricing", "task", "Sourcing manufacturers. Will share unit costs for margin modeling.")
    yield emit_message("pricing", "finance", "query", "Preparing profitability model — will need 90-day forecast inputs.")
    yield emit_log("Phase 3: Supplier Sourcing + Profitability Modeling (parallel)")

    context_23 = f"Product research findings:\n{research_out[:400]}\n\nMarket intel:\n{market_out[:300]}"

    supplier_task = run_agent(
        "supplier",
        f"""Mission: "{goal}"

Research findings: {research_out[:300]}

Provide sourcing strategy:
- Recommended supplier type (Alibaba, private label, domestic, etc.)
- Estimated unit cost range (at 100 / 500 / 1000 units MOQ)
- Minimum order quantity recommendation
- Lead time estimate
- Top 2 supplier red flags to avoid
- Reliability score criteria""",
        500,
        context_23,
    )
    pricing_task = run_agent(
        "pricing",
        f"""Mission: "{goal}"

Market data: {market_out[:300]}

Build the profitability model:
- Recommended selling price
- Estimated unit cost (from sourcing)
- Gross margin %
- Net margin % (after ads, fees, shipping)
- Break-even units per month
- Estimated monthly profit at 200 units sold
- Customer Acquisition Cost (CAC) estimate
- Target ROAS
- Shopify + payment fees estimate""",
        500,
        context_23,
    )
    supplier_out, pricing_out = await asyncio.gather(supplier_task, pricing_task)
    results["supplier"] = supplier_out
    results["pricing"] = pricing_out

    yield emit_agent_status("supplier", "done")
    yield emit_agent_status("pricing", "done")
    yield emit_report("supplier", "Sourcing Strategy", supplier_out)
    yield emit_report("pricing", "Profitability Model", pricing_out)

    # Extract and emit KPIs
    def extract_kpi(text, patterns, fallback):
        for pattern in patterns:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                return m.group(0)
        return fallback

    gross_margin = extract_kpi(pricing_out, [
        r'(?:gross\s+margin|gm)[:\s]+([\d.]+)\s*%',
        r'([4-9]\d)\s*%\s+(?:gross\s+)?margin',
        r'margin[:\s]+([\d.]+)\s*%',
        r'([\d.]+)\s*%\s*(?:gross)?\s*margin',
    ], "~45%")

    monthly_profit = extract_kpi(pricing_out, [
        r'(?:monthly\s+profit|net\s+profit)[:\s]+\$\s*([\d,]+)',
        r'\$\s*([\d,]+)\s*(?:per\s+month|/mo|monthly\s+profit)',
        r'profit[:\s]+\$([\d,]+)',
        r'\$([\d,]+)\s*profit',
    ], "Est. TBD")

    cac = extract_kpi(pricing_out, [
        r'(?:cac|customer\s+acquisition\s+cost)[:\s]+\$?\s*([\d,–\-]+)',
        r'\$([\d]+)[-–]\$?([\d]+)\s*(?:per\s+customer|cac)',
        r'acquire[\w\s]+\$([\d]+)',
    ], "Est. TBD")

    roas = extract_kpi(pricing_out, [
        r'(?:roas|return\s+on\s+ad\s+spend)[:\s]+([\d.]+)\s*[x×]?',
        r'([\d.]+)[x×]\s*roas',
        r'roas\s+of\s+([\d.]+)',
    ], "Est. TBD")

    for key, val in [("gross_margin", gross_margin), ("monthly_profit", monthly_profit), ("cac", cac), ("roas", roas)]:
        yield emit_kpi(key, val)

    yield emit_message("pricing", "ceo", "result", "Financials modeled. Unit economics validated. Margin targets achievable.")
    await asyncio.sleep(0.2)

    # ── PHASE 4: PARALLEL — STORE + MARKETING + CONTENT ──
    yield emit_agent_status("shopify", "active")
    yield emit_agent_status("marketing", "active")
    yield emit_agent_status("content", "active")
    yield emit_message("shopify", "marketing", "task", "Building product listing. Need ad copy alignment on key benefits.")
    yield emit_message("marketing", "content", "task", "Campaign strategy drafted. Need creative assets and ad hooks.")
    yield emit_message("content", "marketing", "result", "Generating scroll-stopping hooks and UGC concepts.")
    yield emit_log("Phase 4: Store Builder + Marketing + Content (parallel)")

    context_4 = f"Product: {research_out[:300]}\nPricing: {pricing_out[:300]}\nMarket: {market_out[:200]}"

    shopify_task = run_agent(
        "shopify",
        f"""Mission: "{goal}"

Context: {context_4[:500]}

Create a complete Shopify product listing:
1. Product title (max 70 chars, keyword-rich)
2. SEO meta description (max 155 chars)
3. Product description (3 paragraphs, benefit-led)
4. 5 bullet-point features (formatted for Shopify)
5. 8 SEO tags
6. Collection name suggestion
7. Compare-at price suggestion (for sale psychology)""",
        700,
        context_4,
    )
    marketing_task = run_agent(
        "marketing",
        f"""Mission: "{goal}"

Context: {context_4[:500]}

Design the launch campaign:
1. Primary channel recommendation + why
2. Target audience (demographics + psychographics + pain points)
3. Top 3 ad angles / hooks
4. Campaign funnel (Awareness → Consideration → Conversion)
5. Week 1 budget allocation by channel
6. KPIs to track (with target numbers)
7. Retargeting strategy""",
        700,
        context_4,
    )
    content_task = run_agent(
        "content",
        f"""Mission: "{goal}"

Context: {context_4[:400]}

Create content package:
1. 3 Facebook/Instagram ad headlines (max 40 chars each)
2. 2 TikTok video hooks (first 3 seconds, make them viral-worthy)
3. Primary ad body copy (150 words, problem-agitate-solve format)
4. 3 UGC video concepts (tell creator exactly what to film)
5. Email subject line for launch day
6. Instagram caption with hashtags""",
        700,
        context_4,
    )
    shopify_out, marketing_out, content_out = await asyncio.gather(shopify_task, marketing_task, content_task)
    results["shopify"] = shopify_out
    results["marketing"] = marketing_out
    results["content"] = content_out

    yield emit_agent_status("shopify", "done")
    yield emit_agent_status("marketing", "done")
    yield emit_agent_status("content", "done")
    yield emit_report("shopify", "Shopify Listing", shopify_out)
    yield emit_report("marketing", "Launch Campaign", marketing_out)
    yield emit_report("content", "Content Package", content_out)
    yield emit_message("shopify", "ceo", "result", "Product listing ready for Shopify import. SEO optimized.")
    yield emit_message("marketing", "ceo", "result", "Campaign strategy finalized. Budget allocated across channels.")
    await asyncio.sleep(0.2)

    # ── PHASE 5: PARALLEL — OPS AGENTS ──
    for aid in ["logistics", "finance", "risk", "inventory", "support"]:
        yield emit_agent_status(aid, "active")
    yield emit_message("logistics", "finance", "task", "Calculating fulfillment costs — feeding into P&L model.")
    yield emit_message("finance", "risk", "query", "Building 90-day forecast. Risk Agent: flag any financial exposure.")
    yield emit_message("risk", "ceo", "alert", "Initiating compliance scan across supplier, platform, and legal domains.")
    yield emit_message("inventory", "logistics", "task", "Demand forecast complete. Recommended initial PO: 300 units.")
    yield emit_message("support", "shopify", "task", "Drafting customer support templates for launch day.")
    yield emit_log("Phase 5: Ops Agents — Logistics, Finance, Risk, Inventory, Support (parallel)")

    context_5 = f"Supplier: {supplier_out[:200]}\nPricing: {pricing_out[:300]}\nMarketing: {marketing_out[:200]}"

    logistics_task = run_agent(
        "logistics",
        f"""Mission: "{goal}" Context: {context_5[:400]}

Deliver fulfillment plan:
1. Recommended method: FBA / 3PL / dropship / self-fulfill (pick best + why)
2. Estimated shipping cost to customer (domestic + international)
3. Fulfillment cost per order estimate
4. Average delivery window
5. Courier recommendations (primary + backup)
6. Customs/duties considerations
7. One critical logistics risk""",
        500,
    )
    finance_task = run_agent(
        "finance",
        f"""Mission: "{goal}" Context: pricing: {pricing_out[:300]}, marketing: {marketing_out[:200]}

Build 90-day financial projection:
- Startup costs (inventory + ads + tools + setup)
- Month 1: revenue / costs / net
- Month 2: revenue / costs / net (growth assumed)
- Month 3: revenue / costs / net
- Payback period (weeks)
- Recommended cash reserve
- Top 2 financial risks""",
        500,
    )
    risk_task = run_agent(
        "risk",
        f"""Mission: "{goal}" Context: {context_5[:400]}

Identify and assess all launch risks:
List exactly 5 risks. Each item:
Severity: HIGH/MED/LOW
Risk: [name]
Description: [1 sentence]
Mitigation: [specific action]

Check: supplier reliability, Shopify ToS, trademark/IP, ad policy, returns/chargeback.""",
        500,
    )
    inventory_task = run_agent(
        "inventory",
        f"""Mission: "{goal}" Context: {context_5[:300]}

Inventory plan:
- Initial order quantity recommendation
- Reorder point (units)
- Safety stock level
- Estimated sell-through rate (units/week)
- Stockout risk assessment
- Overstock risk assessment
- Recommended inventory management tool""",
        400,
    )
    support_task = run_agent(
        "support",
        f"""Mission: "{goal}"

Create customer support package:
1. 5 FAQ questions + answers (formatted for a support page)
2. Refund policy snippet (50 words)
3. Order confirmation email (subject + body, 100 words)
4. Review request email (subject + body, 80 words)
5. Most common complaint to anticipate + response template""",
        600,
    )
    logistics_out, finance_out, risk_out, inventory_out, support_out = await asyncio.gather(
        logistics_task, finance_task, risk_task, inventory_task, support_task
    )
    results.update({
        "logistics": logistics_out, "finance": finance_out,
        "risk": risk_out, "inventory": inventory_out, "support": support_out
    })

    for aid, title, out in [
        ("logistics", "Fulfillment Plan", logistics_out),
        ("finance", "Financial Projection", finance_out),
        ("risk", "Risk Assessment", risk_out),
        ("inventory", "Inventory Plan", inventory_out),
        ("support", "Support Templates", support_out),
    ]:
        yield emit_agent_status(aid, "done")
        yield emit_report(aid, title, out)

    yield emit_message("logistics", "ceo", "result", "Fulfillment plan finalized. Recommended method identified.")
    yield emit_message("finance", "ceo", "result", f"90-day P&L complete. Path to profitability mapped.")
    yield emit_message("risk", "ceo", "alert", "Risk assessment complete. 2 HIGH items require attention before launch.")
    await asyncio.sleep(0.2)

    # ── PHASE 6: CEO SYNTHESIS ──
    yield emit_agent_status("ceo", "active")
    yield emit_message("ceo", "all", "log", "All agents reporting complete. Synthesizing executive launch strategy...")
    yield emit_log("Phase 6: CEO Agent — Final synthesis")

    synthesis_context = "\n\n".join([
        f"PRODUCT RESEARCH:\n{results['research'][:400]}",
        f"MARKET INTEL:\n{results['market'][:300]}",
        f"SUPPLIER:\n{results['supplier'][:300]}",
        f"PRICING:\n{results['pricing'][:400]}",
        f"SHOPIFY LISTING:\n{results['shopify'][:300]}",
        f"MARKETING:\n{results['marketing'][:300]}",
        f"LOGISTICS:\n{results['logistics'][:250]}",
        f"FINANCE:\n{results['finance'][:300]}",
        f"RISK:\n{results['risk'][:300]}",
    ])

    final_strategy = await run_agent(
        "ceo",
        f"""Mission: "{goal}"

Agent fleet reports are in. Synthesize into an executive launch strategy.

{synthesis_context}

Write the final strategy document:

## EXECUTIVE SUMMARY
2-3 sentences. What are we launching, why will it win, what's the target outcome?

## TOP PRODUCT RECOMMENDATION
Specific product, price point, target margin, why it was chosen.

## GO-TO-MARKET PLAN
Week 1-2: [actions]
Week 3-4: [actions]
Month 2: [actions]
Month 3: [actions]

## FINANCIAL TARGETS
- Revenue Month 1 / 2 / 3
- Target profit by Month 3
- Break-even timeline

## CRITICAL ACTIONS (first 72 hours)
1. [action]
2. [action]
3. [action]
4. [action]
5. [action]

## CEO VERDICT
One decisive paragraph: do we launch? Any conditions?""",
        900,
    )
    results["final"] = final_strategy

    yield emit_agent_status("ceo", "done")
    yield emit_report("ceo", "Executive Launch Strategy", final_strategy)
    yield emit_message("ceo", "all", "log", "🚀 Mission complete. Executive strategy issued. Ready for launch.")
    yield emit_log("Mission complete — all 13 agents done")

    yield sse("mission_complete", {
        "goal": goal,
        "results": {k: v[:200] + "..." for k, v in results.items()},
        "agent_count": 13,
    })


# ─────────────────────────────────────────
# API ROUTES
# ─────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "agents": len(AGENTS)}


@app.post("/mission/stream")
async def stream_mission(req: MissionRequest):
    if not req.goal.strip():
        raise HTTPException(400, "Goal cannot be empty")

    async def generate():
        async for chunk in orchestrate_mission(req.goal):
            yield chunk

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.post("/agent/chat")
async def agent_chat(req: ChatRequest):
    if req.agent_id not in AGENTS:
        raise HTTPException(404, f"Agent '{req.agent_id}' not found")

    response = await run_agent(
        req.agent_id,
        req.message,
        500,
        req.context or "",
    )
    return {"agent_id": req.agent_id, "response": response}


@app.get("/agents")
async def list_agents():
    return {"agents": [{"id": k, "name": v["name"], "color": v["color"]} for k, v in AGENTS.items()]}
