"""RF-04: el Proveedor gestiona las cuentas de SU local.
RF-06: todo se filtra por el local del usuario autenticado; lo ajeno es 404.
"""

import secrets
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from aliflow.auditoria import auditar
from aliflow.db import get_db
from aliflow.deps import requiere_rol
from aliflow.models import PuntoEntrega, Rol, Usuario, UsuarioProveedor
from aliflow.seguridad import hashear_password
from aliflow.sesiones import revocar_sesiones_de

router = APIRouter(prefix="/proveedor/cuentas", tags=["cuentas del local"])

solo_proveedor = requiere_rol(Rol.PROVEEDOR)

# RF-06 c1: "no encontrado" sin revelar si el recurso existe en otro local.
NO_ENCONTRADO = HTTPException(status.HTTP_404_NOT_FOUND, "No encontrado")


class CuentaOut(BaseModel):
    id: uuid.UUID
    nombre: str
    email: str
    rol: Rol
    activo: bool
    punto_entrega_id: uuid.UUID | None


class CuentaCreada(CuentaOut):
    # Se muestra una sola vez; Aliflow solo guarda su hash.
    password_temporal: str


class CuentaNueva(BaseModel):
    nombre: str = Field(min_length=1)
    email: EmailStr
    # RF-04 c2: el Proveedor no puede crear Super-Admins. El tipo ni lo admite.
    rol: Literal["PROVEEDOR", "OPERADOR"]
    punto_entrega_id: uuid.UUID | None = None


def _out(u: Usuario) -> CuentaOut:
    return CuentaOut(
        id=u.id,
        nombre=u.nombre_completo,
        email=u.email,
        rol=u.rol,
        activo=u.activo,
        punto_entrega_id=u.vinculo_local.punto_entrega_id if u.vinculo_local else None,
    )


def _password_temporal() -> str:
    return secrets.token_urlsafe(12)


def cuentas_del_local(db: Session, proveedor_id: uuid.UUID) -> list[Usuario]:
    return list(
        db.scalars(
            select(Usuario)
            .join(UsuarioProveedor, UsuarioProveedor.usuario_id == Usuario.id)
            .where(UsuarioProveedor.proveedor_id == proveedor_id)
            .order_by(Usuario.nombre_completo)
        ).unique()
    )


def _cuenta_del_local(db: Session, cuenta_id: uuid.UUID, proveedor_id: uuid.UUID) -> Usuario:
    """El filtro por local va en la consulta, no en un if posterior: así no hay
    camino en que se cargue un recurso ajeno."""
    cuenta = db.scalar(
        select(Usuario)
        .join(UsuarioProveedor, UsuarioProveedor.usuario_id == Usuario.id)
        .where(Usuario.id == cuenta_id, UsuarioProveedor.proveedor_id == proveedor_id)
    )
    if cuenta is None:
        raise NO_ENCONTRADO
    return cuenta


@router.get("", response_model=list[CuentaOut])
def listar(yo: Usuario = Depends(solo_proveedor), db: Session = Depends(get_db)):
    return [_out(u) for u in cuentas_del_local(db, yo.proveedor_id)]


class PuntoEntregaOut(BaseModel):
    id: uuid.UUID
    nombre: str
    ubicacion: str | None


puntos_router = APIRouter(prefix="/proveedor/puntos-entrega", tags=["cuentas del local"])


@puntos_router.get("", response_model=list[PuntoEntregaOut])
def listar_puntos(yo: Usuario = Depends(solo_proveedor), db: Session = Depends(get_db)):
    """Los puntos de entrega del local, para asignar Operadores (RF-04)."""
    puntos = db.scalars(
        select(PuntoEntrega)
        .where(PuntoEntrega.proveedor_id == yo.proveedor_id)
        .order_by(PuntoEntrega.nombre)
    )
    return [PuntoEntregaOut(id=p.id, nombre=p.nombre, ubicacion=p.ubicacion) for p in puntos]


@router.post("", response_model=CuentaCreada, status_code=status.HTTP_201_CREATED)
def crear(datos: CuentaNueva, yo: Usuario = Depends(solo_proveedor), db: Session = Depends(get_db)):
    rol = Rol.PROVEEDOR if datos.rol == "PROVEEDOR" else Rol.OPERADOR

    if rol is Rol.OPERADOR:
        if datos.punto_entrega_id is None:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, "El Operador necesita un punto de entrega"
            )
        punto = db.scalar(
            select(PuntoEntrega).where(
                PuntoEntrega.id == datos.punto_entrega_id,
                PuntoEntrega.proveedor_id == yo.proveedor_id,
            )
        )
        if punto is None:
            raise NO_ENCONTRADO
    elif datos.punto_entrega_id is not None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Solo el Operador se asocia a un punto de entrega"
        )

    password = _password_temporal()
    cuenta = Usuario(
        nombre_completo=datos.nombre,
        email=datos.email,
        rol=rol,
        password_hash=hashear_password(password),
    )
    db.add(cuenta)
    try:
        db.flush()
    except IntegrityError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe una cuenta con ese correo") from e

    cuenta.vinculo_local = UsuarioProveedor(
        usuario_id=cuenta.id,
        rol=rol,
        proveedor_id=yo.proveedor_id,
        punto_entrega_id=datos.punto_entrega_id,
    )
    db.flush()
    auditar(db, yo, "CREAR_CUENTA", "usuario", cuenta.id, rol=rol.value)
    return CuentaCreada(**_out(cuenta).model_dump(), password_temporal=password)


@router.post("/{cuenta_id}/revocar", response_model=CuentaOut)
def revocar(
    cuenta_id: uuid.UUID, yo: Usuario = Depends(solo_proveedor), db: Session = Depends(get_db)
):
    if cuenta_id == yo.id:
        raise HTTPException(status.HTTP_409_CONFLICT, "No puedes revocar tu propia cuenta")
    cuenta = _cuenta_del_local(db, cuenta_id, yo.proveedor_id)
    cuenta.activo = False
    # RF-04 c3: sus sesiones dejan de valer en la siguiente petición.
    revocar_sesiones_de(db, cuenta.id)
    auditar(db, yo, "REVOCAR_CUENTA", "usuario", cuenta.id)
    return _out(cuenta)


@router.post("/{cuenta_id}/restablecer", response_model=CuentaCreada)
def restablecer(
    cuenta_id: uuid.UUID, yo: Usuario = Depends(solo_proveedor), db: Session = Depends(get_db)
):
    cuenta = _cuenta_del_local(db, cuenta_id, yo.proveedor_id)
    password = _password_temporal()
    cuenta.password_hash = hashear_password(password)
    cuenta.activo = True
    revocar_sesiones_de(db, cuenta.id)
    auditar(db, yo, "RESTABLECER_CREDENCIALES", "usuario", cuenta.id)
    return CuentaCreada(**_out(cuenta).model_dump(), password_temporal=password)
