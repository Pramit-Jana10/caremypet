import os
from email.utils import parseaddr

import requests


BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def _get_brevo_config() -> tuple[str | None, str | None, str | None]:
    # Keep RESEND_* fallbacks so existing deployments do not break during migration.
    api_key = os.getenv("BREVO_API_KEY") or os.getenv("RESEND_API_KEY")
    from_email = (
        os.getenv("BREVO_FROM_EMAIL")
        or os.getenv("RESEND_FROM_EMAIL")
        or os.getenv("MAIL_FROM")
    )
    reply_to = os.getenv("BREVO_REPLY_TO") or os.getenv("RESEND_REPLY_TO")
    return api_key, from_email, reply_to


def _parse_sender(from_email: str) -> tuple[str, str]:
    name, email = parseaddr(from_email)
    return (name or "CareMyPet"), email or from_email


def send_email(to: str, subject: str, html: str) -> bool:
    recipient = to.strip().lower() if isinstance(to, str) else ""
    if not recipient:
        print(f"[MAIL] Email not sent. Subject={subject!r}, recipient='' ")
        return False

    api_key, from_email, reply_to = _get_brevo_config()
    if not api_key or not from_email:
        print(
            "[MAIL] Missing Brevo configuration. "
            f"BREVO_API_KEY set={bool(api_key)}, BREVO_FROM_EMAIL={from_email!r}"
        )
        print(f"[MAIL] Email not sent. Subject={subject!r}, recipient={recipient}")
        return False

    sender_name, sender_email = _parse_sender(from_email)

    payload: dict[str, object] = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": recipient}],
        "subject": subject,
        "html": html,
    }
    if reply_to:
        payload["replyTo"] = {"email": reply_to}

    try:
        response = requests.post(
            BREVO_API_URL,
            headers={
                "api-key": api_key,
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15,
        )
        if response.ok:
            response_json = response.json() if response.content else {}
            print(
                "[MAIL] Email sent successfully via Brevo. "
                f"Subject={subject!r}, recipient={recipient}, id={response_json.get('messageId')}"
            )
            print("Brevo response:", response.text)
            return True

        print(
            "[MAIL] Brevo API returned error. "
            f"Subject={subject!r}, recipient={recipient}, status={response.status_code}, body={response.text}"
        )
        print("Brevo response:", response.text)
        return False
    except requests.RequestException as e:
        print(f"[MAIL] Brevo request failed. Subject={subject!r}, recipient={recipient}, error={e}")
        return False
    except ValueError as e:
        print(f"[MAIL] Brevo response parse failed. Subject={subject!r}, recipient={recipient}, error={e}")
        return False

