from functools import wraps
from typing import Any, Callable, Iterable

from bson import ObjectId
from bson.errors import InvalidId
from flask import Request, g, request

from ..config.jwt_config import verify_jwt
from ..config.db import mongo
from ..services.auth_service import has_premium_access
from .responses import error


def _get_request() -> Request:
  return request  # typed helper


def auth_required(fn: Callable[..., Any]) -> Callable[..., Any]:
  @wraps(fn)
  def wrapper(*args: Any, **kwargs: Any):
    req = _get_request()
    auth_header = req.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
      return error("Authentication required", 401)
    token = auth_header.split(" ", 1)[1]
    try:
      payload = verify_jwt(token)
    except Exception:
      return error("Invalid or expired token", 401)

    user_id = payload.get("sub")
    if not user_id:
      return error("Invalid token payload", 401)

    try:
      user_obj_id = ObjectId(user_id)
    except (InvalidId, TypeError):
      return error("Invalid token payload", 401)

    user = mongo.db.users.find_one({"_id": user_obj_id})
    if not user:
      return error("User not found", 401)

    g.current_user = user
    return fn(*args, **kwargs)

  return wrapper


def roles_required(roles: Iterable[str]) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
  allowed = set(roles)

  def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
    @wraps(fn)
    def wrapper(*args: Any, **kwargs: Any):
      user = getattr(g, "current_user", None)
      role = (user or {}).get("role", "user")
      if role not in allowed:
        return error("Forbidden", 403)
      return fn(*args, **kwargs)

    return wrapper

  return decorator


def premium_required(feature: str | None = None) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
  def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
    @wraps(fn)
    def wrapper(*args: Any, **kwargs: Any):
      user = getattr(g, "current_user", None)
      if not has_premium_access(user, feature):
        return error("Premium membership required", 403)
      return fn(*args, **kwargs)

    return wrapper

  return decorator

