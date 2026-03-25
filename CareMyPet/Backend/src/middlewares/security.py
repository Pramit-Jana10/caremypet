from flask import Flask, request


def init_security(app: Flask) -> None:
  @app.after_request
  def _set_security_headers(response):
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    response.headers.setdefault(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    )

    if request.path.startswith("/api/auth/"):
      response.headers.setdefault("Cache-Control", "no-store")

    forwarded_proto = (request.headers.get("X-Forwarded-Proto") or "").lower()
    if request.is_secure or forwarded_proto == "https":
      response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

    return response