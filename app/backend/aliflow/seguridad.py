"""Contraseñas, tokens de sesión y verificación de la identidad de Google."""

import hashlib
import secrets
from dataclasses import dataclass

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

# RF-03 criterio 2 / RNF-P-17: función de derivación de clave con sal (Argon2id).
_hasher = PasswordHasher()

# Se usa para igualar el tiempo de respuesta cuando el correo no existe, y que
# medir cuánto tarda el login no revele qué cuentas hay.
_HASH_SEÑUELO = _hasher.hash("aliflow-señuelo")


def hashear_password(password: str) -> str:
    return _hasher.hash(password)


def verificar_password(password: str, hash_guardado: str | None) -> bool:
    try:
        return _hasher.verify(hash_guardado or _HASH_SEÑUELO, password) and bool(hash_guardado)
    except (VerifyMismatchError, InvalidHashError):
        return False


def nuevo_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> bytes:
    return hashlib.sha256(token.encode()).digest()


@dataclass(frozen=True)
class IdentidadGoogle:
    email: str
    nombre: str
    email_verificado: bool
    dominio_hosted: str | None


def verificar_id_token_google(id_token: str, client_id: str) -> IdentidadGoogle:
    """Valida firma, emisor, audiencia y expiración del ID token contra Google.

    Lanza ValueError si el token no es válido. Se importa adentro para que las
    pruebas puedan sustituir esta función sin necesitar red.
    """
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token as google_id_token

    datos = google_id_token.verify_oauth2_token(id_token, google_requests.Request(), client_id)
    return IdentidadGoogle(
        email=datos["email"],
        nombre=datos.get("name") or datos["email"].split("@")[0],
        email_verificado=bool(datos.get("email_verified")),
        dominio_hosted=datos.get("hd"),
    )
