from __future__ import annotations

from typing import Any

from src.config.jwt_config import generate_jwt
from src.utils.password import hash_password


def _register_and_login(client, test_db, *, name: str, email: str, password: str) -> dict[str, Any]:
    send_otp_response = client.post("/api/auth/send-otp", json={"email": email})
    assert send_otp_response.status_code == 200

    otp_record = test_db.otp_verifications.find_one({"email": email.lower()})
    assert otp_record is not None

    verify_otp_response = client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp": otp_record["otp"]},
    )
    assert verify_otp_response.status_code == 200
    otp_token = verify_otp_response.get_json()["data"]["otpToken"]

    register_response = client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": password, "otpToken": otp_token},
    )
    assert register_response.status_code == 201

    send_login_otp_response = client.post("/api/auth/send-login-otp", json={"email": email})
    assert send_login_otp_response.status_code == 200

    login_otp_record = test_db.otp_verifications.find_one({"email": email.lower()})
    assert login_otp_record is not None

    verify_login_otp_response = client.post(
        "/api/auth/verify-login-otp",
        json={"email": email, "otp": login_otp_record["otp"]},
    )
    assert verify_login_otp_response.status_code == 200
    login_otp_token = verify_login_otp_response.get_json()["data"]["otpToken"]

    login_response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password, "otpToken": login_otp_token},
    )
    assert login_response.status_code == 200
    payload = login_response.get_json()["data"]
    return {"token": payload["token"], "user": payload["user"]}


def _create_user_with_token(app, test_db, *, name: str, email: str, role: str = "user") -> dict[str, str]:
    user_id = test_db.users.insert_one(
        {
            "name": name,
            "email": email.lower(),
            "password": hash_password("StrongPassword123"),
            "role": role,
            "fcmToken": None,
        }
    ).inserted_id
    with app.app_context():
        token = generate_jwt({"sub": str(user_id)})
    return {"id": str(user_id), "token": token}


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_auth_registration_login_and_profile_flow(client, test_db):
    result = _register_and_login(
        client,
        test_db,
        name="Alice",
        email="alice@example.com",
        password="StrongPassword123",
    )

    profile_response = client.get("/api/auth/profile", headers=_auth_headers(result["token"]))
    assert profile_response.status_code == 200
    profile_payload = profile_response.get_json()["data"]
    assert profile_payload["email"] == "alice@example.com"
    assert profile_payload["name"] == "Alice"
    assert profile_payload["role"] == "user"
    assert profile_payload["subscription"]["plan"] == "free"
    assert profile_payload["subscription"]["isPremium"] is False


def test_admin_email_is_recognized_and_admin_login_requires_admin_role(client, test_db):
    admin_result = _register_and_login(
        client,
        test_db,
        name="Admin User",
        email="admin@example.com",
        password="StrongPassword123",
    )
    assert admin_result["user"]["role"] == "admin"

    admin_login_otp_record = test_db.otp_verifications.find_one({"email": "admin@example.com"})
    assert admin_login_otp_record is None

    send_login_otp_response = client.post("/api/auth/send-login-otp", json={"email": "admin@example.com"})
    assert send_login_otp_response.status_code == 200
    login_otp_record = test_db.otp_verifications.find_one({"email": "admin@example.com"})
    assert login_otp_record is not None

    verify_login_otp_response = client.post(
        "/api/auth/verify-login-otp",
        json={"email": "admin@example.com", "otp": login_otp_record["otp"]},
    )
    assert verify_login_otp_response.status_code == 200
    admin_otp_token = verify_login_otp_response.get_json()["data"]["otpToken"]

    admin_login_response = client.post(
        "/api/auth/admin/login",
        json={
            "email": "admin@example.com",
            "password": "StrongPassword123",
            "otpToken": admin_otp_token,
        },
    )
    assert admin_login_response.status_code == 200
    assert admin_login_response.get_json()["data"]["user"]["role"] == "admin"

    regular_user = _register_and_login(
        client,
        test_db,
        name="Regular User",
        email="regular@example.com",
        password="StrongPassword123",
    )
    send_regular_login_otp_response = client.post("/api/auth/send-login-otp", json={"email": "regular@example.com"})
    assert send_regular_login_otp_response.status_code == 200
    regular_login_otp_record = test_db.otp_verifications.find_one({"email": "regular@example.com"})
    verify_regular_login_otp_response = client.post(
        "/api/auth/verify-login-otp",
        json={"email": "regular@example.com", "otp": regular_login_otp_record["otp"]},
    )
    regular_otp_token = verify_regular_login_otp_response.get_json()["data"]["otpToken"]

    regular_admin_login_response = client.post(
        "/api/auth/admin/login",
        json={
            "email": regular_user["user"]["email"],
            "password": "StrongPassword123",
            "otpToken": regular_otp_token,
        },
    )
    assert regular_admin_login_response.status_code == 403


