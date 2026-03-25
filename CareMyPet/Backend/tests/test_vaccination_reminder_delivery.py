from __future__ import annotations

from datetime import date

from bson import ObjectId

from src.services import notification_service


class _Collection:
    def __init__(self, docs: dict[str, dict]):
        self.docs = docs

    def find_one(self, query: dict):
        raw_id = query.get("_id")
        key = str(raw_id)
        return self.docs.get(key)

    def update_one(self, query: dict, update: dict):
        raw_id = query.get("_id")
        key = str(raw_id)
        doc = self.docs.get(key)
        if not doc:
            return
        doc.update(update.get("$set", {}))


class _FakeDB:
    def __init__(self, pets: dict[str, dict], users: dict[str, dict], vaccinations: dict[str, dict]):
        self.pets = _Collection(pets)
        self.users = _Collection(users)
        self.vaccinations = _Collection(vaccinations)


class _FakeMongo:
    def __init__(self, db: _FakeDB):
        self.db = db


def test_day_before_and_due_today_send_exactly_once_with_dedupe(monkeypatch):
    user_id = str(ObjectId())
    pet_id = str(ObjectId())
    vaccination_id = str(ObjectId())

    today = date(2026, 3, 16)

    users = {
        user_id: {
            "_id": ObjectId(user_id),
            "name": "Reminder User",
            "email": "reminder@example.com",
            "fcmToken": None,
        }
    }

    pets = {
        pet_id: {
            "_id": ObjectId(pet_id),
            "ownerId": user_id,
            "name": "Milo",
        }
    }

    vaccinations = {
        vaccination_id: {
            "_id": ObjectId(vaccination_id),
            "id": vaccination_id,
            "petId": pet_id,
            "vaccineName": "Rabies",
            "dueDateIso": "2026-03-17",
            "status": "Pending",
        }
    }

    sent_subjects: list[str] = []

    def _fake_send_email(subject, body, recipients):
        sent_subjects.append(subject)
        return True

    monkeypatch.setattr(notification_service, "mongo", _FakeMongo(_FakeDB(pets, users, vaccinations)))
    monkeypatch.setattr(notification_service, "send_email", _fake_send_email)
    monkeypatch.setattr(notification_service, "send_fcm_notification", lambda *args, **kwargs: None)

    base_payload = {
        "id": vaccination_id,
        "petId": pet_id,
        "vaccineName": "Rabies",
        "dueDateIso": "2026-03-17",
    }

    # First day-before pass should send exactly once and mark the day-before field.
    notification_service.send_vaccination_reminders(
        [dict(base_payload)],
        reminder_sent_on=today,
        reminder_type="day_before",
    )

    # Re-running day-before on same date should be deduped (no second email).
    notification_service.send_vaccination_reminders(
        [dict(base_payload, oneDayReminderSentOn=today.isoformat())],
        reminder_sent_on=today,
        reminder_type="day_before",
    )

    # Due-today pass should send exactly once and mark the due-today field.
    notification_service.send_vaccination_reminders(
        [dict(base_payload)],
        reminder_sent_on=today,
        reminder_type="due_today",
    )

    # Re-running due-today on same date should be deduped (no second email).
    notification_service.send_vaccination_reminders(
        [dict(base_payload, dueTodayReminderSentOn=today.isoformat())],
        reminder_sent_on=today,
        reminder_type="due_today",
    )

    assert sum("is tomorrow" in s for s in sent_subjects) == 1
    assert sum("Today is vaccination day" in s for s in sent_subjects) == 1

    saved_vaccination = vaccinations[vaccination_id]
    assert saved_vaccination.get("oneDayReminderSentOn") == today.isoformat()
    assert saved_vaccination.get("dueTodayReminderSentOn") == today.isoformat()
