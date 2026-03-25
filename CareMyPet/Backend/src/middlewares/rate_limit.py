import time
from collections import defaultdict
from threading import Lock
from typing import Dict, Tuple

from flask import Flask, Request, jsonify, request

DEFAULT_WINDOW_SECONDS = 60
DEFAULT_MAX_REQUESTS = 120

ROUTE_LIMITS: Dict[str, Tuple[int, int]] = {
  "/api/auth/send-otp": (5, 600),
  "/api/auth/verify-otp": (10, 600),
  "/api/auth/send-login-otp": (5, 600),
  "/api/auth/verify-login-otp": (10, 600),
  "/api/auth/login": (10, 600),
  "/api/auth/register": (5, 600),
}

_requests: Dict[Tuple[str, str], list[float]] = defaultdict(list)
_lock = Lock()  # protects _requests across threads


def init_rate_limiter(app: Flask) -> None:
  @app.before_request
  def _limit():
    return _apply_rate_limit(request)


def _client_ip(req: Request) -> str:
  forwarded_for = (req.headers.get("X-Forwarded-For") or "").split(",", 1)[0].strip()
  return forwarded_for or req.remote_addr or "unknown"


def _get_limit(req: Request) -> Tuple[int, int]:
  return ROUTE_LIMITS.get(req.path, (DEFAULT_MAX_REQUESTS, DEFAULT_WINDOW_SECONDS))


def _apply_rate_limit(req: Request):
  # Never rate limit CORS preflight; limiting OPTIONS can lock out normal POST flows.
  if req.method == "OPTIONS":
    return None

  max_requests, window_seconds = _get_limit(req)
  key = (_client_ip(req), req.path)
  now = time.time()
  window_start = now - window_seconds

  with _lock:
    timestamps = [t for t in _requests[key] if t > window_start]
    timestamps.append(now)
    _requests[key] = timestamps
    count = len(timestamps)
    oldest_in_window = timestamps[0] if timestamps else now

  if count > max_requests:
    retry_after_seconds = max(1, int((oldest_in_window + window_seconds) - now))
    resp = jsonify({"success": False, "message": "Too many requests"})
    resp.status_code = 429
    resp.headers["Retry-After"] = str(retry_after_seconds)
    return resp

  return None

