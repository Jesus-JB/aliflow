"""Ciclo de vida de las sesiones: abrir, validar, expirar y revocar.

RF-05: tras cerrar sesión el token deja de aceptarse, y una sesión inactiva
expira en un plazo configurable por rol.
RF-04 c3: revocar una cuenta invalida sus sesiones en la siguiente petición.
"""

import ipaddress
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import Request, Response
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from aliflow.config import Settings
from aliflow.models import Rol, Sesion, Usuario
from aliflow.seguridad import hash_token, nuevo_token

# No se reescribe ultima_actividad en cada petición: con esta resolución basta
# para expirar por inactividad y se ahorra una escritura por request.
_RESOLUCION_ACTIVIDAD = timedelta(seconds=60)


def ahora() -> datetime:
    return datetime.now(UTC)


def plazo_inactividad(rol: Rol, s: Settings) -> timedelta:
    minutos = {
        Rol.ESTUDIANTE: s.inactividad_estudiante_min,
        Rol.PROVEEDOR: s.inactividad_proveedor_min,
        Rol.OPERADOR: s.inactividad_operador_min,
        Rol.SUPERADMIN: s.inactividad_superadmin_min,
    }[rol]
    return timedelta(minutes=minutos)


def _ip_valida(host: str | None) -> str | None:
    """Detrás de un proxy o un socket Unix el 'host' no siempre es una IP."""
    try:
        return str(ipaddress.ip_address(host)) if host else None
    except ValueError:
        return None


def abrir_sesion(
    db: Session, usuario: Usuario, request: Request, response: Response, s: Settings
) -> str:
    token = nuevo_token()
    db.add(
        Sesion(
            usuario_id=usuario.id,
            token_hash=hash_token(token),
            ip=_ip_valida(request.client.host if request.client else None),
            agente_usuario=request.headers.get("user-agent"),
        )
    )
    response.set_cookie(
        s.cookie_sesion,
        token,
        httponly=True,  # el JavaScript de la página no puede leerla
        secure=s.cookie_segura,
        samesite="lax",
        path="/",
    )
    return token


def token_de_peticion(request: Request, s: Settings) -> str | None:
    token = request.cookies.get(s.cookie_sesion)
    if token:
        return token
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].strip() or None
    return None


def validar_sesion(db: Session, token: str, s: Settings) -> Sesion | None:
    """Devuelve la sesión si sigue viva; si expiró o la cuenta se revocó, la cierra."""
    sesion = db.scalar(
        select(Sesion).where(Sesion.token_hash == hash_token(token), Sesion.revocada_en.is_(None))
    )
    if sesion is None:
        return None

    momento = ahora()
    vencida = momento - sesion.ultima_actividad > plazo_inactividad(sesion.usuario.rol, s)
    if vencida or not sesion.usuario.activo:
        sesion.revocada_en = momento
        db.commit()  # el cierre persiste aunque la petición termine en 401
        return None

    if momento - sesion.ultima_actividad > _RESOLUCION_ACTIVIDAD:
        sesion.ultima_actividad = momento
    return sesion


def revocar_sesiones_de(db: Session, usuario_id: uuid.UUID) -> None:
    db.execute(
        update(Sesion)
        .where(Sesion.usuario_id == usuario_id, Sesion.revocada_en.is_(None))
        .values(revocada_en=ahora())
    )
