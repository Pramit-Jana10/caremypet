import os
from datetime import UTC, datetime, timedelta
from datetime import date
from typing import Optional, Tuple

from bson import ObjectId
import jwt
from flask import current_app

from ..config.db import mongo
from ..config.jwt_config import generate_jwt
from ..config.mail import send_email
from ..models.user import create_user
from ..utils.password import hash_password, verify_password
from ..utils.security import ensure_password_strength, normalize_email, required_string


def _get_admin_emails() -> set[str]:
  configured = os.getenv("ADMIN_EMAILS", "")
  emails = set()
  for email in configured.split(","):
    email = email.strip()
    if email:
      emails.add(normalize_email(email))
  return emails


def _resolve_role_for_email(email: str) -> str:
  return "admin" if normalize_email(email) in _get_admin_emails() else "user"


def _sync_admin_role(user: dict | None) -> dict | None:
  if not user:
    return user

  email = user.get("email")
  if email and _resolve_role_for_email(email) == "admin" and user.get("role") != "admin":
    mongo.db.users.update_one({"_id": user["_id"]}, {"$set": {"role": "admin"}})
    user = mongo.db.users.find_one({"_id": user["_id"]})
  return user


def find_user_by_email(email: str) -> Optional[dict]:
  return mongo.db.users.find_one({"email": normalize_email(email)})


def register_user(name: str, email: str, password: str) -> Tuple[str, dict]:
  clean_name = required_string(name, "Name", max_length=80)
  clean_email = normalize_email(email)
  strong_password = ensure_password_strength(password)

  existing = find_user_by_email(email)
  if existing:
    raise ValueError("Email already in use")
  pwd_hash = hash_password(strong_password)
  role = _resolve_role_for_email(clean_email)
  user_id = create_user(clean_name, clean_email, pwd_hash, role=role)
  user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
  token = generate_jwt({"sub": user_id})
  return token, _serialize_user(user)


def login_user(email: str, password: str) -> Tuple[str, dict]:
  user = _sync_admin_role(find_user_by_email(email))
  if not user:
    raise ValueError("Invalid email")
  if not verify_password(password, user.get("password", b"")):
    raise ValueError("Invalid password")
  user_id = str(user["_id"])
  token = generate_jwt({"sub": user_id})
  return token, _serialize_user(user)


def admin_login_user(email: str, password: str) -> Tuple[str, dict]:
  token, user = login_user(email, password)
  if user.get("role") != "admin":
    raise ValueError("Admin access required")
  return token, user


def issue_password_reset_token(email: str) -> str:
  secret = current_app.config["JWT_SECRET"]
  algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")
  issuer = current_app.config.get("JWT_ISSUER", "caremypet.backend")
  audience = current_app.config.get("JWT_AUDIENCE", "caremypet.clients")
  now = datetime.now(UTC)
  payload = {
    "email": normalize_email(email),
    "purpose": "password_reset",
    "iat": now,
    "nbf": now,
    "exp": now + timedelta(minutes=30),
    "iss": issuer,
    "aud": audience,
    "type": "password_reset",
  }
  return jwt.encode(payload, secret, algorithm=algorithm)


def send_password_reset_link(email: str) -> dict:
  user = find_user_by_email(email)
  if not user:
    return {"hasAccount": False, "emailSent": False}

  token = issue_password_reset_token(email)
  frontend_base = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
  reset_link = f"{frontend_base}/auth/reset-password?token={token}"

  subject = "Reset your CareMyPet password"
  body = f"""
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
    <h2 style="margin: 0 0 8px;">Password reset request</h2>
    <p style="color: #4b5563;">We received a request to reset your password.</p>
    <p>
      <a href="{reset_link}" style="display:inline-block;padding:12px 16px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;">
        Reset password
      </a>
    </p>
    <p style="color: #6b7280; font-size: 13px;">This link expires in 30 minutes.</p>
  </div>
  """

  sent = send_email(subject, body, [normalize_email(email)])
  if not sent:
    print(f"[AUTH] Password reset email could not be sent for {email}. Link: {reset_link}")
  return {
    "hasAccount": True,
    "emailSent": bool(sent),
    "resetLink": reset_link,
  }


