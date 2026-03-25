from ..config.db import mongo

def get_vaccinations_collection():
  return mongo.db.vaccinations

