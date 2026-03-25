import datetime as dt
import uuid
from typing import Any, Dict

import jwt
from flask import Flask, current_app


def init_jwt(app: Flask) -> None:
    app.config.setdefault("JWT_ALGORITHM", "HS256")
    app.config.setdefault("JWT_EXPIRES_IN_MINUTES", 60 * 24 * 7)  # 7 days
    app.config.setdefault("JWT_ISSUER", "caremypet.backend")
    app.config.setdefault("JWT_AUDIENCE", "caremypet.clients")


def generate_jwt(payload: Dict[str, Any]) -> str:
    secret = current_app.config["JWT_SECRET"]
    algorithm = current_app.config["JWT_ALGORITHM"]
    expires_in = current_app.config["JWT_EXPIRES_IN_MINUTES"]
    issuer = current_app.config["JWT_ISSUER"]
    audience = current_app.config["JWT_AUDIENCE"]
    now = dt.datetime.now(dt.UTC)
    to_encode = {
        **payload,
        "iat": now,
        "nbf": now,
        "exp": now + dt.timedelta(minutes=expires_in),
        "iss": issuer,
        "aud": audience,
        "jti": str(uuid.uuid4()),
        "type": "access",
    }
    return jwt.encode(to_encode, secret, algorithm=algorithm)


def verify_jwt(token: str) -> Dict[str, Any]:
    secret = current_app.config["JWT_SECRET"]
    algorithm = current_app.config["JWT_ALGORITHM"]
    issuer = current_app.config["JWT_ISSUER"]
    audience = current_app.config["JWT_AUDIENCE"]
    payload = jwt.decode(
        token,
        secret,
        algorithms=[algorithm],
        audience=audience,
        issuer=issuer,
        options={"require": ["sub", "exp", "iat", "nbf", "iss", "aud", "jti", "type"]},
    )
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Invalid token type")
    return payload

