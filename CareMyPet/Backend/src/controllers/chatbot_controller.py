from flask import Blueprint, request

from ..services import chatbot_service
from ..utils.responses import success


bp = Blueprint("chatbot", __name__)


@bp.post("/chatbot/message")
def chatbot_message():
  data = request.get_json(force=True) or {}
  message = data.get("message", "")
  reply = chatbot_service.ask(message)
  return success({"reply": reply}, 200)

