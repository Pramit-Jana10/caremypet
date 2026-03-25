import os

from flask import Flask
from flask_pymongo import PyMongo
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import OperationFailure

mongo = PyMongo()


def _ensure_otp_ttl_index(expire_after_seconds: int = 600) -> None:
    """Ensure OTP TTL index matches expected expiration, replacing conflicting index if needed."""
    collection = mongo.db.otp_verifications
    try:
        collection.create_index(
            [("createdAt", ASCENDING)],
            name="createdAt_1",
            expireAfterSeconds=expire_after_seconds,
        )
    except OperationFailure as exc:
        # MongoDB rejects create_index if same name/key exists with different options.
        if getattr(exc, "code", None) != 85:
            raise
        collection.drop_index("createdAt_1")
        collection.create_index(
            [("createdAt", ASCENDING)],
            name="createdAt_1",
            expireAfterSeconds=expire_after_seconds,
        )


def _build_uri(base_uri: str) -> str:
    """Inject connection-pool and timeout parameters into the MongoDB URI if absent."""
    pool_size = int(os.getenv("MONGO_MAX_POOL_SIZE", "50"))
    connect_timeout = int(os.getenv("MONGO_CONNECT_TIMEOUT_MS", "5000"))
    server_sel_timeout = int(os.getenv("MONGO_SERVER_SEL_TIMEOUT_MS", "5000"))
    socket_timeout = int(os.getenv("MONGO_SOCKET_TIMEOUT_MS", "10000"))
    sep = "&" if "?" in base_uri else "?"
    params = (
        f"maxPoolSize={pool_size}"
        f"&connectTimeoutMS={connect_timeout}"
        f"&serverSelectionTimeoutMS={server_sel_timeout}"
        f"&socketTimeoutMS={socket_timeout}"
    )
    return f"{base_uri}{sep}{params}"


def init_db(app: Flask) -> None:
    if "maxPoolSize" not in app.config.get("MONGO_URI", ""):
        app.config["MONGO_URI"] = _build_uri(app.config["MONGO_URI"])
    mongo.init_app(app)
    with app.app_context():
        if mongo.db is None:
            raise RuntimeError(
                "MongoDB database name is missing in MONGO_URI. "
                "Use a URI like 'mongodb+srv://<user>:<pass>@<host>/<database>?<options>'."
            )

        # ── Users ───────────────────────────────────────────────────────────
        mongo.db.users.create_index([("email", ASCENDING)], unique=True)

        # ── Carts ───────────────────────────────────────────────────────────
        mongo.db.carts.create_index([("userId", ASCENDING)], unique=True)

        # ── Orders ──────────────────────────────────────────────────────────
        mongo.db.orders.create_index([("userId", ASCENDING), ("createdAt", DESCENDING)])

        # ── Pets ────────────────────────────────────────────────────────────
        mongo.db.pets.create_index([("ownerId", ASCENDING)])

        # ── Vaccinations ────────────────────────────────────────────────────
        mongo.db.vaccinations.create_index([("petId", ASCENDING), ("status", ASCENDING)])
        # Scheduler job queries vaccinations by due date + pending status
        mongo.db.vaccinations.create_index([("dueDateIso", ASCENDING), ("status", ASCENDING)])

        # ── OTP ─────────────────────────────────────────────────────────────
        mongo.db.otp_verifications.create_index([("email", ASCENDING)])
        # TTL: auto-delete OTP records after 10 minutes
        _ensure_otp_ttl_index(expire_after_seconds=600)

        # ── Products (most-hit read endpoint) ────────────────────────────────
        mongo.db.products.create_index([("category", ASCENDING), ("petType", ASCENDING)])
        mongo.db.products.create_index([("name", ASCENDING)])

        # ── Vets ────────────────────────────────────────────────────────────
        mongo.db.vets.create_index([("specialization", ASCENDING)])
        mongo.db.vets.create_index([("name", ASCENDING)])
        mongo.db.vets.create_index([("location", ASCENDING)])

        # ── Appointments ────────────────────────────────────────────────────
        mongo.db.appointments.create_index([("userId", ASCENDING), ("date", ASCENDING)])
        mongo.db.appointments.create_index([("vetId", ASCENDING), ("date", ASCENDING)])

        # ── Medicines ───────────────────────────────────────────────────────
        mongo.db.medicines.create_index([("petType", ASCENDING), ("category", ASCENDING)])

