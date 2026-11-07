"""Dependencias de FastAPI para identidad y control de acceso.

El control de acceso se decide aquí, en el backend (RF-03 c3): ocultar un
enlace en la interfaz no protege nada.
"""

from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from aliflow.config import Settings, get_settings
from aliflow.db import get_db
from aliflow.models import Rol, Sesion, Usuario
from aliflow.sesiones import token_de_peticion, validar_sesion

NO_AUTENTICADO = HTTPException(status.HTTP_401_UNAUTHORIZED, "Sesión no válida o expirada")


def sesion_actual(
    request: Request,
    db: Session = Depends(get_db),
    s: Settings = Depends(get_settings),
) -> Sesion:
    token = token_de_peticion(request, s)
    sesion = validar_sesion(db, token, s) if token else None
    if sesion is None:
        raise NO_AUTENTICADO
    return sesion


def usuario_actual(sesion: Sesion = Depends(sesion_actual)) -> Usuario:
    return sesion.usuario


def requiere_rol(*roles: Rol) -> Callable[[Usuario], Usuario]:
    def _verificar(usuario: Usuario = Depends(usuario_actual)) -> Usuario:
        if usuario.rol not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Tu rol no tiene acceso a este recurso")
        return usuario

    return _verificar
