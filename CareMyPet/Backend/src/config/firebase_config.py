import os
from typing import Dict, Optional

import requests


def send_fcm_notification(token: str, title: str, body: str, data: Optional[Dict[str, str]] = None) -> None:
    server_key = os.getenv("FIREBASE_SERVER_KEY")
    if not server_key:
        return

    headers = {
        "Authorization": f"key={server_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "to": token,
        "notification": {"title": title, "body": body},
        "data": data or {},
    }
    try:
        requests.post("https://fcm.googleapis.com/fcm/send", json=payload, headers=headers, timeout=5)
    except Exception:
        # Fail silently in this environment
        return

