"""Autenticación: Estudiante por Google (RF-01, RF-02) y roles operativos por
credenciales propias (RF-03). Cierre de sesión (RF-05)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from aliflow import seguridad
from aliflow.auditoria import auditar
from aliflow.config import Settings, get_settings
from aliflow.db import get_db
from aliflow.deps import sesion_actual
from aliflow.models import Estudiante, Rol, Sesion, Usuario
from aliflow.sesiones import abrir_sesion, ahora

router = APIRouter(prefix="/auth", tags=["autenticación"])

# RF-03 c1: cada rol aterriza en su propia interfaz.
DESTINO_POR_ROL = {
    Rol.ESTUDIANTE: "/estudiante",
    Rol.PROVEEDOR: "/proveedor",
    Rol.OPERADOR: "/operador",
    Rol.SUPERADMIN: "/admin",
}


class UsuarioOut(BaseModel):
    id: uuid.UUID
    nombre: str
    email: str
    rol: Rol
    proveedor_id: uuid.UUID | None
    destino: str

    @classmethod
    def de(cls, u: Usuario) -> "UsuarioOut":
        return cls(
            id=u.id,
            nombre=u.nombre_completo,
            email=u.email,
            rol=u.rol,
            proveedor_id=u.proveedor_id,
            destino=DESTINO_POR_ROL[u.rol],
        )


class LoginGoogleIn(BaseModel):
    id_token: str


class LoginCredencialesIn(BaseModel):
    email: EmailStr
    password: str


def _dominio_permitido(identidad: seguridad.IdentidadGoogle, dominio: str) -> bool:
    """RF-01 c2 y c3: la decisión se toma aquí, con datos firmados por Google.

    Se exige las tres cosas: correo verificado, que el correo termine en el
    dominio, y que la cuenta pertenezca al Google Workspace de ese dominio
    (claim `hd`). Sin `hd`, una cuenta personal de Gmail registrada con un
    correo @uees.edu.ec pasaría el control del sufijo.
    """
    dominio = dominio.lower()
    return (
        identidad.email_verificado
        and identidad.email.lower().endswith("@" + dominio)
        and (identidad.dominio_hosted or "").lower() == dominio
    )


@router.post("/google", response_model=UsuarioOut)
def login_google(
    datos: LoginGoogleIn,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    s: Settings = Depends(get_settings),
) -> UsuarioOut:
    try:
        identidad = seguridad.verificar_id_token_google(datos.id_token, s.google_client_id)
    except ValueError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No se pudo verificar la cuenta") from e

    if not _dominio_permitido(identidad, s.dominio_institucional):
        # RF-01 c2: rechazo explícito y ningún perfil creado.
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            f"Solo se admiten cuentas institucionales @{s.dominio_institucional}",
        )

    # RF-02: crear el perfil una sola vez, aun si dos pestañas entran a la vez.
    # ON CONFLICT DO NOTHING vuelve idempotente el primer ingreso.
    db.execute(
        insert(Usuario)
        .values(nombre_completo=identidad.nombre, email=identidad.email, rol=Rol.ESTUDIANTE)
        .on_conflict_do_nothing(index_elements=["email"])
    )
    usuario = db.scalar(select(Usuario).where(Usuario.email == identidad.email))
    assert usuario is not None

    if usuario.rol is not Rol.ESTUDIANTE:
        # El correo pertenece a una cuenta operativa: esas entran con credenciales.
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Esta cuenta debe ingresar con usuario y contraseña"
        )
    if not usuario.activo:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "La cuenta está desactivada")

    nuevo = db.execute(
        insert(Estudiante).values(usuario_id=usuario.id).on_conflict_do_nothing()
    ).rowcount
    if nuevo:
        auditar(db, usuario, "REGISTRO_ESTUDIANTE", "usuario", usuario.id)

    abrir_sesion(db, usuario, request, response, s)
    auditar(db, usuario, "INICIO_SESION", "usuario", usuario.id, via="google")
    return UsuarioOut.de(usuario)


@router.post("/login", response_model=UsuarioOut)
def login_credenciales(
    datos: LoginCredencialesIn,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    s: Settings = Depends(get_settings),
) -> UsuarioOut:
    usuario = db.scalar(select(Usuario).where(Usuario.email == datos.email))
    # La contraseña se verifica siempre, exista o no la cuenta, para que el
    # tiempo de respuesta no revele qué correos están registrados.
    hash_guardado = usuario.password_hash if usuario else None
    valida = seguridad.verificar_password(datos.password, hash_guardado)

    if not (usuario and valida and usuario.activo and usuario.rol is not Rol.ESTUDIANTE):
        auditar(
            db,
            None,
            "INICIO_SESION_FALLIDO",
            "usuario",
            usuario.id if usuario else None,
            email=datos.email,
        )
        db.commit()  # el intento fallido queda registrado aunque respondamos 401
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Correo o contraseña incorrectos")

    abrir_sesion(db, usuario, request, response, s)
    auditar(db, usuario, "INICIO_SESION", "usuario", usuario.id, via="credenciales")
    return UsuarioOut.de(usuario)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    sesion: Sesion = Depends(sesion_actual),
    db: Session = Depends(get_db),
    s: Settings = Depends(get_settings),
) -> None:
    sesion.revocada_en = ahora()
    auditar(db, sesion.usuario, "CIERRE_SESION", "usuario", sesion.usuario_id)
    response.delete_cookie(s.cookie_sesion, path="/")


@router.get("/me", response_model=UsuarioOut)
def yo(sesion: Sesion = Depends(sesion_actual)) -> UsuarioOut:
    return UsuarioOut.de(sesion.usuario)
