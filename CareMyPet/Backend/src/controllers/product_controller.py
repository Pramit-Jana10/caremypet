from flask import Blueprint, g, request

from ..services import product_service
from ..utils.decorators import auth_required, roles_required
from ..utils.responses import error, success
from ..utils.security import get_json_body


bp = Blueprint("products", __name__)


@bp.get("/products")
def list_products():
  filters = {
    "q": request.args.get("q") or None,
    "category": request.args.get("category") or None,
    "petType": request.args.get("petType") or None,
  }
  products = product_service.list_products(filters)
  return success(products, 200)


@bp.get("/products/<product_id>")
def get_product(product_id: str):
  try:
    product = product_service.get_product(product_id)
  except Exception:
    product = None
  if not product:
    return error("Product not found", 404)
  return success(product, 200)


@bp.post("/products")
@auth_required
@roles_required(["admin"])
def create_product():
  data = get_json_body(request)
  created = product_service.create_product(data)
  return success(created, 201)


@bp.put("/products/<product_id>")
@auth_required
@roles_required(["admin"])
def update_product(product_id: str):
  data = get_json_body(request)
  try:
    updated = product_service.update_product(product_id, data)
  except Exception:
    updated = None
  if not updated:
    return error("Product not found", 404)
  return success(updated, 200)


@bp.delete("/products/<product_id>")
@auth_required
@roles_required(["admin"])
def delete_product(product_id: str):
  try:
    ok = product_service.delete_product(product_id)
  except Exception:
    ok = False
  if not ok:
    return error("Product not found", 404)
  return success({"deleted": True}, 200)

