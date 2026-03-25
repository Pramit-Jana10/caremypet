from __future__ import annotations

from types import SimpleNamespace

import mongomock
import pytest

from src.app import create_app
from src.config import db as config_db
from src.controllers import user_controller
from src.models import user as user_model
from src.services import auth_service, cart_service, order_service, otp_service, product_service, vaccination_service, vet_service
from src.utils import decorators


@pytest.fixture
def app(monkeypatch):
    database = mongomock.MongoClient().get_database("caremypet_test")
    fake_mongo = SimpleNamespace(db=database)

    for module in (
        config_db,
        user_model,
        auth_service,
        otp_service,
        decorators,
        cart_service,
        order_service,
        product_service,
        vaccination_service,
        vet_service,
        user_controller,
    ):
        monkeypatch.setattr(module, "mongo", fake_mongo)

    monkeypatch.setattr("src.app.init_db", lambda app: None)
    monkeypatch.setattr("src.app.init_scheduler", lambda app: None)
    monkeypatch.setattr("src.app.seed_vets_if_empty", lambda: None)
    monkeypatch.setattr("src.app.seed_products_if_empty", lambda: None)
    monkeypatch.setattr("src.services.otp_service.send_email", lambda *args, **kwargs: None)
    monkeypatch.setattr("src.services.order_service.send_email", lambda *args, **kwargs: None)

    monkeypatch.setenv("JWT_SECRET", "57e0bbf9fc7a6b45ee1414ff350108b7")
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,capacitor://localhost")
    monkeypatch.setenv("ADMIN_EMAILS", "admin@example.com,caremypetofficial@gmail.com")

    flask_app = create_app()
    flask_app.config.update(TESTING=True)
    flask_app.extensions["test_db"] = database
    return flask_app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def test_db(app):
    return app.extensions["test_db"]