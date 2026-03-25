from typing import List

from ..config.gemini_config import ask_chatbot


def ask(message: str) -> str:
  messages: List[dict] = [
    {"role": "system", "content": "You are a helpful pet care assistant."},
    {"role": "user", "content": message},
  ]
  return ask_chatbot(messages)
 
