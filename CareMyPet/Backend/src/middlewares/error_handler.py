from flask import Flask
from werkzeug.exceptions import BadRequest, RequestEntityTooLarge, UnsupportedMediaType

from ..utils.responses import error
from ..utils.logging import logger


def register_error_handlers(app: Flask) -> None:
  @app.errorhandler(BadRequest)
  def invalid_request(e):  # type: ignore[override]
    return error(str(e.description or "Invalid request"), 400)

  @app.errorhandler(400)
  def bad_request(e):  # type: ignore[override]
    description = getattr(e, "description", None)
    message = description if isinstance(description, str) and description.strip() else "Bad request"
    return error(message, 400)

  @app.errorhandler(401)
  def unauthorized(e):  # type: ignore[override]
    return error("Unauthorized", 401)

  @app.errorhandler(403)
  def forbidden(e):  # type: ignore[override]
    return error("Forbidden", 403)

  @app.errorhandler(404)
  def not_found(e):  # type: ignore[override]
    return error("Not found", 404)

  @app.errorhandler(413)
  @app.errorhandler(RequestEntityTooLarge)
  def too_large(e):  # type: ignore[override]
    return error("Uploaded content is too large", 413)

  @app.errorhandler(415)
  @app.errorhandler(UnsupportedMediaType)
  def unsupported_media_type(e):  # type: ignore[override]
    return error(str(e.description or "Unsupported media type"), 415)

  @app.errorhandler(500)
  def internal(e):  # type: ignore[override]
    logger.exception("Unhandled server error: %s", e)
    return error("Internal server error", 500)

