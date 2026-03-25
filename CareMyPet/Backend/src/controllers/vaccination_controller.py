from flask import Blueprint, g, request

from ..services import vaccination_service
from ..utils.decorators import auth_required
from ..utils.responses import error, success
from ..utils.security import get_json_body, required_string


bp = Blueprint("vaccinations", __name__)


@bp.post("/vaccinations")
@auth_required
def create_vaccination():
  data = get_json_body(request)
  pet_id = required_string(data.get("petId"), "petId", max_length=64)
  vaccine_name = required_string(data.get("vaccineName"), "vaccineName", max_length=120)
  due_date_iso = required_string(data.get("dueDateIso"), "dueDateIso", max_length=10)
  try:
    created = vaccination_service.add_schedule_item(str(g.current_user["_id"]), pet_id, vaccine_name, due_date_iso)
  except ValueError as exc:
    return error(str(exc), 404)
  return success(created, 201)


@bp.get("/vaccinations/pet/<pet_id>")
@auth_required
def list_vaccinations_for_pet(pet_id: str):
  items = vaccination_service.list_schedule_for_pet(str(g.current_user["_id"]), pet_id)
  return success(items, 200)


@bp.put("/vaccinations/<vaccination_id>/complete")
@auth_required
def complete_vaccination(vaccination_id: str):
  updated = vaccination_service.mark_vaccine_complete(str(g.current_user["_id"]), vaccination_id)
  if not updated:
    return error("Vaccination not found", 404)
  return success(updated, 200)


@bp.put("/vaccinations/<vaccination_id>")
@auth_required
def update_vaccination(vaccination_id: str):
  data = get_json_body(request)
  try:
    updated = vaccination_service.update_vaccine(str(g.current_user["_id"]), vaccination_id, data)
  except ValueError as exc:
    return error(str(exc), 400)

  if not updated:
    return error("Vaccination not found", 404)
  return success(updated, 200)


@bp.delete("/vaccinations/<vaccination_id>")
@auth_required
def delete_vaccination(vaccination_id: str):
  deleted = vaccination_service.delete_vaccine(str(g.current_user["_id"]), vaccination_id)
  if not deleted:
    return error("Vaccination not found", 404)
  return success({"deleted": True}, 200)

