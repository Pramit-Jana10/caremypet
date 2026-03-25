from ..config.db import mongo

def get_orders_collection():
  return mongo.db.orders