def test_login_returns_invalid_password_message_for_wrong_password(client, test_db):
    email = "alice@example.com"
    password = "StrongPassword123"
    _register_and_login(
        client,
        test_db,
        name="Alice",
        email=email,
        password=password,
    )

    send_login_otp_response = client.post("/api/auth/send-login-otp", json={"email": email})
    assert send_login_otp_response.status_code == 200

    login_otp_record = test_db.otp_verifications.find_one({"email": email})
    assert login_otp_record is not None

    verify_login_otp_response = client.post(
        "/api/auth/verify-login-otp",
        json={"email": email, "otp": login_otp_record["otp"]},
    )
    assert verify_login_otp_response.status_code == 200
    login_otp_token = verify_login_otp_response.get_json()["data"]["otpToken"]

    login_response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "WrongPassword123", "otpToken": login_otp_token},
    )
    assert login_response.status_code == 401
    assert login_response.get_json()["message"] == "Invalid password"


def test_send_login_otp_returns_missing_email_message(client):
    response = client.post("/api/auth/send-login-otp", json={"email": "missing@example.com"})
    assert response.status_code == 404
    assert response.get_json()["message"] == "No account found with this email"


def test_cart_requires_authentication(client):
    response = client.get("/api/cart")
    assert response.status_code == 401


def test_order_access_is_scoped_to_current_user(app, client, test_db):
    user_one = _create_user_with_token(app, test_db, name="User One", email="user1@example.com")
    user_two = _create_user_with_token(app, test_db, name="User Two", email="user2@example.com")

    product_id = test_db.products.insert_one(
        {
            "name": "Premium Food",
            "description": "Nutritional food",
            "category": "Food",
            "petType": "Dog",
            "price": 499.0,
            "stock": 25,
        }
    ).inserted_id

    add_cart_response = client.post(
        "/api/cart/add",
        json={"productId": str(product_id), "quantity": 2},
        headers=_auth_headers(user_one["token"]),
    )
    assert add_cart_response.status_code == 200

    create_order_response = client.post(
        "/api/orders",
        json={
            "address": {
                "fullName": "User One",
                "line1": "123 Main Street",
                "city": "Kolkata",
                "state": "WB",
                "zip": "700001",
            }
        },
        headers=_auth_headers(user_one["token"]),
    )
    assert create_order_response.status_code == 201
    order_id = create_order_response.get_json()["data"]["id"]

    own_order_response = client.get(f"/api/orders/{order_id}", headers=_auth_headers(user_one["token"]))
    assert own_order_response.status_code == 200

    other_user_response = client.get(f"/api/orders/{order_id}", headers=_auth_headers(user_two["token"]))
    assert other_user_response.status_code == 404


