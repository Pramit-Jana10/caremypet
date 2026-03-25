from ..config.db import mongo

def get_vets_collection():
  return mongo.db.vets