def reset_password_with_token(reset_token: str, new_password: str) -> None:
  strong_password = ensure_password_strength(new_password)

  secret = current_app.config["JWT_SECRET"]
  algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")
  issuer = current_app.config.get("JWT_ISSUER", "caremypet.backend")
  audience = current_app.config.get("JWT_AUDIENCE", "caremypet.clients")
  try:
    payload = jwt.decode(
      reset_token,
      secret,
      algorithms=[algorithm],
      audience=audience,
      issuer=issuer,
      options={"require": ["email", "purpose", "exp", "iat", "nbf", "iss", "aud", "type"]},
    )
  except jwt.ExpiredSignatureError:
    raise ValueError("Reset link has expired")
  except jwt.InvalidTokenError:
    raise ValueError("Invalid reset link")

  if payload.get("purpose") != "password_reset" or payload.get("type") != "password_reset":
    raise ValueError("Invalid reset link")

  email = normalize_email(payload["email"])
  user = find_user_by_email(email)
  if not user:
    raise ValueError("Account not found")

  mongo.db.users.update_one(
    {"_id": user["_id"]},
    {"$set": {"password": hash_password(strong_password)}},
  )


def get_profile(user_id: str) -> Optional[dict]:
  user = mongo.db.users.find_one({"_id": ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id})
  if not user:
    return None
  return _serialize_user(user)


def update_premium_membership(
  user_id: str,
  *,
  enabled: bool,
  plan: str,
  features: list[str],
  expires_on: str | None,
) -> Optional[dict]:
  user_object_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
  update = {
    "subscriptionPlan": plan,
    "isPremium": enabled,
    "premiumFeatures": features if enabled else [],
    "premiumExpiresOn": expires_on if enabled else None,
    "premiumSince": datetime.now(UTC).isoformat() if enabled else None,
  }
  mongo.db.users.update_one({"_id": user_object_id}, {"$set": update})
  user = mongo.db.users.find_one({"_id": user_object_id})
  return _serialize_user(user) if user else None


def has_premium_access(user: dict, feature: str | None = None) -> bool:
  if not user:
    return False
  if not user.get("isPremium"):
    return False

  expires_on = user.get("premiumExpiresOn")
  if expires_on:
    try:
      if date.fromisoformat(expires_on) < date.today():
        return False
    except ValueError:
      return False

  if feature is None:
    return True

  allowed_features = user.get("premiumFeatures") or []
  return feature in allowed_features


def _serialize_subscription(doc: dict) -> dict:
  return {
    "plan": doc.get("subscriptionPlan", "free"),
    "isPremium": has_premium_access(doc),
    "premiumFeatures": list(doc.get("premiumFeatures") or []),
    "premiumSince": doc.get("premiumSince"),
    "premiumExpiresOn": doc.get("premiumExpiresOn"),
  }


def _serialize_user(doc: dict) -> dict:
  return {
    "id": str(doc["_id"]),
    "name": doc.get("name"),
    "email": doc.get("email"),
    "role": doc.get("role", "user"),
    "subscription": _serialize_subscription(doc),
  }


def ensure_bootstrap_admin_account() -> None:
  admin_email = normalize_email(
    os.getenv("ADMIN_BOOTSTRAP_EMAIL")
    or os.getenv("ADMIN_EMAIL")
    or "caremypetofficial@gmail.com"
  )
  admin_password = (os.getenv("ADMIN_BOOTSTRAP_PASSWORD") or "visionarybytes55").strip()
  admin_name = (os.getenv("ADMIN_BOOTSTRAP_NAME") or "CareMyPet Admin").strip() or "CareMyPet Admin"

  if not admin_password:
    return

  user = find_user_by_email(admin_email)
  password_hash = hash_password(admin_password)

  if not user:
    create_user(admin_name, admin_email, password_hash, role="admin")
    return

  updates: dict[str, object] = {}
  if user.get("role") != "admin":
    updates["role"] = "admin"

  # Bootstrap the provided admin password once so admin can log in and change it.
  if not user.get("adminPasswordBootstrapped"):
    updates["password"] = password_hash
    updates["adminPasswordBootstrapped"] = True

  if updates:
    mongo.db.users.update_one({"_id": user["_id"]}, {"$set": updates})

