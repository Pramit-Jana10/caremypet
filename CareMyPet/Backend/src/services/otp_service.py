import datetime as dt
import random
import string

import jwt
from flask import current_app

from ..config.db import mongo
from ..config.mail import send_email

OTP_EXPIRY_SECONDS = 600


def _otp_collection():
    return mongo.db.otp_verifications


def _as_utc(value: dt.datetime) -> dt.datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=dt.UTC)
    return value.astimezone(dt.UTC)


def generate_otp(email: str) -> str:
    """Generate a 6-digit OTP, store it in MongoDB, and email it to the user."""
    email = email.lower().strip()

    # Delete any previous OTPs for this email
    _otp_collection().delete_many({"email": email})

    code = "".join(random.choices(string.digits, k=6))

    _otp_collection().insert_one(
        {
            "email": email,
            "otp": code,
            "createdAt": dt.datetime.now(dt.UTC),
        }
    )

    # TTL index is managed centrally during DB init.

    # Send the email
    subject = "Your CareMyPet Verification Code"
    body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto;
                padding: 32px; background: #ffffff; border-radius: 16px;
                border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">🐾 CareMyPet</h1>
        </div>
        <h2 style="color: #1f2937; font-size: 20px; text-align: center; margin-bottom: 8px;">
            Email Verification
        </h2>
        <p style="color: #6b7280; text-align: center; font-size: 14px; margin-bottom: 24px;">
            Use the code below to verify your email address.
        </p>
        <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; text-align: center;
                    margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #7c3aed;">
                {code}
            </span>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            This code expires in <strong>{OTP_EXPIRY_SECONDS // 60} minutes</strong>. Do not share it with anyone.
        </p>
    </div>
    """
    send_email(subject, body, [email])

    # Always log the OTP server-side to unblock local development
    # even when SMTP credentials are not working.
    print(f"[OTP] Verification code for {email}: {code}")

    return code


def verify_otp(email: str, otp: str) -> str:
    """Verify the OTP and return a signed otpToken JWT on success."""
    email = email.lower().strip()

    record = _otp_collection().find_one({"email": email, "otp": otp})
    if not record:
        raise ValueError("Invalid or expired OTP")

    # Check expiry manually as a safety net (TTL index is eventual)
    created = record.get("createdAt")
    if created and (dt.datetime.now(dt.UTC) - _as_utc(created)).total_seconds() > OTP_EXPIRY_SECONDS:
        _otp_collection().delete_one({"_id": record["_id"]})
        raise ValueError("OTP has expired")

    # OTP is valid — delete it so it can't be reused
    _otp_collection().delete_one({"_id": record["_id"]})

    # Issue a short-lived JWT (10 minutes) proving this email is verified
    secret = current_app.config["JWT_SECRET"]
    algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")
    issuer = current_app.config.get("JWT_ISSUER", "caremypet.backend")
    audience = current_app.config.get("JWT_AUDIENCE", "caremypet.clients")
    now = dt.datetime.now(dt.UTC)
    payload = {
        "email": email,
        "purpose": "otp_verified",
        "iat": now,
        "nbf": now,
        "exp": now + dt.timedelta(minutes=10),
        "iss": issuer,
        "aud": audience,
        "type": "otp",
    }
    return jwt.encode(payload, secret, algorithm=algorithm)


def validate_otp_token(otp_token: str) -> str:
    """Decode an otpToken and return the verified email. Raises on invalid/expired."""
    secret = current_app.config["JWT_SECRET"]
    algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")
    issuer = current_app.config.get("JWT_ISSUER", "caremypet.backend")
    audience = current_app.config.get("JWT_AUDIENCE", "caremypet.clients")
    try:
        data = jwt.decode(
            otp_token,
            secret,
            algorithms=[algorithm],
            audience=audience,
            issuer=issuer,
            options={"require": ["email", "purpose", "exp", "iat", "nbf", "iss", "aud", "type"]},
        )
    except jwt.ExpiredSignatureError:
        raise ValueError("OTP verification has expired, please verify again")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid OTP verification token")

    if data.get("purpose") != "otp_verified" or data.get("type") != "otp":
        raise ValueError("Invalid OTP verification token")

    return data["email"]
