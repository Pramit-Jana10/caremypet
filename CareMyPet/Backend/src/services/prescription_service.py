import re
from datetime import UTC, datetime
from typing import Dict, List

from ..config.db import mongo
from ..config.gemini_config import extract_medicine_names_from_prescription
from ..models import to_str_id


def _normalize(value: str) -> str:
  return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", value.lower())).strip()


def _tokenize(value: str) -> List[str]:
  return [token for token in _normalize(value).split(" ") if len(token) >= 3]


def _is_match(extracted_name: str, db_name: str) -> bool:
  normalized_extracted = _normalize(extracted_name)
  normalized_db = _normalize(db_name)
  if not normalized_extracted or not normalized_db:
    return False

  if normalized_extracted in normalized_db or normalized_db in normalized_extracted:
    return True

  extracted_tokens = set(_tokenize(extracted_name))
  db_tokens = set(_tokenize(db_name))
  overlap = extracted_tokens.intersection(db_tokens)
  return len(overlap) >= 2 or (len(overlap) == 1 and min(len(extracted_tokens), len(db_tokens)) == 1)


def extract_and_match_medicines(file_bytes: bytes, mime_type: str) -> Dict[str, List[dict] | List[str]]:
  extracted_names = extract_medicine_names_from_prescription(file_bytes, mime_type)
  if not extracted_names:
    return {
      "extractedMedicines": [],
      "matchedMedicines": [],
    }

  docs = list(mongo.db.medicines.find({}))
  matched: List[dict] = []
  matched_ids = set()

  for extracted_name in extracted_names:
    for doc in docs:
      doc_name = str(doc.get("name", ""))
      if not doc_name:
        continue
      if _is_match(extracted_name, doc_name):
        doc_id = str(doc.get("_id"))
        if doc_id not in matched_ids:
          matched_ids.add(doc_id)
          matched.append(to_str_id(doc))

  return {
    "extractedMedicines": extracted_names,
    "matchedMedicines": matched,
  }


def save_user_prescription_matches(user_id: str, filename: str | None, matched_medicines: List[dict]) -> None:
  medicine_ids = [str(doc.get("id")) for doc in matched_medicines if doc.get("id")]
  if not medicine_ids:
    return

  mongo.db.prescriptions.insert_one(
    {
      "userId": user_id,
      "filename": filename,
      "matchedMedicineIds": medicine_ids,
      "createdAt": datetime.now(UTC),
    }
  )


def user_has_valid_prescription_for_medicine(user_id: str, medicine_id: str) -> bool:
  doc = mongo.db.prescriptions.find_one(
    {
      "userId": user_id,
      "matchedMedicineIds": medicine_id,
    },
    {"_id": 1},
  )
  return bool(doc)
