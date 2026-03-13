"""Route package for the ISP backend."""

# This package is intentionally left nearly empty; it exists so we can
# keep route modules in a dedicated directory.

from .mpesa import mpesa_bp

__all__ = ["mpesa_bp"]
