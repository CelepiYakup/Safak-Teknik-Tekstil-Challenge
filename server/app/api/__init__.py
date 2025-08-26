from flask import Blueprint
from .work_orders import bp as work_orders_bp
from .operations import bp as operations_bp

def create_api_blueprint():
    api = Blueprint("api", __name__)
    api.register_blueprint(work_orders_bp, url_prefix="/work-orders")
    api.register_blueprint(operations_bp, url_prefix="/operations")
    return api
