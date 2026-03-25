from typing import Any, Dict, List, Optional

from ..config.db import mongo
from ..config.cache import cache
from ..models import to_str_id
from ..utils.security import bounded_float, bounded_int, get_object_id, optional_string, required_string, safe_contains_regex

_PRODUCTS_CACHE_TIMEOUT = 60  # seconds


def _products_cache_key(filters: Dict[str, Any] | None) -> str:
  return "products:" + str(sorted((filters or {}).items()))


def list_products(filters: Dict[str, Any] | None = None) -> List[dict]:
  key = _products_cache_key(filters)
  cached = cache.get(key)
  if cached is not None:
    return cached

  query: Dict[str, Any] = {}
  if filters:
    if q := safe_contains_regex(filters.get("q"), "Product search"):
      query["name"] = q
    if cat := filters.get("category"):
      query["category"] = cat
    if pet_type := filters.get("petType"):
      query["petType"] = pet_type
  result = [to_str_id(d) for d in mongo.db.products.find(query)]
  cache.set(key, result, timeout=_PRODUCTS_CACHE_TIMEOUT)
  return result


def get_product(product_id: str) -> Optional[dict]:
  doc = mongo.db.products.find_one({"_id": get_object_id(product_id, "product id")})
  return to_str_id(doc) if doc else None


def _validate_product_payload(payload: Dict[str, Any], *, partial: bool = False) -> Dict[str, Any]:
  allowed: Dict[str, Any] = {}

  if not partial or "name" in payload:
    allowed["name"] = required_string(payload.get("name"), "Product name", max_length=120)
  if not partial or "description" in payload:
    allowed["description"] = required_string(payload.get("description"), "Product description", max_length=2000)
  if not partial or "category" in payload:
    allowed["category"] = required_string(payload.get("category"), "Product category", max_length=80)
  if not partial or "petType" in payload:
    allowed["petType"] = required_string(payload.get("petType"), "Product petType", max_length=40)
  if not partial or "price" in payload:
    allowed["price"] = bounded_float(payload.get("price"), "Product price", minimum=0, maximum=1000000)

  if "stock" in payload:
    allowed["stock"] = bounded_int(payload.get("stock"), "Product stock", minimum=0, maximum=100000)
  elif not partial:
    allowed["stock"] = 0

  for field, max_length in (("imageUrl", 1024), ("brand", 120)):
    if field in payload:
      value = optional_string(payload.get(field), field, max_length=max_length)
      if value:
        allowed[field] = value

  if not partial and "stock" not in allowed:
    allowed["stock"] = 0

  return allowed


def create_product(payload: Dict[str, Any]) -> dict:
  clean_payload = _validate_product_payload(payload)
  res = mongo.db.products.insert_one(clean_payload)
  cache.delete(_products_cache_key(None))  # bust the "all products" cache entry
  return to_str_id(mongo.db.products.find_one({"_id": res.inserted_id}))


def update_product(product_id: str, payload: Dict[str, Any]) -> Optional[dict]:
  _id = get_object_id(product_id, "product id")
  clean_payload = _validate_product_payload(payload, partial=True)
  if not clean_payload:
    return get_product(product_id)
  mongo.db.products.update_one({"_id": _id}, {"$set": clean_payload})
  cache.clear()  # product categories/filters may shift; clear all product cache
  doc = mongo.db.products.find_one({"_id": _id})
  return to_str_id(doc) if doc else None


def delete_product(product_id: str) -> bool:
  res = mongo.db.products.delete_one({"_id": get_object_id(product_id, "product id")})
  if res.deleted_count == 1:
    cache.clear()
  return res.deleted_count == 1

