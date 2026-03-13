"""Entry point for the ISP backend.

This is a minimal Flask application used as a starting point for the ISP backend.
"""

from flask import Flask, jsonify

from .config import Config


def create_app(config: str | Config | None = None) -> Flask:
    """Create and configure the Flask application."""

    app = Flask(__name__, instance_relative_config=True)

    if isinstance(config, str):
        app.config.from_object(config)
    elif config is not None:
        app.config.from_object(config)
    else:
        app.config.from_object(Config)

    @app.route("/health", methods=["GET"])
    def health() -> tuple[dict, int]:
        return {"status": "ok"}, 200

    # Register blueprints here (e.g. mpesa, session)
    try:
        from .routes.mpesa import mpesa_bp
        app.register_blueprint(mpesa_bp, url_prefix="/api/mpesa")
    except ImportError:
        # Keep the app runnable even if routes are not yet implemented
        pass

    return app


if __name__ == "__main__":
    create_app().run(host="0.0.0.0", port=5000, debug=True)
