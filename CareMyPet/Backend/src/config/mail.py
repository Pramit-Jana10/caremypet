import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Iterable


def _get_smtp_client():
    # Support both MAIL_* and SMTP_* naming to avoid config mismatch.
    server = os.getenv("MAIL_SERVER") or os.getenv("SMTP_SERVER") or os.getenv("SMTP_HOST")
    port = int(os.getenv("MAIL_PORT") or os.getenv("SMTP_PORT") or "587")
    username = os.getenv("MAIL_USERNAME") or os.getenv("SMTP_USERNAME") or os.getenv("SMTP_USER")
    password = os.getenv("MAIL_PASSWORD") or os.getenv("SMTP_PASSWORD")
    use_tls = os.getenv("MAIL_USE_TLS", "true").lower() == "true"

    if not server or not username or not password:
        print("[MAIL] Missing SMTP configuration. "
              f"MAIL_SERVER={server!r}, MAIL_USERNAME set={bool(username)}, MAIL_PASSWORD set={bool(password)}")
        return None

    try:
        client = smtplib.SMTP(server, port, timeout=15)
        client.ehlo()
        if use_tls:
            client.starttls()
            client.ehlo()
        client.login(username, password)
        print("[MAIL] SMTP login successful")
        return client
    except Exception as e:
        # Log the exact reason so it shows up in the backend console.
        print(f"[MAIL] SMTP connection/login failed: {e}")
        return None


def send_email(subject: str, body: str, recipients: Iterable[str]) -> bool:
    recipient_list = [r.strip().lower() for r in recipients if isinstance(r, str) and r.strip()]
    if not recipient_list:
        print(f"[MAIL] Email not sent. Subject={subject!r}, recipients=[]")
        return False

    client = _get_smtp_client()
    if client is None:
        print(f"[MAIL] Email not sent. Subject={subject!r}, recipients={recipient_list}")
        return False

    username = (
        os.getenv("MAIL_FROM")
        or os.getenv("MAIL_USERNAME")
        or os.getenv("SMTP_FROM")
        or os.getenv("SMTP_USERNAME")
        or os.getenv("SMTP_USER")
        or ""
    )

    msg = MIMEMultipart()
    msg["From"] = username
    msg["To"] = ", ".join(recipient_list)
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html"))

    try:
        client.sendmail(username, recipient_list, msg.as_string())
        print(f"[MAIL] Email sent successfully. Subject={subject!r}, recipients={recipient_list}")
        return True
    except Exception as e:
        print(f"[MAIL] sendmail failed. Subject={subject!r}, recipients={recipient_list}, error={e}")
        return False
    finally:
        try:
            client.quit()
        except Exception:
            pass

