import logging


logger = logging.getLogger("smart_pet_care")
if not logger.handlers:
  handler = logging.StreamHandler()
  formatter = logging.Formatter("[%(asctime)s] %(levelname)s in %(module)s: %(message)s")
  handler.setFormatter(formatter)
  logger.addHandler(handler)
  logger.setLevel(logging.INFO)

