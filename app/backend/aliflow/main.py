import os

from fastapi import FastAPI

from aliflow.config import get_settings
from aliflow.routers import admin, auth, cuentas


def crear_app() -> FastAPI:
    s = get_settings()
    app = FastAPI(
        title="Aliflow API",
        version="0.1.0",
        # La documentación interactiva no se publica en producción.
        docs_url=None if s.es_produccion else "/docs",
        redoc_url=None,
        openapi_url=None if s.es_produccion else "/openapi.json",
    )
    app.include_router(auth.router)
    app.include_router(cuentas.router)
    app.include_router(cuentas.puntos_router)
    app.include_router(admin.router)

    @app.get("/salud", tags=["operación"])
    def salud() -> dict[str, str]:
        # El commit desplegado, para saber qué versión está corriendo (Vercel lo inyecta).
        return {"estado": "ok", "version": os.environ.get("VERCEL_GIT_COMMIT_SHA", "local")[:7]}

    return app


app = crear_app()
