from flask import Blueprint, g, request

from ..services import prescription_service
from ..utils.decorators import auth_required
from ..utils.responses import error, success


bp = Blueprint("uploads", __name__)


@bp.post("/uploads/prescription")
@auth_required
def upload_prescription():
  user_id = str(g.current_user["_id"])
  file = request.files.get("file")
  if not file:
    return error("Prescription file is required", 400)

  mime_type = (file.mimetype or "").lower()
  if not mime_type.startswith("image/"):
    return error("Only image prescriptions are supported for automatic extraction", 400)

  file_bytes = file.read()
  if not file_bytes:
    return error("Uploaded prescription file is empty", 400)

  matched_data = prescription_service.extract_and_match_medicines(file_bytes, mime_type)
  prescription_service.save_user_prescription_matches(
    user_id,
    file.filename,
    matched_data["matchedMedicines"],
  )
  return success(
    {
      "filename": file.filename,
      "extractedMedicines": matched_data["extractedMedicines"],
      "matchedMedicines": matched_data["matchedMedicines"],
    },
    200,
  )

