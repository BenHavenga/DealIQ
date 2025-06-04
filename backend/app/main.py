# app/main.py

import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from app.utils.finance_data import get_company_data
from app.services.ollama_service import generate_memo_from_prompt

load_dotenv()  # loads .env variables: OLLAMA_URL, OLLAMA_MODEL, NEWSAPI_KEY

app = FastAPI(title="DealIQ Backend (Deep‐Dive Prompts)", version="1.5")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MemoRequest(BaseModel):
    ticker: str

@app.post("/api/generate_memo")
async def generate_memo(req: MemoRequest):
    ticker = req.ticker.strip().upper()
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker is required")

    # 1) Fetch numeric/company data
    try:
        company_info = get_company_data(ticker)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

    # 2) Build a deeper‐analysis prompt that still outputs {"memo": { ...eight keys... }}
    prompt = f"""
You are a JSON‐only investment‐banking AI.  Do NOT output any plain text—only valid JSON.

Using only the data below as context, write an in‐depth, data‐driven investment banking memo under a top‐level "memo" key.  
For each of the eight sections, provide deep analysis, quantitative reasoning, and context:

  1. "Executive Summary" – deliver a concise but high‐impact overview that synthesizes the company’s current market position, recent performance trends, and near‐term outlook.  Cite any standout metrics (e.g. YoY revenue growth, margin trends).

  2. "Business Overview" – describe the company's detailed operations, revenue segments, geographic breakdown, competitive moats, and recent strategic initiatives.  Highlight any recent product launches or shifts in strategy.

  3. "Financial Highlights" – go beyond P/E and EPS.  Summarize trailing twelve‐month and year‐over‐year changes in revenue, EBITDA, net income, operating margins, and free cash flow.  Compare these metrics to industry or peer averages.

  4. "Comparable Companies" – identify 2–3 true, listed peers.  Provide their current valuation multiples (P/E, EV/EBITDA), and briefly compare them to the subject company.  Suggest whether the subject trades at a premium or discount, and quantify that gap.

  5. "Valuation Narrative" – walk through a primary valuation framework (e.g., DCF with key assumptions: discount rate, terminal growth, forecast revenue/EBITDA).  Then reference a multiples‐based approach (e.g., applying peer P/E or EV/EBITDA to the subject).  Provide a synthetic "fair value" or range, and outline key drivers or sensitivities.

  6. "Risks & Recommendations" – list the top 3–5 risks with a sentence or two on each (regulatory, macro, execution, supply chain).  Then provide a clear recommendation (BUY, SELL, or HOLD) and a short rationale explaining how you balanced upside vs. downside risks.

  7. "Recommendation" – explicitly state either "BUY", "SELL", or "HOLD" based on the above analysis.  Very briefly restate the key drivers for your recommendation.

  8. "Target Price" – give a 12‐month price target (e.g., "$215.00") derived from your valuation methodology.  If your valuation yields a range, specify a midpoint and show how you arrived at that number.

Below is the relevant context.  Use it thoroughly—do not invent numbers; draw your narrative from the given data.

=== COMPANY PROFILE & FINANCIAL DATA ===
{company_info['profile_snippet']}

=== RECENT NEWS & EVENTS (Last 7 days) ===
{company_info['news_snippet']}

Return exactly one JSON object in this format (no extra keys, no commentary outside JSON):

{{
  "memo": {{
    "Executive Summary": "...",
    "Business Overview": "...",
    "Financial Highlights": "...",
    "Comparable Companies": "...",
    "Valuation Narrative": "...",
    "Risks & Recommendations": "...",
    "Recommendation": "...",
    "Target Price": "..."
  }}
}}
"""

    # For debugging:
    print("\n=== PROMPT SENT TO OLLAMA ===\n")
    print(prompt)
    print("\n=== END PROMPT ===\n")

    # 3) Send to Ollama
    try:
        raw = await generate_memo_from_prompt(prompt)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Ollama error: {e}")

    print("=== RAW RESPONSE FROM OLLAMA ===")
    print(raw)
    print("=== END RAW RESPONSE ===\n")

    # 4) Normalize into exactly { "memo": { eight keys } }
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            # fallback: wrap entire string as memo.Executive Summary
            raw = {
                "memo": {
                    "Executive Summary": raw,
                    "Business Overview": "",
                    "Financial Highlights": "",
                    "Comparable Companies": "",
                    "Valuation Narrative": "",
                    "Risks & Recommendations": "",
                    "Recommendation": "",
                    "Target Price": ""
                }
            }

    if not isinstance(raw, dict) or "memo" not in raw or not isinstance(raw["memo"], dict):
        # fallback: wrap entire as Executive Summary
        raw = {
            "memo": {
                "Executive Summary": json.dumps(raw),
                "Business Overview": "",
                "Financial Highlights": "",
                "Comparable Companies": "",
                "Valuation Narrative": "",
                "Risks & Recommendations": "",
                "Recommendation": "",
                "Target Price": ""
            }
        }

    # Ensure all eight keys exist
    memo_obj = {}
    for key in [
        "Executive Summary",
        "Business Overview",
        "Financial Highlights",
        "Comparable Companies",
        "Valuation Narrative",
        "Risks & Recommendations",
        "Recommendation",
        "Target Price"
    ]:
        val = raw["memo"].get(key, "")
        memo_obj[key] = val if val is not None else ""

    # 5) Merge numeric/company + memo and return
    response_payload = {
        "company_name": company_info["company_name"],
        "Sector": company_info["sector"],
        "Market Cap": company_info["market_cap"],
        "Price": company_info["price"],
        "Volume": company_info["volume"],
        "Price Change": company_info["price_change"],
        "Key Metrics": company_info["key_metrics"],
        "memo": memo_obj
    }

    return response_payload