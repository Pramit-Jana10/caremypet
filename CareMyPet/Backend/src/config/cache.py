import os

from flask import Flask
from flask_caching import Cache

# Module-level cache instance shared across the application.
# SimpleCache is thread-safe and zero-dependency (no Redis required).
# Switch CACHE_TYPE to "RedisCache" + set CACHE_REDIS_URL for multi-process deploys.
cache = Cache()


def init_cache(app: Flask) -> None:
    app.config.setdefault("CACHE_TYPE", os.getenv("CACHE_TYPE", "SimpleCache"))
    app.config.setdefault(
        "CACHE_DEFAULT_TIMEOUT", int(os.getenv("CACHE_DEFAULT_TIMEOUT", "60"))
    )
    # For SimpleCache, limit the number of items stored to avoid unbounded memory
    app.config.setdefault(
        "CACHE_THRESHOLD", int(os.getenv("CACHE_THRESHOLD", "1000"))
    )
    cache.init_app(app)
