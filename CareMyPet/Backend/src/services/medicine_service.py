from typing import Any, Dict, List, Optional

from ..config.db import mongo
from ..models import to_str_id
from ..utils.security import bounded_float, get_object_id, optional_string, required_string, safe_contains_regex


def list_medicines(filters: Dict[str, Any] | None = None) -> List[dict]:
  query: Dict[str, Any] = {}
  if filters:
    if q := safe_contains_regex(filters.get("q"), "Medicine search"):
      query["name"] = q
    if pet_type := filters.get("petType"):
      query["petType"] = pet_type
  docs = mongo.db.medicines.find(query)
  return [to_str_id(d) for d in docs]


def get_medicine(medicine_id: str) -> Optional[dict]:
  doc = mongo.db.medicines.find_one({"_id": get_object_id(medicine_id, "medicine id")})
  return to_str_id(doc) if doc else None


def create_medicine(payload: Dict[str, Any]) -> dict:
  clean_payload = {
    "name": required_string(payload.get("name"), "Medicine name", max_length=120),
    "petType": required_string(payload.get("petType"), "Medicine petType", max_length=40),
    "description": required_string(payload.get("description"), "Medicine description", max_length=2000),
    "price": bounded_float(payload.get("price", 0), "Medicine price", minimum=0, maximum=1000000),
  }
  image_url = optional_string(payload.get("imageUrl"), "Medicine imageUrl", max_length=1024)
  if image_url:
    clean_payload["imageUrl"] = image_url
  res = mongo.db.medicines.insert_one(clean_payload)
  return to_str_id(mongo.db.medicines.find_one({"_id": res.inserted_id}))

