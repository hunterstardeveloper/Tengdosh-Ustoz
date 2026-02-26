import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Report → Telegram")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "").strip()

class Report(BaseModel):
    isAnonymous: bool
    firstName: str | None = None
    surname: str | None = None
    group: str | None = None
    message: str = Field(..., min_length=20)
    timestamp: str | None = None

@app.get("/")
def health():
    return {"ok": True}

@app.post("/api/report")
def send_report(r: Report):
    if not BOT_TOKEN or not CHAT_ID:
        raise HTTPException(status_code=500, detail="Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment.")

    lines = [
        "📩 New Transmission",
        f"🕒 {r.timestamp or ''}",
        f"👤 Anonymous: {'Yes' if r.isAnonymous else 'No'}",
        ""
    ]

    if not r.isAnonymous:
        lines += [
            f"🧑 First name: {r.firstName or '-'}",
            f"🧾 Surname: {r.surname or '-'}",
            f"👥 Group: {r.group or '-'}",
            ""
        ]

    lines += ["✉️ Message:", r.message]
    text = "\n".join(lines)

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    resp = requests.post(url, json={
        "chat_id": CHAT_ID,
        "text": text,
        "disable_web_page_preview": True
    }, timeout=20)

    data = resp.json()
    if not data.get("ok"):
        raise HTTPException(status_code=400, detail=data)

    return {"ok": True}