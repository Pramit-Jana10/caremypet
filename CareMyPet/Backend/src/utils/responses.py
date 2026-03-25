from typing import Any, Dict, Tuple

from flask import jsonify


def success(data: Any = None, status: int = 200) -> Tuple[Any, int]:
  payload: Dict[str, Any] = {"success": True}
  if data is not None:
    payload["data"] = data
  return jsonify(payload), status


def error(message: str, status: int = 400, details: Any | None = None) -> Tuple[Any, int]:
  payload: Dict[str, Any] = {"success": False, "message": message}
  if details is not None:
    payload["details"] = details
  return jsonify(payload), status

