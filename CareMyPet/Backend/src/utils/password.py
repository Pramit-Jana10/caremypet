import bcrypt


def hash_password(raw: str) -> bytes:
  return bcrypt.hashpw(raw.encode("utf-8"), bcrypt.gensalt())


def verify_password(raw: str, hashed: bytes) -> bool:
  try:
    return bcrypt.checkpw(raw.encode("utf-8"), hashed)
  except ValueError:
    return False

