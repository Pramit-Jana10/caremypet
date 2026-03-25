from ..config.db import mongo

def get_carts_collection():
  return mongo.db.carts

