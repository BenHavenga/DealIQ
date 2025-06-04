# dealiq-backend/app/utils/finance_data.py

import os
import requests
import yfinance as yf
from datetime import datetime, timedelta

NEWS_API_KEY = os.getenv("NEWSAPI_KEY", "")  # optional

def get_company_data(ticker: str) -> dict:
    """
    Fetches company info and key metrics via yfinance.
    Optionally fetches 3 recent news headlines via NewsAPI if NEWS_API_KEY is set.
    Returns a dict containing:
      - company_name, sector, market_cap, price, volume, price_change,
      - key_metrics (dict with peRatio, eps, dividend, beta),
      - profile_snippet (text block),
      - news_snippet (top 3 headlines or placeholder).
    """
    tk = yf.Ticker(ticker)
    info = tk.info

    # Basic sanity check
    if "longBusinessSummary" not in info:
        raise ValueError(f"Ticker '{ticker}' not found or missing profile.")

    company_name = info.get("longName") or info.get("shortName") or ticker
    sector = info.get("sector", "N/A")

    # Market cap formatting
    mc = info.get("marketCap", None)
    if isinstance(mc, (int, float)):
        if mc >= 1e9:
            market_cap = f"${mc/1e9:.2f}B"
        elif mc >= 1e6:
            market_cap = f"${mc/1e6:.2f}M"
        else:
            market_cap = f"${mc:.2f}"
    else:
        market_cap = "N/A"

    # Price and price change
    current_price = info.get("currentPrice", None)
    prev_close = info.get("previousClose", None)
    if isinstance(current_price, (int, float)) and isinstance(prev_close, (int, float)):
        price = f"${current_price:.2f}"
        change_pct = ((current_price - prev_close) / prev_close) * 100
        price_change = f"{change_pct:+.2f}%"
    else:
        price = "N/A"
        price_change = "N/A"

    # Volume
    vol = info.get("volume", None)
    volume = f"{vol:,}" if isinstance(vol, (int, float)) else "N/A"

    # Key metrics
    trailing_pe = info.get("trailingPE", "N/A")
    trailing_eps = info.get("trailingEps", "N/A")
    dividend_rate = info.get("dividendRate", "N/A")
    beta = info.get("beta", "N/A")

    key_metrics = {
        "peRatio": f"{trailing_pe:.2f}" if isinstance(trailing_pe, (int, float)) else "N/A",
        "eps": f"${trailing_eps:.2f}" if isinstance(trailing_eps, (int, float)) else "N/A",
        "dividend": f"${dividend_rate:.2f}" if isinstance(dividend_rate, (int, float)) else "N/A",
        "beta": f"{beta:.2f}" if isinstance(beta, (int, float)) else "N/A",
    }

    # Build a short profile snippet for context
    long_summary = info.get("longBusinessSummary", "")
    profile_snippet = (
        f"Name: {company_name}\n"
        f"Sector: {sector}\n"
        f"Market Cap: {market_cap}\n"
        f"Current Price: {price}\n"
        f"P/E (TTM): {trailing_pe}\n"
        f"EPS (TTM): {trailing_eps}\n"
        f"Dividend Rate: {dividend_rate}\n"
        f"Beta: {beta}\n\n"
        f"Business Summary: {long_summary[:500]}...\n"
    )

    # Fetch recent news (top 3 headlines) if API key provided
    if NEWS_API_KEY:
        seven_days_ago = (datetime.utcnow() - timedelta(days=7)).date()
        url = (
            "https://newsapi.org/v2/everything?"
            f"q={company_name}&"
            f"from={seven_days_ago}&"
            "sortBy=publishedAt&"
            f"apiKey={NEWS_API_KEY}"
        )
        resp = requests.get(url)
        if resp.status_code == 200:
            data = resp.json()
            articles = data.get("articles", [])[:3]
            lines = []
            for art in articles:
                date_str = art.get("publishedAt", "")[:10]
                title = art.get("title", "")
                src = art.get("source", {}).get("name", "")
                lines.append(f"{date_str} – {title} ({src})")
            news_snippet = "\n".join(lines)
        else:
            news_snippet = "No news available."
    else:
        news_snippet = "NewsAPI key not configured; skipping news."

    return {
        "company_name": company_name,
        "sector": sector,
        "market_cap": market_cap,
        "price": price,
        "volume": volume,
        "price_change": price_change,
        "key_metrics": key_metrics,
        "profile_snippet": profile_snippet,
        "news_snippet": news_snippet,
    }