from datetime import datetime
from datetime import UTC

from ..config.db import mongo


def create_user(name: str, email: str, password_hash: bytes, role: str = "user") -> str:
  doc = {
    "name": name,
    "email": email.lower(),
    "password": password_hash,
    "role": role,
    "createdAt": datetime.now(UTC),
    "fcmToken": None,
    "subscriptionPlan": "free",
    "isPremium": False,
    "premiumFeatures": [],
    "premiumSince": None,
    "premiumExpiresOn": None,
  }
  res = mongo.db.users.insert_one(doc)
  return str(res.inserted_id)

