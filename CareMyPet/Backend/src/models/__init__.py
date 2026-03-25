from bson import ObjectId


def to_str_id(doc):
  if not doc:
    return doc
  doc = dict(doc)
  _id = doc.pop("_id", None)
  if isinstance(_id, ObjectId):
    doc["id"] = str(_id)
  elif _id is not None:
    doc["id"] = _id
  return doc

