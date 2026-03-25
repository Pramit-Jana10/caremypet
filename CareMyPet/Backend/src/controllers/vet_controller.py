from flask import Blueprint, g, request

from ..services import vet_service
from ..utils.decorators import auth_required, roles_required
from ..utils.responses import error, success
from ..utils.security import get_json_body


bp = Blueprint("vets", __name__)


@bp.get("/vets")
def list_vets():
  filters = {
    "q": request.args.get("q") or None,
    "location": request.args.get("location") or None,
    "specialization": request.args.get("specialization") or None,
  }
  vets = vet_service.list_vets(filters)
  return success(vets, 200)


@bp.get("/vets/<vet_id>")
def get_vet(vet_id: str):
  try:
    vet = vet_service.get_vet(vet_id)
  except Exception:
    vet = None
  if not vet:
    return error("Vet not found", 404)
  return success(vet, 200)


@bp.post("/vets")
@auth_required
@roles_required(["admin"])
def create_vet():
  data = get_json_body(request)
  created = vet_service.create_vet(data)
  return success(created, 201)

