import os
import base64
import json
from typing import Dict, List

import requests


SAFETY_SYSTEM_PROMPT = """
You are the Smart Pet Care AI assistant for a pet accessories, medicines, vaccines and vet directory platform.

STRICT SAFETY RULES:
- You are NOT a veterinarian and must not provide medical diagnoses.
- Never prescribe specific drugs, dosages, or treatment plans.
- For anything urgent, severe, or life-threatening, immediately tell the user to contact an emergency vet or local clinic.
- Always encourage users to consult a licensed veterinarian for medical decisions.
- You MAY:
  - Give high-level pet care education (e.g., typical vaccine schedules, general hygiene, exercise, nutrition best practices).
  - Explain how to use this app: browsing products, finding vets and viewing their profiles, tracking vaccines, viewing orders.
- If the user asks for help that goes beyond these bounds, politely refuse and redirect them to a vet.
"""


def extract_medicine_names_from_prescription(file_bytes: bytes, mime_type: str) -> List[str]:
    """
    Uses Gemini multimodal input to extract medicine names from a prescription image.
    Returns a unique list of medicine names. Falls back to empty list on errors.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not file_bytes or not mime_type.startswith("image/"):
        return []

    prompt = (
        "You are reading a veterinary prescription image. "
        "Extract only medicine names (brand or generic) that are prescribed. "
        "Ignore dosage, timings, notes, signatures, and clinic details. "
        "Return strict JSON in this format: {\"medicines\": [\"name1\", \"name2\"]}. "
        "Do not include markdown or extra text."
    )

    try:
        encoded = base64.b64encode(file_bytes).decode("ascii")
        response = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            params={"key": api_key},
            json={
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": encoded,
                                }
                            },
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.1,
                    "topP": 0.8,
                    "maxOutputTokens": 512,
                },
            },
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]

        parsed = json.loads(text)
        medicines = parsed.get("medicines", []) if isinstance(parsed, dict) else []

        cleaned: List[str] = []
        seen = set()
        for name in medicines:
            if not isinstance(name, str):
                continue
            value = name.strip()
            key = value.lower()
            if value and key not in seen:
                seen.add(key)
                cleaned.append(value)
        return cleaned
    except Exception:
        return []


def ask_chatbot(messages: List[dict]) -> str:
    """
    Wrapper around the Google Gemini HTTP API.
    Expects messages in the usual [{"role": "user" | "assistant" | "system", "content": "..."}, ...] format.
    Adds a strong safety/system prompt suitable for Smart Pet Care.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "AI chatbot is not configured. Please contact support."
    contents: List[Dict] = []

    contents.append({"parts": [{"text": SAFETY_SYSTEM_PROMPT.strip()}]})

    for m in messages:
        role = m.get("role", "user")
        text = m.get("content", "")
        if not text:
            continue
        contents.append({"parts": [{"text": f"{role.upper()}: {text}"}]})

    if not contents:
        contents = [{"parts": [{"text": SAFETY_SYSTEM_PROMPT.strip() + "\nUSER: Hello"}]}]

    try:
        response = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            params={"key": api_key},
            json={
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.3,
                    "topP": 0.9,
                    "maxOutputTokens": 512,
                },
            },
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except requests.HTTPError as http_err:
        try:
            err_json = http_err.response.json()
            msg = err_json.get("error", {}).get("message") or str(http_err)
        except Exception:
            msg = str(http_err)
        return f"Chat service error: {msg}"
    except Exception:
        return "Sorry, I'm having trouble responding right now."
