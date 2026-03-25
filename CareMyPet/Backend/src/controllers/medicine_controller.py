from flask import Blueprint, g, request

from ..services import medicine_service
from ..utils.decorators import auth_required, roles_required
from ..utils.responses import error, success
from ..utils.security import get_json_body


bp = Blueprint("medicines", __name__)


@bp.get("/medicines")
def list_medicines():
  filters = {
    "q": request.args.get("q") or None,
    "petType": request.args.get("petType") or None,
  }
  meds = medicine_service.list_medicines(filters)
  return success(meds, 200)


@bp.get("/medicines/<medicine_id>")
def get_medicine(medicine_id: str):
  try:
    med = medicine_service.get_medicine(medicine_id)
  except Exception:
    med = None
  if not med:
    return error("Medicine not found", 404)
  return success(med, 200)


@bp.post("/medicines")
@auth_required
@roles_required(["admin"])
def create_medicine():
  data = get_json_body(request)
  med = medicine_service.create_medicine(data)
  return success(med, 201)

