import os
from flask import Flask
from .config import get_config
from .extensions import db, migrate, cors
from .api import create_api_blueprint
from .cli import register_cli

def create_app() -> Flask:
    app = Flask(__name__)

    env = os.getenv("FLASK_ENV", "development")
    app.config.from_object(get_config(env))

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS")}})

    app.register_blueprint(create_api_blueprint(), url_prefix="/api")

    register_cli(app)
    return app
