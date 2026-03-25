from ..config.db import mongo

# Kept for backward compatibility; prefer using mongo.db.pets directly.
def get_pets_collection():
  return mongo.db.pets

