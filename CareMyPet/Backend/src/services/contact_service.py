from ..config.mail import send_email


def send_feedback_email(*, name: str, email: str, message: str) -> bool:
  subject = f"New Contact Us feedback from {name}"
  body = f"""
  <div style=\"font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px;\">
    <h2 style=\"margin: 0 0 12px;\">Contact Us feedback received</h2>
    <p style=\"margin: 6px 0;\"><strong>Name:</strong> {name}</p>
    <p style=\"margin: 6px 0;\"><strong>Email:</strong> {email}</p>
    <p style=\"margin: 16px 0 8px;\"><strong>Message:</strong></p>
    <div style=\"border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; white-space: pre-wrap; color: #111827;\">{message}</div>
  </div>
  """
  return send_email(subject, body, ["caremypetofficial@gmail.com"])
