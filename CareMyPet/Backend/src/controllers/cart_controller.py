from flask import Blueprint, g, request

from ..services import cart_service
from ..utils.decorators import auth_required
from ..utils.responses import error, success
from ..utils.security import bounded_int, get_json_body, required_string


bp = Blueprint("cart", __name__)


@bp.get("/cart")
@auth_required
def get_cart():
  user_id = str(g.current_user["_id"])
  items = cart_service.get_cart(user_id)
  return success(items, 200)


@bp.post("/cart/add")
@auth_required
def add_item():
  user_id = str(g.current_user["_id"])
  data = get_json_body(request)
  product_id = required_string(data.get("productId"), "productId", max_length=64)
  quantity = bounded_int(data.get("quantity", 1), "quantity", minimum=1, maximum=99)
  try:
    items = cart_service.add_item(user_id, product_id, quantity)
  except PermissionError as exc:
    return error(str(exc), 403)
  except ValueError as exc:
    return error(str(exc), 404)
  return success(items, 200)


@bp.put("/cart/update")
@auth_required
def update_item():
  user_id = str(g.current_user["_id"])
  data = get_json_body(request)
  product_id = required_string(data.get("productId"), "productId", max_length=64)
  quantity = bounded_int(data.get("quantity", 1), "quantity", minimum=1, maximum=99)
  items = cart_service.update_item(user_id, product_id, quantity)
  return success(items, 200)


@bp.delete("/cart/remove/<product_id>")
@auth_required
def remove_item(product_id: str):
  user_id = str(g.current_user["_id"])
  items = cart_service.remove_item(user_id, product_id)
  return success(items, 200)

