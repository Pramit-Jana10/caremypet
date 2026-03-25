from flask import Blueprint, g, request

from ..config.db import mongo
from ..services import auth_service
from ..utils.decorators import auth_required, roles_required
from ..utils.responses import error, success
from ..utils.security import get_json_body, get_object_id, optional_string, parse_iso_date, required_string


bp = Blueprint("users", __name__)


@bp.get("/users/me")
@auth_required
def me():
  profile = auth_service.get_profile(g.current_user["_id"])
  return success(profile, 200)


@bp.put("/users/update")
@auth_required
def update_me():
  data = get_json_body(request)
  updates = {}
  if "name" in data:
    name = optional_string(data.get("name"), "Name", max_length=80)
    if name:
      updates["name"] = name
  if "fcmToken" in data:
    updates["fcmToken"] = optional_string(data.get("fcmToken"), "fcmToken", max_length=4096, allow_empty=True)
  if updates:
    mongo.db.users.update_one({"_id": g.current_user["_id"]}, {"$set": updates})
  return success(auth_service.get_profile(g.current_user["_id"]), 200)


@bp.get("/users/me/subscription")
@auth_required
def my_subscription():
  profile = auth_service.get_profile(g.current_user["_id"])
  if not profile:
    return error("User not found", 404)
  return success(profile.get("subscription", {}), 200)


@bp.get("/users/dashboard")
@auth_required
def dashboard_summary():
  # Simple counts for overview; frontend also calls specific endpoints.
  user_id = str(g.current_user["_id"])
  orders = mongo.db.orders.count_documents({"userId": user_id})
  pets = mongo.db.pets.count_documents({"ownerId": user_id})
  return success({"orders": orders, "pets": pets}, 200)


@bp.get("/admin/users")
@auth_required
@roles_required(["admin"])
def admin_users():
  users = [auth_service.get_profile(u["_id"]) for u in mongo.db.users.find()]
  return success(users, 200)


@bp.put("/admin/users/<user_id>/premium")
@auth_required
@roles_required(["admin"])
def set_user_premium(user_id: str):
  data = get_json_body(request)
  target_user_id = str(get_object_id(user_id, "user id"))
  enabled = bool(data.get("enabled", False))
  plan = required_string(data.get("plan") or ("premium" if enabled else "free"), "plan", max_length=40).lower()

  raw_features = data.get("features") or []
  if not isinstance(raw_features, list):
    return error("features must be an array", 400)

  features: list[str] = []
  for feature in raw_features:
    features.append(required_string(feature, "feature", max_length=64).lower())

  expires_on = None
  if data.get("expiresOn"):
    expires_on = parse_iso_date(data.get("expiresOn"), "expiresOn").isoformat()

  updated_user = auth_service.update_premium_membership(
    target_user_id,
    enabled=enabled,
    plan=plan,
    features=features,
    expires_on=expires_on,
  )
  if not updated_user:
    return error("User not found", 404)
  return success(updated_user, 200)

