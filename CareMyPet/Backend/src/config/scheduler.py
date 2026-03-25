import datetime as dt
import os
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from flask import Flask

from ..services.vaccination_service import get_vaccinations_due_on_date
from ..services.notification_service import send_vaccination_reminders
from ..utils.logging import logger

try:
    from apscheduler.schedulers.background import BackgroundScheduler
except ImportError:  # pragma: no cover
    BackgroundScheduler = None  # type: ignore[assignment]

_scheduler = None


def _get_reminder_timezone() -> ZoneInfo:
    configured = os.getenv("REMINDER_TIMEZONE", os.getenv("APP_TIMEZONE", "Asia/Kolkata")).strip()
    if not configured:
        configured = "Asia/Kolkata"

    try:
        return ZoneInfo(configured)
    except ZoneInfoNotFoundError:
        logger.warning(
            "Invalid REMINDER_TIMEZONE/APP_TIMEZONE '%s'; falling back to UTC",
            configured,
        )
        return ZoneInfo("UTC")


def _vaccination_job() -> None:
    today = dt.datetime.now(_get_reminder_timezone()).date()

    due_tomorrow = today + dt.timedelta(days=1)
    day_before_reminders = get_vaccinations_due_on_date(due_tomorrow)
    if day_before_reminders:
        send_vaccination_reminders(
            day_before_reminders,
            reminder_sent_on=today,
            reminder_type="day_before",
        )

    due_today_reminders = get_vaccinations_due_on_date(today)
    if due_today_reminders:
        send_vaccination_reminders(
            due_today_reminders,
            reminder_sent_on=today,
            reminder_type="due_today",
        )


def init_scheduler(app: Flask) -> None:
    global _scheduler
    if _scheduler is not None:
        return

    if BackgroundScheduler is None:
        logger.warning("APScheduler not installed; skipping vaccination reminder scheduler")
        return

    scheduler = BackgroundScheduler(timezone=_get_reminder_timezone())
    # Run hourly to avoid missed sends; per-day marker fields prevent duplicate reminders.
    scheduler.add_job(
        _vaccination_job,
        "cron",
        minute=0,
        id="vaccination-reminder-job",
        replace_existing=True,
        coalesce=True,
        misfire_grace_time=3600,
        max_instances=1,
    )
    scheduler.start()
    _scheduler = scheduler

