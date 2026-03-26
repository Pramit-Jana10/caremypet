import os
import requests


RESEND_API_URL = "https://api.resend.com/emails"


def _get_resend_config() -> tuple[str | None, str | None, str | None]:
    api_key = os.getenv("RESEND_API_KEY")
    from_email = os.getenv("RESEND_FROM_EMAIL") or os.getenv("MAIL_FROM")
    reply_to = os.getenv("RESEND_REPLY_TO")
    return api_key, from_email, reply_to


def send_email(to: str, subject: str, html: str) -> bool:
    recipient = to.strip().lower() if isinstance(to, str) else ""
    if not recipient:
        print(f"[MAIL] Email not sent. Subject={subject!r}, recipient='' ")
        return False

    api_key, from_email, reply_to = _get_resend_config()
    if not api_key or not from_email:
        print(
            "[MAIL] Missing Resend configuration. "
            f"RESEND_API_KEY set={bool(api_key)}, RESEND_FROM_EMAIL={from_email!r}"
        )
        print(f"[MAIL] Email not sent. Subject={subject!r}, recipient={recipient}")
        return False

    payload: dict[str, object] = {
        "from": from_email,
        "to": [recipient],
        "subject": subject,
        "html": html,
    }
    if reply_to:
        payload["reply_to"] = reply_to

    try:
        response = requests.post(
            RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15,
        )
        if response.ok:
            response_json = response.json() if response.content else {}
            print(
                "[MAIL] Email sent successfully via Resend. "
                f"Subject={subject!r}, recipient={recipient}, id={response_json.get('id')}"
            )
            print("Resend response:", response.text)
            return True

        print(
            "[MAIL] Resend API returned error. "
            f"Subject={subject!r}, recipient={recipient}, status={response.status_code}, body={response.text}"
        )
        print("Resend response:", response.text)
        return False
    except requests.RequestException as e:
        print(f"[MAIL] Resend request failed. Subject={subject!r}, recipient={recipient}, error={e}")
        return False
    except ValueError as e:
        print(f"[MAIL] Resend response parse failed. Subject={subject!r}, recipient={recipient}, error={e}")
        return False

