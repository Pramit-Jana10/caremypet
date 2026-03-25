from flask import Blueprint, g, request

from ..services import order_service
from ..utils.decorators import auth_required, roles_required
from ..utils.responses import error, success
from ..utils.security import get_json_body


bp = Blueprint("orders", __name__)


@bp.post("/orders")
@auth_required
def create_order():
  user_id = str(g.current_user["_id"])
  data = get_json_body(request)
  address = data.get("address") or {}
  # Only Cash on Delivery is supported
  try:
    order = order_service.place_order(user_id, address, "COD")
  except ValueError as exc:
    return error(str(exc), 400)
  return success(order, 201)


@bp.get("/orders")
@auth_required
def list_orders():
  user_id = str(g.current_user["_id"])
  orders = order_service.list_orders_for_user(user_id)
  return success(orders, 200)


@bp.get("/orders/<order_id>")
@auth_required
def get_order(order_id: str):
  user_id = str(g.current_user["_id"])
  try:
    order = order_service.get_order(order_id, user_id)
  except Exception:
    return error("Order not found", 404)
  if not order:
    return error("Order not found", 404)
  return success(order, 200)


@bp.get("/admin/orders")
@auth_required
@roles_required(["admin"])
def admin_orders():
  orders = order_service.list_all_orders()
  return success(orders, 200)

