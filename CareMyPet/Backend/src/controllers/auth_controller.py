import os

from flask import Blueprint, g, request

from ..services import auth_service
from ..services import otp_service
from ..utils.decorators import auth_required
from ..utils.responses import error, success
from ..utils.security import ensure_password_strength, get_json_body, normalize_email, required_string


bp = Blueprint("auth", __name__)


@bp.post("/auth/send-otp")
def send_otp():
  """Send OTP for email verification during registration."""
  data = get_json_body(request)
  email = normalize_email(data.get("email"))
  # Check if email is already registered
  existing = auth_service.find_user_by_email(email)
  if existing:
    return error("Email already in use", 400)
  try:
    otp_service.generate_otp(email)
  except Exception as e:
    return error(str(e), 500)
  return success({"message": "OTP sent to your email"}, 200)


@bp.post("/auth/verify-otp")
def verify_otp():
  """Verify registration OTP and issue a short-lived otpToken."""
  data = get_json_body(request)
  email = normalize_email(data.get("email"))
  otp = required_string(data.get("otp"), "OTP", max_length=12)
  try:
    otp_token = otp_service.verify_otp(email, otp)
  except ValueError as e:
    return error(str(e), 400)
  return success({"otpToken": otp_token}, 200)


@bp.post("/auth/register")
def register():
  data = get_json_body(request)
  name = required_string(data.get("name"), "Name", max_length=80)
  email = normalize_email(data.get("email"))
  password = ensure_password_strength(data.get("password"))
  otp_token = required_string(data.get("otpToken"), "otpToken", max_length=2048)
  # Validate the OTP token and ensure emails match
  try:
    verified_email = otp_service.validate_otp_token(otp_token)
  except ValueError as e:
    return error(str(e), 400)
  if verified_email.lower() != email.lower():
    return error("Email mismatch with verification", 400)
  try:
    token, user = auth_service.register_user(name, email, password)
  except ValueError as e:
    return error(str(e), 400)
  return success({"token": token, "user": user}, 201)


@bp.post("/auth/send-login-otp")
def send_login_otp():
  """Send OTP for two-factor authentication during login."""
  data = get_json_body(request)
  email = normalize_email(data.get("email"))
  existing = auth_service.find_user_by_email(email)
  if not existing:
    return error("No account found with this email", 404)
  try:
    otp_service.generate_otp(email)
  except Exception as e:
    return error(str(e), 500)
  return success({"message": "Login OTP sent to your email"}, 200)


@bp.post("/auth/verify-login-otp")
def verify_login_otp():
  """Verify login OTP and issue an otpToken to be used for 2FA login."""
  data = get_json_body(request)
  email = normalize_email(data.get("email"))
  otp = required_string(data.get("otp"), "OTP", max_length=12)
  try:
    otp_token = otp_service.verify_otp(email, otp)
  except ValueError as e:
    return error(str(e), 400)
  return success({"otpToken": otp_token}, 200)


@bp.post("/auth/login")
def login():
  """Login with password + email OTP (two-factor authentication)."""
  data = get_json_body(request)
  email = normalize_email(data.get("email"))
  password = required_string(data.get("password"), "Password", max_length=128)
  otp_token = required_string(data.get("otpToken"), "otpToken", max_length=2048)
  # Validate OTP token and ensure it matches the email
  try:
    verified_email = otp_service.validate_otp_token(otp_token)
  except ValueError as e:
    return error(str(e), 400)
  if verified_email.lower() != email.lower():
    return error("Email mismatch with two-factor verification", 400)
  try:
    token, user = auth_service.login_user(email, password)
  except ValueError as e:
    return error(str(e), 401)
  return success({"token": token, "user": user}, 200)


@bp.post("/auth/admin/login")
def admin_login():
  """Login path restricted to admin users while normal login remains unchanged."""
  data = get_json_body(request)
  email = normalize_email(data.get("email"))
  password = required_string(data.get("password"), "Password", max_length=128)
  otp_token = required_string(data.get("otpToken"), "otpToken", max_length=2048)
  try:
    verified_email = otp_service.validate_otp_token(otp_token)
  except ValueError as e:
    return error(str(e), 400)
  if verified_email.lower() != email.lower():
    return error("Email mismatch with two-factor verification", 400)
  try:
    token, user = auth_service.admin_login_user(email, password)
  except ValueError as e:
    return error(str(e), 403 if str(e) == "Admin access required" else 401)
  return success({"token": token, "user": user}, 200)


@bp.post("/auth/forgot-password")
def forgot_password():
  data = get_json_body(request)
  email = normalize_email(data.get("email"))
  reset_meta = auth_service.send_password_reset_link(email)

  payload = {"message": "If an account exists, a reset link will be sent."}
  expose_debug_link = os.getenv("DEBUG_PASSWORD_RESET_LINK", "false").lower() == "true"
  if expose_debug_link and reset_meta.get("hasAccount") and not reset_meta.get("emailSent"):
    payload["debugResetLink"] = reset_meta.get("resetLink")

  return success(payload, 200)


@bp.post("/auth/reset-password")
def reset_password():
  data = get_json_body(request)
  reset_token = required_string(data.get("token"), "token", max_length=4096)
  password = required_string(data.get("password"), "Password", max_length=128)
  try:
    auth_service.reset_password_with_token(reset_token, password)
  except ValueError as e:
    return error(str(e), 400)
  return success({"message": "Password reset successful"}, 200)


@bp.get("/auth/profile")
@auth_required
def profile():
  user = g.current_user
  user_id = str(user["_id"])
  profile = auth_service.get_profile(user_id)
  if not profile:
    return error("User not found", 404)
  return success(profile, 200)
