"""Punto de entrada para Vercel, que busca la aplicación FastAPI en index.py.

En Docker y en desarrollo se usa aliflow.main:app directamente.
"""

from aliflow.main import app

__all__ = ["app"]
