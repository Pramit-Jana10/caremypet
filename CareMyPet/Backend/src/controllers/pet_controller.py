from flask import Blueprint, g, request

from ..services import vaccination_service
from ..utils.decorators import auth_required
from ..utils.responses import error, success
from ..utils.security import get_json_body


bp = Blueprint("pets", __name__)


@bp.post("/pets")
@auth_required
def create_pet():
  data = get_json_body(request)
  owner_id = str(g.current_user["_id"])
  pet = vaccination_service.create_pet(owner_id, data)
  return success(pet, 201)


@bp.get("/pets")
@auth_required
def list_pets():
  owner_id = str(g.current_user["_id"])
  pets = vaccination_service.list_pets(owner_id)
  return success(pets, 200)


@bp.get("/pets/<pet_id>")
@auth_required
def get_pet(pet_id: str):
  owner_id = str(g.current_user["_id"])
  pets = vaccination_service.list_pets(owner_id)
  pet = next((p for p in pets if p["id"] == pet_id), None)
  if not pet:
    return error("Pet not found", 404)
  return success(pet, 200)


@bp.put("/pets/<pet_id>")
@auth_required
def update_pet(pet_id: str):
  data = get_json_body(request)
  owner_id = str(g.current_user["_id"])
  try:
    updated = vaccination_service.update_pet(owner_id, pet_id, data)
  except ValueError as exc:
    return error(str(exc), 400)

  if not updated:
    return error("Pet not found", 404)
  return success(updated, 200)


@bp.delete("/pets/<pet_id>")
@auth_required
def delete_pet(pet_id: str):
  owner_id = str(g.current_user["_id"])
  deleted = vaccination_service.delete_pet(owner_id, pet_id)
  if not deleted:
    return error("Pet not found", 404)
  return success({"deleted": True}, 200)

