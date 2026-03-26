from datetime import date
from typing import List

from bson import ObjectId
from bson.errors import InvalidId

from ..config.mail import send_email
from ..config.firebase_config import send_fcm_notification
from ..config.db import mongo


def _as_object_id(value) -> ObjectId | None:
  if isinstance(value, ObjectId):
    return value
  if not isinstance(value, str):
    return None
  value = value.strip()
  if not value:
    return None
  try:
    return ObjectId(value)
  except (InvalidId, TypeError):
    return None


def _find_by_id(collection, value):
  object_id = _as_object_id(value)
  if object_id is not None:
    found = collection.find_one({"_id": object_id})
    if found:
      return found
  if isinstance(value, str) and value.strip():
    return collection.find_one({"_id": value.strip()})
  return None


def send_vaccination_reminders(
  vaccinations: List[dict],
  *,
  reminder_sent_on: date | None = None,
  reminder_type: str = "day_before",
) -> None:
  if reminder_type not in {"day_before", "due_today"}:
    raise ValueError("Invalid reminder_type")

  marker_field = "oneDayReminderSentOn" if reminder_type == "day_before" else "dueTodayReminderSentOn"
  reminder_date_iso = reminder_sent_on.isoformat() if reminder_sent_on else None

  for v in vaccinations:
    pet = _find_by_id(mongo.db.pets, v.get("petId"))
    if not pet:
      continue

    owner_id = pet.get("ownerId")
    if not owner_id:
      continue

    owner = _find_by_id(mongo.db.users, owner_id)
    if not owner:
      continue

    if reminder_date_iso and v.get(marker_field) == reminder_date_iso:
      continue

    email = owner.get("email")
    fcm_token = owner.get("fcmToken")
    pet_name = pet.get("name", "your pet")
    vaccine_name = v.get("vaccineName", "a vaccine")
    due = v.get("dueDateIso")

    if reminder_type == "day_before":
      subject = f"Reminder: {pet_name}'s vaccine is tomorrow"
      body = (
        f"<p>Hi {owner.get('name', '')},</p>"
        f"<p>This is a friendly reminder that <strong>{vaccine_name}</strong> for <strong>{pet_name}</strong> "
        f"is scheduled for <strong>{due}</strong>.</p>"
        "<p>Please plan your visit so your pet stays protected.</p>"
      )
      push_body = f"{vaccine_name} for {pet_name} is due tomorrow ({due})"
    else:
      subject = f"Today is vaccination day for {pet_name}"
      body = (
        f"<p>Hi {owner.get('name', '')},</p>"
        f"<p><strong>{vaccine_name}</strong> for <strong>{pet_name}</strong> is due <strong>today ({due})</strong>.</p>"
        "<p>If it is not done yet, please complete it today.</p>"
      )
      push_body = f"{vaccine_name} for {pet_name} is due today ({due})"

    email_delivered = False
    push_delivered = False

    if email:
      sent = send_email(email, subject, body)
      if sent:
        email_delivered = True
        print(
          f"[REMINDER] Vaccination reminder email sent ({reminder_type}) "
          f"for vaccination={v['id']} to {email}"
        )
      else:
        print(
          f"[REMINDER] Vaccination reminder email failed ({reminder_type}) "
          f"for vaccination={v['id']} to {email}"
        )

    if fcm_token:
      try:
        send_fcm_notification(
          fcm_token,
          title="Vaccine reminder",
          body=push_body,
        )
        push_delivered = True
      except Exception as exc:  # pragma: no cover
        print(
          f"[REMINDER] Vaccination push failed ({reminder_type}) "
          f"for vaccination={v['id']}: {exc}"
        )

    should_mark_sent = email_delivered or push_delivered
    if reminder_date_iso and should_mark_sent:
      vaccination_id = _as_object_id(v.get("id"))
      if vaccination_id is None:
        continue
      mongo.db.vaccinations.update_one(
        {"_id": vaccination_id},
        {"$set": {marker_field: reminder_date_iso}},
      )


