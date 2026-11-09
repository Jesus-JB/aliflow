"""Configuración de la API, leída de variables de entorno (o de un archivo .env).

Nada de lo que cambia entre ambientes vive en el código: dominio institucional,
client ID de Google, URL de la base y tiempos de expiración de sesión.
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="ALIFLOW_", extra="ignore")

    entorno: str = "desarrollo"  # desarrollo | pruebas | demo | produccion
    database_url: str = "postgresql+psycopg://aliflow@localhost:5432/aliflow"

    @field_validator("database_url")
    @classmethod
    def _con_driver_psycopg(cls, url: str) -> str:
        # Los proveedores (Neon, Vercel, Render) entregan postgres:// o postgresql://;
        # SQLAlchemy necesita que se le diga el driver.
        for prefijo in ("postgres://", "postgresql://"):
            if url.startswith(prefijo):
                return "postgresql+psycopg://" + url[len(prefijo) :]
        return url

    # RF-01: solo correos de este dominio pueden entrar como Estudiante.
    dominio_institucional: str = "uees.edu.ec"
    google_client_id: str = ""

    # RF-05: expiración por inactividad, configurable por rol (en minutos).
    inactividad_estudiante_min: int = 60 * 24 * 7
    inactividad_proveedor_min: int = 60 * 8
    inactividad_operador_min: int = 60 * 2
    inactividad_superadmin_min: int = 60

    cookie_sesion: str = "aliflow_sesion"
    # En producción la cookie solo viaja por HTTPS (RNF de seguridad).
    cookie_segura: bool = False

    @property
    def es_produccion(self) -> bool:
        return self.entorno == "produccion"


@lru_cache
def get_settings() -> Settings:
    return Settings()
