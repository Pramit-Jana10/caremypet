from __future__ import annotations

import re
from datetime import date
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from email_validator import EmailNotValidError, validate_email
from flask import Request, request
from werkzeug.exceptions import BadRequest, UnsupportedMediaType

_JSON_CONTENT_TYPES = {"application/json"}
_PASSWORD_LOWER_RE = re.compile(r"[a-z]")
_PASSWORD_UPPER_RE = re.compile(r"[A-Z]")
_PASSWORD_DIGIT_RE = re.compile(r"\d")


def get_json_body(req: Request | None = None) -> dict[str, Any]:
  req = req or request
  mimetype = (req.mimetype or "").lower()
  if mimetype not in _JSON_CONTENT_TYPES and not mimetype.endswith("+json"):
    raise UnsupportedMediaType("Content-Type must be application/json")

  payload = req.get_json(silent=False)
  if payload is None:
    return {}
  if not isinstance(payload, dict):
    raise BadRequest("JSON body must be an object")
  return payload


def optional_string(value: Any, field: str, *, max_length: int, allow_empty: bool = False) -> str | None:
  if value is None:
    return None
  if not isinstance(value, str):
    raise BadRequest(f"{field} must be a string")

  cleaned = value.strip()
  if not cleaned and not allow_empty:
    return None
  if len(cleaned) > max_length:
    raise BadRequest(f"{field} must be at most {max_length} characters")
  return cleaned


def required_string(value: Any, field: str, *, max_length: int) -> str:
  cleaned = optional_string(value, field, max_length=max_length)
  if not cleaned:
    raise BadRequest(f"{field} is required")
  return cleaned


def bounded_int(value: Any, field: str, *, minimum: int, maximum: int) -> int:
  try:
    parsed = int(value)
  except (TypeError, ValueError):
    raise BadRequest(f"{field} must be a whole number")

  if parsed < minimum or parsed > maximum:
    raise BadRequest(f"{field} must be between {minimum} and {maximum}")
  return parsed


def bounded_float(value: Any, field: str, *, minimum: float, maximum: float) -> float:
  try:
    parsed = float(value)
  except (TypeError, ValueError):
    raise BadRequest(f"{field} must be a number")

  if parsed < minimum or parsed > maximum:
    raise BadRequest(f"{field} must be between {minimum} and {maximum}")
  return round(parsed, 2)


def normalize_email(value: Any) -> str:
  email = required_string(value, "Email", max_length=254)
  try:
    validated = validate_email(email, check_deliverability=False)
  except EmailNotValidError as exc:
    raise BadRequest(str(exc))
  return validated.normalized.lower()


def get_object_id(value: Any, field: str) -> ObjectId:
  if not isinstance(value, str) or not value.strip():
    raise BadRequest(f"{field} is required")
  try:
    return ObjectId(value.strip())
  except (InvalidId, TypeError):
    raise BadRequest(f"Invalid {field}")


def safe_contains_regex(value: Any, field: str, *, max_length: int = 64) -> dict[str, str] | None:
  cleaned = optional_string(value, field, max_length=max_length)
  if not cleaned:
    return None
  return {"$regex": re.escape(cleaned), "$options": "i"}


def ensure_password_strength(value: Any) -> str:
  if not isinstance(value, str):
    raise BadRequest("Password must be a string")
  password = value.strip()
  if len(password) < 12 or len(password) > 128:
    raise BadRequest("Password must be between 12 and 128 characters")
  if not _PASSWORD_LOWER_RE.search(password):
    raise BadRequest("Password must contain at least one lowercase letter")
  if not _PASSWORD_UPPER_RE.search(password):
    raise BadRequest("Password must contain at least one uppercase letter")
  if not _PASSWORD_DIGIT_RE.search(password):
    raise BadRequest("Password must contain at least one number")
  return password


def parse_iso_date(value: Any, field: str) -> date:
  raw = required_string(value, field, max_length=10)
  try:
    return date.fromisoformat(raw)
  except ValueError:
    raise BadRequest(f"{field} must use YYYY-MM-DD format")