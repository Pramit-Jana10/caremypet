from typing import List

from ..config.db import mongo
from . import prescription_service
from ..utils.security import bounded_int, get_object_id


def _catalog_item_exists(item_object_id) -> bool:
  if mongo.db.products.find_one({"_id": item_object_id}, {"_id": 1}):
    return True
  if mongo.db.medicines.find_one({"_id": item_object_id}, {"_id": 1}):
    return True
  return False


def get_cart(user_id: str) -> List[dict]:
  doc = mongo.db.carts.find_one({"userId": user_id})
  if not doc:
    return []
  items = doc.get("items", [])
  return items


def _ensure_cart_doc(user_id: str) -> dict:
  doc = mongo.db.carts.find_one({"userId": user_id})
  if not doc:
    doc = {"userId": user_id, "items": []}
    mongo.db.carts.insert_one(doc)
  return doc


def add_item(user_id: str, product_id: str, quantity: int) -> List[dict]:
  product_object_id = get_object_id(product_id, "productId")
  clean_quantity = bounded_int(quantity, "quantity", minimum=1, maximum=99)
  if not _catalog_item_exists(product_object_id):
    raise ValueError("Product not found")

  medicine = mongo.db.medicines.find_one({"_id": product_object_id}, {"prescriptionRequired": 1, "name": 1})
  if medicine and medicine.get("prescriptionRequired") is True:
    has_valid_rx = prescription_service.user_has_valid_prescription_for_medicine(user_id, product_id)
    if not has_valid_rx:
      medicine_name = medicine.get("name") or "This medicine"
      raise PermissionError(f"{medicine_name} requires a valid prescription upload")

  doc = _ensure_cart_doc(user_id)
  items = doc.get("items", [])
  found = next((i for i in items if i["productId"] == product_id), None)
  if found:
    found["quantity"] = min(found["quantity"] + clean_quantity, 99)
  else:
    items.append({"productId": product_id, "quantity": clean_quantity})
  mongo.db.carts.update_one({"userId": user_id}, {"$set": {"items": items}})
  return items


def update_item(user_id: str, product_id: str, quantity: int) -> List[dict]:
  get_object_id(product_id, "productId")
  clean_quantity = bounded_int(quantity, "quantity", minimum=1, maximum=99)
  doc = _ensure_cart_doc(user_id)
  items = doc.get("items", [])
  for i in items:
    if i["productId"] == product_id:
      i["quantity"] = clean_quantity
  mongo.db.carts.update_one({"userId": user_id}, {"$set": {"items": items}})
  return items


def remove_item(user_id: str, product_id: str) -> List[dict]:
  get_object_id(product_id, "productId")
  doc = _ensure_cart_doc(user_id)
  items = [i for i in doc.get("items", []) if i["productId"] != product_id]
  mongo.db.carts.update_one({"userId": user_id}, {"$set": {"items": items}})
  return items

