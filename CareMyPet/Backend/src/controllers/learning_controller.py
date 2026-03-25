from flask import Blueprint, request

from ..services import learning_service
from ..utils.decorators import auth_required
from ..utils.responses import success


bp = Blueprint("learning", __name__)


@bp.get("/learning/courses")
@auth_required
def list_learning_courses():
    pet_type = request.args.get("petType")
    courses = learning_service.list_training_courses(pet_type=pet_type)
    return success(courses, 200)


@bp.get("/learning/articles")
@auth_required
def list_learning_articles():
    category = request.args.get("category")
    articles = learning_service.list_knowledge_articles(category=category)
    return success(articles, 200)
