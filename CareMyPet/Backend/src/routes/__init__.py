from flask import Flask

from ..controllers.auth_controller import bp as auth_bp
from ..controllers.user_controller import bp as user_bp
from ..controllers.pet_controller import bp as pet_bp
from ..controllers.product_controller import bp as product_bp
from ..controllers.cart_controller import bp as cart_bp
from ..controllers.order_controller import bp as order_bp
from ..controllers.vet_controller import bp as vet_bp
from ..controllers.vaccination_controller import bp as vaccination_bp
from ..controllers.medicine_controller import bp as medicine_bp
from ..controllers.upload_controller import bp as upload_bp
from ..controllers.chatbot_controller import bp as chatbot_bp
from ..controllers.learning_controller import bp as learning_bp
from ..controllers.contact_controller import bp as contact_bp


def register_auth_routes(app: Flask) -> None:
  app.register_blueprint(auth_bp, url_prefix="/api")


def register_user_routes(app: Flask) -> None:
  app.register_blueprint(user_bp, url_prefix="/api")


def register_pet_routes(app: Flask) -> None:
  app.register_blueprint(pet_bp, url_prefix="/api")


def register_product_routes(app: Flask) -> None:
  app.register_blueprint(product_bp, url_prefix="/api")


def register_cart_routes(app: Flask) -> None:
  app.register_blueprint(cart_bp, url_prefix="/api")


def register_order_routes(app: Flask) -> None:
  app.register_blueprint(order_bp, url_prefix="/api")


def register_vet_routes(app: Flask) -> None:
  app.register_blueprint(vet_bp, url_prefix="/api")


def register_appointment_routes(app: Flask) -> None:
  # appointments are on vet_bp
  pass


def register_vaccination_routes(app: Flask) -> None:
  app.register_blueprint(vaccination_bp, url_prefix="/api")


def register_medicine_routes(app: Flask) -> None:
  app.register_blueprint(medicine_bp, url_prefix="/api")


def register_upload_routes(app: Flask) -> None:
  app.register_blueprint(upload_bp, url_prefix="/api")


def register_chatbot_routes(app: Flask) -> None:
  app.register_blueprint(chatbot_bp, url_prefix="/api")


def register_learning_routes(app: Flask) -> None:
  app.register_blueprint(learning_bp, url_prefix="/api")


def register_admin_routes(app: Flask) -> None:
  # Admin routes are embedded in user/order/vet controllers.
  pass


def register_contact_routes(app: Flask) -> None:
  app.register_blueprint(contact_bp, url_prefix="/api")

