import datetime as dt
from typing import Optional


def parse_iso(date_str: str) -> Optional[dt.datetime]:
  try:
    return dt.datetime.fromisoformat(date_str.replace("Z", "+00:00"))
  except Exception:
    return None


def today_utc() -> dt.date:
  return dt.datetime.utcnow().date()

