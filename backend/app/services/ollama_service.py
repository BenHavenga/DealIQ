# dealiq-backend/app/services/ollama_service.py

import os
import httpx
import json

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11435/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

async def ask_ollama(model: str, prompt: str) -> str:
    """
    Sends `prompt` to Ollama's /api/generate endpoint.
    Returns raw assistant response (string).
    """
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(OLLAMA_URL, json=payload, timeout=120)
        resp.raise_for_status()
        data = resp.json()
    return data.get("response", "")

async def generate_memo_from_prompt(prompt: str) -> dict:
    """
    Calls Ollama, tries to parse the returned text as JSON.
    If parsing fails, returns {"GeneratedMemo": raw_text}.
    """
    raw = await ask_ollama(OLLAMA_MODEL, prompt)
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = {"GeneratedMemo": raw}
    return parsed