from typing import Any, Dict, List, Optional

from ..config.db import mongo
from ..config.cache import cache
from ..models import to_str_id
from ..utils.security import get_object_id, optional_string, required_string, safe_contains_regex

_VETS_CACHE_TIMEOUT = 120  # seconds; vet data changes infrequently


def _vets_cache_key(filters: Dict[str, Any] | None) -> str:
  return "vets:" + str(sorted((filters or {}).items()))


def list_vets(filters: Dict[str, Any] | None = None) -> List[dict]:
  key = _vets_cache_key(filters)
  cached = cache.get(key)
  if cached is not None:
    return cached

  query: Dict[str, Any] = {}
  if filters:
    if q := safe_contains_regex(filters.get("q"), "Vet search"):
      query["name"] = q
    if loc := safe_contains_regex(filters.get("location"), "Vet location"):
      query["location"] = loc
    if spec := filters.get("specialization"):
      query["specialization"] = spec
  result = [to_str_id(d) for d in mongo.db.vets.find(query)]
  cache.set(key, result, timeout=_VETS_CACHE_TIMEOUT)
  return result


def get_vet(vet_id: str) -> Optional[dict]:
  doc = mongo.db.vets.find_one({"_id": get_object_id(vet_id, "vet id")})
  return to_str_id(doc) if doc else None


def create_vet(payload: Dict[str, Any]) -> dict:
  clean_payload = {
    "name": required_string(payload.get("name"), "Vet name", max_length=120),
    "location": required_string(payload.get("location"), "Vet location", max_length=120),
    "specialization": required_string(payload.get("specialization"), "Vet specialization", max_length=120),
  }
  bio = optional_string(payload.get("bio"), "Vet bio", max_length=2000)
  if bio:
    clean_payload["bio"] = bio
  res = mongo.db.vets.insert_one(clean_payload)
  cache.clear()
  return to_str_id(mongo.db.vets.find_one({"_id": res.inserted_id}))

