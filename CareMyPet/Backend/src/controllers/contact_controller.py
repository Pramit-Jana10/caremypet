from flask import Blueprint, request

from ..services import contact_service
from ..utils.responses import error, success
from ..utils.security import get_json_body, normalize_email, required_string


bp = Blueprint("contact", __name__)


@bp.post("/contact/feedback")
def send_feedback():
  data = get_json_body(request)
  name = required_string(data.get("name"), "Name", max_length=80)
  email = normalize_email(data.get("email"))
  message = required_string(data.get("message"), "Message", max_length=4000)

  sent = contact_service.send_feedback_email(name=name, email=email, message=message)
  if not sent:
    return error("Unable to send feedback right now. Please try again shortly.", 503)

  return success({"message": "Feedback sent successfully"}, 200)