def test_place_order_sends_receipt_to_user_email(app, client, test_db, monkeypatch):
    sent_emails: list[dict[str, Any]] = []

    def _capture_send_email(subject: str, body: str, recipients: list[str]) -> bool:
      sent_emails.append({"subject": subject, "body": body, "recipients": recipients})
      return True

    monkeypatch.setattr("src.services.order_service.send_email", _capture_send_email)

    user = _create_user_with_token(app, test_db, name="Receipt User", email="receipt@example.com")

    product_id = test_db.products.insert_one(
        {
            "name": "Dental Treat",
            "description": "Healthy teeth snack",
            "category": "Food",
            "petType": "Dog",
            "price": 199.0,
            "stock": 10,
        }
    ).inserted_id

    add_cart_response = client.post(
        "/api/cart/add",
        json={"productId": str(product_id), "quantity": 1},
        headers=_auth_headers(user["token"]),
    )
    assert add_cart_response.status_code == 200

    create_order_response = client.post(
        "/api/orders",
        json={
            "address": {
                "fullName": "Receipt User",
                "line1": "45 Park Street",
                "city": "Kolkata",
                "state": "WB",
                "zip": "700016",
            }
        },
        headers=_auth_headers(user["token"]),
    )
    assert create_order_response.status_code == 201

    assert len(sent_emails) == 1
    assert "receipt@example.com" in sent_emails[0]["recipients"]


def test_vaccination_actions_enforce_pet_ownership(app, client, test_db):
    owner = _create_user_with_token(app, test_db, name="Owner", email="owner@example.com")
    stranger = _create_user_with_token(app, test_db, name="Stranger", email="stranger@example.com")

    create_pet_response = client.post(
        "/api/pets",
        json={"name": "Milo", "type": "Dog", "ageYears": 3, "breed": "Beagle"},
        headers=_auth_headers(owner["token"]),
    )
    assert create_pet_response.status_code == 201
    pet_id = create_pet_response.get_json()["data"]["id"]

    forbidden_create_response = client.post(
        "/api/vaccinations",
        json={"petId": pet_id, "vaccineName": "Rabies", "dueDateIso": "2026-04-10"},
        headers=_auth_headers(stranger["token"]),
    )
    assert forbidden_create_response.status_code == 404

    owner_create_response = client.post(
        "/api/vaccinations",
        json={"petId": pet_id, "vaccineName": "Rabies", "dueDateIso": "2026-04-10"},
        headers=_auth_headers(owner["token"]),
    )
    assert owner_create_response.status_code == 201
    vaccination_id = owner_create_response.get_json()["data"]["id"]

    stranger_list_response = client.get(
        f"/api/vaccinations/pet/{pet_id}",
        headers=_auth_headers(stranger["token"]),
    )
    assert stranger_list_response.status_code == 200
    assert stranger_list_response.get_json()["data"] == []

    stranger_complete_response = client.put(
        f"/api/vaccinations/{vaccination_id}/complete",
        headers=_auth_headers(stranger["token"]),
    )
    assert stranger_complete_response.status_code == 404

    owner_complete_response = client.put(
        f"/api/vaccinations/{vaccination_id}/complete",
        headers=_auth_headers(owner["token"]),
    )
    assert owner_complete_response.status_code == 200
    assert owner_complete_response.get_json()["data"]["status"] == "Done"


def test_admin_can_grant_premium_membership_and_user_can_read_subscription(app, client, test_db):
    admin = _create_user_with_token(app, test_db, name="Admin", email="admin@example.com", role="admin")
    user = _create_user_with_token(app, test_db, name="Premium Candidate", email="premium@example.com")

    grant_response = client.put(
        f"/api/admin/users/{user['id']}/premium",
        json={
            "enabled": True,
            "plan": "premium",
            "features": ["priority_booking", "ai_consult"],
            "expiresOn": "2026-12-31",
        },
        headers=_auth_headers(admin["token"]),
    )
    assert grant_response.status_code == 200
    granted_user = grant_response.get_json()["data"]
    assert granted_user["subscription"]["isPremium"] is True
    assert "priority_booking" in granted_user["subscription"]["premiumFeatures"]

    subscription_response = client.get("/api/users/me/subscription", headers=_auth_headers(user["token"]))
    assert subscription_response.status_code == 200
    subscription = subscription_response.get_json()["data"]
    assert subscription["plan"] == "premium"
    assert subscription["isPremium"] is True
    assert subscription["premiumExpiresOn"] == "2026-12-31"

    non_admin_grant_response = client.put(
        f"/api/admin/users/{admin['id']}/premium",
        json={"enabled": True, "plan": "premium", "features": []},
        headers=_auth_headers(user["token"]),
    )
    assert non_admin_grant_response.status_code == 403