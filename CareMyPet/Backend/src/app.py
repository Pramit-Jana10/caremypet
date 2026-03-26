
import os

from dotenv import load_dotenv
from flask import Flask
from flask_compress import Compress
from flask_cors import CORS

from .config.cache import init_cache
from .config.db import init_db
from .config.jwt_config import init_jwt
from .config.scheduler import init_scheduler
from .config.seed_vets import seed_vets_if_empty
from .config.seed_products import seed_products_if_empty
from .middlewares.error_handler import register_error_handlers
from .middlewares.rate_limit import init_rate_limiter
from .middlewares.security import init_security
from .utils.logging import logger
from .routes import (
    register_auth_routes,
    register_user_routes,
    register_pet_routes,
    register_product_routes,
    register_cart_routes,
    register_order_routes,
    register_vet_routes,
    register_appointment_routes,
    register_vaccination_routes,
    register_medicine_routes,
    register_upload_routes,
    register_chatbot_routes,
    register_learning_routes,
    register_admin_routes,
    register_contact_routes,
)
from .services import auth_service


def _get_allowed_origins() -> list[str]:
    configured = os.getenv("CORS_ALLOWED_ORIGINS", "").strip()
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]

    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "capacitor://localhost",
    ]


def _get_jwt_secret() -> str:
    configured = os.getenv("JWT_SECRET", "").strip()
    if not configured:
        generated = os.urandom(32).hex()
        logger.warning(
            "JWT_SECRET is not set. Using an ephemeral secret for this process only. "
            "Set JWT_SECRET in the environment for stable sessions."
        )
        return generated

    if configured == "change-me-in-production" or len(configured) < 32:
        raise RuntimeError("JWT_SECRET must be at least 32 characters and must not use the default placeholder value")

    return configured


def create_app() -> Flask:
    # Keep real environment variables (Render/CI) authoritative over local .env.
    load_dotenv(override=False)

    app = Flask(__name__)
    app.config["JSON_SORT_KEYS"] = False
    app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_CONTENT_LENGTH_BYTES", str(5 * 1024 * 1024)))

    app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/care_my_pet")
    app.config["JWT_SECRET"] = _get_jwt_secret()

    # Gzip compress JSON/text responses ≥ 500 bytes automatically
    app.config["COMPRESS_REGISTER"] = True
    app.config["COMPRESS_LEVEL"] = int(os.getenv("COMPRESS_LEVEL", "6"))
    app.config["COMPRESS_MIN_SIZE"] = int(os.getenv("COMPRESS_MIN_SIZE", "500"))
    Compress(app)

    CORS(
    app,
    origins=_get_allowed_origins(),
    supports_credentials=False,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    )
    
    
    init_db(app)
    init_jwt(app)
    init_cache(app)
    init_security(app)
    init_rate_limiter(app)
    if not app.config.get("TESTING"):
        init_scheduler(app)

    # Seed initial data (vets + products/medicines) once.
    with app.app_context():
        seed_vets_if_empty()
        seed_products_if_empty()
        auth_service.ensure_bootstrap_admin_account()

    register_error_handlers(app)

    register_auth_routes(app)
    register_user_routes(app)
    register_pet_routes(app)
    register_product_routes(app)
    register_cart_routes(app)
    register_order_routes(app)
    register_vet_routes(app)
    register_appointment_routes(app)
    register_vaccination_routes(app)
    register_medicine_routes(app)
    register_upload_routes(app)
    register_chatbot_routes(app)
    register_learning_routes(app)
    register_admin_routes(app)
    register_contact_routes(app)

    @app.get("/health")
    def health():
        return {"status": "ok"}, 200

    return app

app = create_app()
