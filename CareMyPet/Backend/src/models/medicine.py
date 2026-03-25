from ..config.db import mongo

def get_medicines_collection():
  return mongo.db.medicines

