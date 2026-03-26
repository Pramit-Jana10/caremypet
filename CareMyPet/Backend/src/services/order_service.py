import os
from datetime import datetime
from datetime import UTC
from typing import Any, Dict, List, Optional

from bson import ObjectId

from ..config.db import mongo
from ..config.mail import send_email
from ..models import to_str_id
from . import prescription_service
from ..utils.security import get_object_id, optional_string, required_string


def _order_notification_email() -> str:
  # Read at call-time so values from .env are available after load_dotenv.
  return os.getenv("ORDER_NOTIFICATION_EMAIL", "").strip().lower()


def _find_user_for_order_receipt(user_id: str) -> dict | None:
  """Resolve user doc for receipt email across string/ObjectId _id formats."""
  try:
    object_id = get_object_id(user_id, "user id")
    user = mongo.db.users.find_one({"_id": object_id})
    if user:
      return user
  except Exception:
    pass

  # Compatibility fallback for datasets that store _id/sub as plain strings.
  return mongo.db.users.find_one({"_id": user_id})


def list_orders_for_user(user_id: str) -> List[dict]:
  docs = mongo.db.orders.find({"userId": user_id}).sort("createdAt", -1)
  return [to_str_id(d) for d in docs]


def _find_catalog_item(item_object_id):
  product = mongo.db.products.find_one({"_id": item_object_id})
  if product:
    return product
  return mongo.db.medicines.find_one({"_id": item_object_id})


def get_order(order_id: str, user_id: Optional[str] = None) -> Optional[dict]:
  query: Dict[str, Any] = {"_id": get_object_id(order_id, "order id")}
  if user_id:
    query["userId"] = user_id
  doc = mongo.db.orders.find_one(query)
  return to_str_id(doc) if doc else None


def _validate_address(address: Dict[str, Any]) -> Dict[str, str]:
  if not isinstance(address, dict):
    raise ValueError("Address must be an object")

  normalized = {
    "fullName": required_string(address.get("fullName"), "Address fullName", max_length=80),
    "line1": required_string(address.get("line1"), "Address line1", max_length=120),
    "city": required_string(address.get("city"), "Address city", max_length=80),
    "state": required_string(address.get("state"), "Address state", max_length=80),
    "zip": required_string(address.get("zip"), "Address zip", max_length=20),
  }
  phone = optional_string(address.get("phone"), "Address phone", max_length=24)
  if phone:
    normalized["phone"] = phone
  return normalized


def place_order(user_id: str, address: Dict[str, Any], payment_method: str) -> dict:
  if payment_method != "COD":
    raise ValueError("Unsupported payment method")

  clean_address = _validate_address(address)
  cart = mongo.db.carts.find_one({"userId": user_id}) or {"items": []}
  items = cart.get("items", [])
  total_amount = 0.0
  products: List[Dict[str, Any]] = []
  for item in items:
    try:
      product_object_id = get_object_id(item.get("productId"), "productId")
    except Exception:
      continue
    prod = _find_catalog_item(product_object_id)
    if not prod:
      continue
    if "prescriptionRequired" in prod and prod.get("prescriptionRequired") is True:
      has_valid_rx = prescription_service.user_has_valid_prescription_for_medicine(user_id, str(prod.get("_id")))
      if not has_valid_rx:
        medicine_name = prod.get("name") or "A medicine"
        raise ValueError(f"{medicine_name} requires a valid prescription upload before checkout")
    price = float(prod.get("price", 0))
    qty = int(item.get("quantity", 1))
    total_amount += price * qty
    products.append(
      {
        "productId": str(prod["_id"]),
        "name": prod.get("name"),
        "price": price,
        "quantity": qty,
      }
    )

  if not products:
    raise ValueError("Cart is empty")

  doc = {
    "userId": user_id,
    "products": products,
    "totalAmount": total_amount,
    "paymentStatus": "cod",
    "orderStatus": "Processing",
    "address": clean_address,
    "createdAt": datetime.now(UTC),
  }
  res = mongo.db.orders.insert_one(doc)
  mongo.db.carts.update_one({"userId": user_id}, {"$set": {"items": []}})
  order = to_str_id(mongo.db.orders.find_one({"_id": res.inserted_id}))

  # Send order receipt email (and optional admin notification copy).
  try:
    user = _find_user_for_order_receipt(user_id)
    user_name = user.get("name", "N/A") if user else "N/A"
    user_email = (user.get("email") or "").strip().lower() if user else ""
    addr = clean_address or {}
    addr_lines = [
      addr.get("fullName", ""),
      addr.get("line1", ""),
      f"{addr.get('city', '')} {addr.get('state', '')} {addr.get('zip', '')}".strip(),
    ]
    addr_str = "<br>".join((x for x in addr_lines if x))
    product_rows = "".join(
      f"<tr><td>{p.get('name', '')}</td><td>{p.get('quantity', 1)}</td><td>₹{p.get('price', 0):.2f}</td><td>₹{float(p.get('price', 0)) * int(p.get('quantity', 1)):.2f}</td></tr>"
      for p in products
    )
    subject = f"[CareMyPet] Order receipt #{order.get('id', '')}"
    body = f"""
    <h2>Thanks for your order!</h2>
    <p>Hi {user_name or 'there'}, your order has been placed successfully.</p>
    <h3>User details</h3>
    <p><b>Name:</b> {user_name}<br><b>Email:</b> {user_email or 'N/A'}</p>
    <h3>Shipping address</h3>
    <p>{addr_str or 'N/A'}</p>
    <h3>Products</h3>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
      {product_rows}
    </table>
    <p><b>Total amount:</b> ₹{total_amount:.2f}</p>
    <p><b>Payment:</b> Cash on Delivery</p>
    """

    recipients: List[str] = []
    if user_email:
      recipients.append(user_email)
    notification_email = _order_notification_email()
    if notification_email and notification_email not in recipients:
      recipients.append(notification_email)

    if recipients:
      sent_count = 0
      for recipient in recipients:
        if send_email(recipient, subject, body):
          sent_count += 1

      if sent_count == len(recipients):
        print(f"[ORDER] Receipt email sent for order={order.get('id')} to {recipients}")
      else:
        print(f"[ORDER] Receipt email failed for order={order.get('id')} to {recipients}")
    else:
      print(f"[ORDER] Receipt email skipped for order={order.get('id')} (no recipients)")
  except Exception as exc:
    print(f"[ORDER] Receipt email error for order={order.get('id')}: {exc}")

  return order


def list_all_orders() -> List[dict]:
  docs = mongo.db.orders.find().sort("createdAt", -1)
  return [to_str_id(d) for d in docs]

