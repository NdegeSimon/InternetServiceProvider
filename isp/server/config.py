"""Server configuration.

This module should remain lean and avoid importing heavy dependencies.
"""

import os


class Config:
    ENV = os.getenv("FLASK_ENV", "production")
    DEBUG = ENV == "development"
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me")

    # Example service configuration
    MPESA_BASE_URL = os.getenv("MPESA_BASE_URL", "https://sandbox.safaricom.co.ke")
    MICROTIK_HOST = os.getenv("MICROTIK_HOST", "")
    MICROTIK_USER = os.getenv("MICROTIK_USER", "")
    MICROTIK_PASSWORD = os.getenv("MICROTIK_PASSWORD", "")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False
