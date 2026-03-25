from datetime import date, datetime, timedelta
from typing import List

from bson import ObjectId

from ..config.db import mongo
from ..models import to_str_id
from ..utils.security import bounded_int, get_object_id, parse_iso_date, required_string


def list_pets(owner_id: str) -> List[dict]:
  docs = mongo.db.pets.find({"ownerId": owner_id})
  return [to_str_id(d) for d in docs]


def create_pet(owner_id: str, payload: dict) -> dict:
  name = required_string(payload.get("name"), "Pet name", max_length=80)
  pet_type = required_string(payload.get("type"), "Pet type", max_length=40)
  breed = required_string(payload.get("breed"), "Breed", max_length=80)
  age_years = bounded_int(payload.get("ageYears", 0), "Age", minimum=0, maximum=80)
  doc = {
    "ownerId": owner_id,
    "name": name,
    "type": pet_type,
    "ageYears": age_years,
    "breed": breed,
  }
  res = mongo.db.pets.insert_one(doc)
  return to_str_id(mongo.db.pets.find_one({"_id": res.inserted_id}))


def update_pet(owner_id: str, pet_id: str, payload: dict) -> dict | None:
  pet_object_id = get_object_id(pet_id, "petId")
  existing = mongo.db.pets.find_one({"_id": pet_object_id, "ownerId": owner_id})
  if not existing:
    return None

  updates = {}
  if "name" in payload:
    updates["name"] = required_string(payload.get("name"), "Pet name", max_length=80)
  if "type" in payload:
    updates["type"] = required_string(payload.get("type"), "Pet type", max_length=40)
  if "breed" in payload:
    updates["breed"] = required_string(payload.get("breed"), "Breed", max_length=80)
  if "ageYears" in payload:
    updates["ageYears"] = bounded_int(payload.get("ageYears"), "Age", minimum=0, maximum=80)

  if not updates:
    raise ValueError("At least one valid pet field is required")

  mongo.db.pets.update_one({"_id": pet_object_id}, {"$set": updates})
  return to_str_id(mongo.db.pets.find_one({"_id": pet_object_id}))


def delete_pet(owner_id: str, pet_id: str) -> bool:
  pet_object_id = get_object_id(pet_id, "petId")
  existing = mongo.db.pets.find_one({"_id": pet_object_id, "ownerId": owner_id})
  if not existing:
    return False

  mongo.db.vaccinations.delete_many({"petId": pet_id})
  mongo.db.pets.delete_one({"_id": pet_object_id})
  return True


def _get_pet_for_owner(owner_id: str, pet_id: str) -> dict | None:
  pet_object_id = get_object_id(pet_id, "petId")
  return mongo.db.pets.find_one({"_id": pet_object_id, "ownerId": owner_id})


def list_schedule_for_pet(owner_id: str, pet_id: str) -> List[dict]:
  if not _get_pet_for_owner(owner_id, pet_id):
    return []
  docs = mongo.db.vaccinations.find({"petId": pet_id})
  return [to_str_id(d) for d in docs]


def add_schedule_item(owner_id: str, pet_id: str, vaccine_name: str, due_date_iso: str) -> dict:
  if not _get_pet_for_owner(owner_id, pet_id):
    raise ValueError("Pet not found")

  due_date = parse_iso_date(due_date_iso, "dueDateIso")
  doc = {
    "petId": pet_id,
    "vaccineName": required_string(vaccine_name, "vaccineName", max_length=120),
    "dueDateIso": due_date.isoformat(),
    "status": "Pending",
  }
  res = mongo.db.vaccinations.insert_one(doc)
  return to_str_id(mongo.db.vaccinations.find_one({"_id": res.inserted_id}))


def mark_vaccine_complete(owner_id: str, vaccine_id: str) -> dict | None:
  _id = get_object_id(vaccine_id, "vaccination id")
  vaccination = mongo.db.vaccinations.find_one({"_id": _id})
  if not vaccination:
    return None
  if not _get_pet_for_owner(owner_id, vaccination.get("petId")):
    return None
  mongo.db.vaccinations.update_one({"_id": _id}, {"$set": {"status": "Done"}})
  doc = mongo.db.vaccinations.find_one({"_id": _id})
  return to_str_id(doc) if doc else None


def update_vaccine(owner_id: str, vaccine_id: str, payload: dict) -> dict | None:
  _id = get_object_id(vaccine_id, "vaccination id")
  vaccination = mongo.db.vaccinations.find_one({"_id": _id})
  if not vaccination:
    return None
  if not _get_pet_for_owner(owner_id, vaccination.get("petId")):
    return None

  updates = {}
  if "vaccineName" in payload:
    updates["vaccineName"] = required_string(payload.get("vaccineName"), "vaccineName", max_length=120)
  if "dueDateIso" in payload:
    due_date = parse_iso_date(payload.get("dueDateIso"), "dueDateIso")
    updates["dueDateIso"] = due_date.isoformat()
  if "status" in payload:
    status = required_string(payload.get("status"), "status", max_length=16)
    if status not in {"Pending", "Done"}:
      raise ValueError("status must be Pending or Done")
    updates["status"] = status

  if not updates:
    raise ValueError("At least one valid vaccination field is required")

  mongo.db.vaccinations.update_one({"_id": _id}, {"$set": updates})
  doc = mongo.db.vaccinations.find_one({"_id": _id})
  return to_str_id(doc) if doc else None


def delete_vaccine(owner_id: str, vaccine_id: str) -> bool:
  _id = get_object_id(vaccine_id, "vaccination id")
  vaccination = mongo.db.vaccinations.find_one({"_id": _id})
  if not vaccination:
    return False
  if not _get_pet_for_owner(owner_id, vaccination.get("petId")):
    return False

  mongo.db.vaccinations.delete_one({"_id": _id})
  return True


def get_vaccinations_due_within_days(days: int, from_date: date) -> List[dict]:
  end = from_date + timedelta(days=days)
  docs = mongo.db.vaccinations.find(
    {
      "status": "Pending",
      "dueDateIso": {
        "$gte": from_date.isoformat(),
        "$lte": end.isoformat(),
      },
    }
  )
  return [to_str_id(d) for d in docs]


def get_vaccinations_due_on_date(target_date: date) -> List[dict]:
  docs = mongo.db.vaccinations.find(
    {
      "status": "Pending",
      "dueDateIso": target_date.isoformat(),
    }
  )
  return [to_str_id(d) for d in docs]

