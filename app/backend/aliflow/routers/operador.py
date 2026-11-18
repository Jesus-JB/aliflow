"""Interfaz del Operador: teclear el código de 6 dígitos y entregar (RF-25 a RF-28)."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from aliflow.db import get_db
from aliflow.deps import requiere_rol
from aliflow.models import Orden, Proveedor, Rol, Usuario
from aliflow.routers.vistas import OrdenOut, SelloOut, http
from aliflow.servicios import ErrorDeNegocio
from aliflow.servicios.retiro import consultar, entregar, expirar_vencidas
from aliflow.tiempo import ahora, en_zona

router = APIRouter(prefix="/operador", tags=["operador"])
solo_operador = requiere_rol(Rol.OPERADOR)


class CodigoIn(BaseModel):
    codigo: str


class ConsultaOut(BaseModel):
    orden: OrdenOut


class EntregaOut(BaseModel):
    orden: OrdenOut
    sello: SelloOut | None


def _estudiante(db: Session, orden: Orden) -> Usuario | None:
    return db.get(Usuario, orden.estudiante_id)


@router.post("/codigos/consultar", response_model=ConsultaOut)
def consultar_codigo(
    datos: CodigoIn, u: Usuario = Depends(solo_operador), db: Session = Depends(get_db)
):
    """Muestra la orden y el estado del código (VÁLIDO, UTILIZADO o VENCIDO)
    antes de entregar, para que el Operador verifique a quién entrega."""
    try:
        c = consultar(db, u, datos.codigo.strip(), ahora())
    except ErrorDeNegocio as e:
        raise http(e) from None
    return ConsultaOut(orden=OrdenOut.de(c.orden, _estudiante(db, c.orden)))


@router.post("/codigos/entregar", response_model=EntregaOut)
def entregar_codigo(
    datos: CodigoIn, u: Usuario = Depends(solo_operador), db: Session = Depends(get_db)
):
    try:
        e = entregar(db, u, datos.codigo.strip(), ahora())
    except ErrorDeNegocio as err:
        raise http(err) from None
    return EntregaOut(
        orden=OrdenOut.de(e.orden, _estudiante(db, e.orden)), sello=SelloOut.de(e.sello)
    )


class TurnoOut(BaseModel):
    local: str
    pendientes: int
    entregadas: int
    ultimas: list[OrdenOut]


@router.get("/turno", response_model=TurnoOut)
def turno(u: Usuario = Depends(solo_operador), db: Session = Depends(get_db)):
    """Lo que el Operador necesita a la vista: cuánto falta entregar hoy y lo
    último que entregó el local."""
    momento = ahora()
    expirar_vencidas(db, momento, proveedor_id=u.proveedor_id)
    desde = en_zona(momento.date(), momento.time().replace(hour=0, minute=0, second=0))
    del_dia = (Orden.proveedor_id == u.proveedor_id, Orden.fecha_hora >= desde)

    def contar(estado: str) -> int:
        return db.scalar(
            select(func.count()).select_from(Orden).where(*del_dia, Orden.estado == estado)
        )

    ultimas = db.scalars(
        select(Orden)
        .where(*del_dia, Orden.estado == "ENTREGADO")
        .order_by(Orden.entregado_en.desc())
        .limit(8)
    ).unique()
    local = db.get(Proveedor, u.proveedor_id)
    return TurnoOut(
        local=local.nombre_comercial if local else "",
        pendientes=contar("COMPRADO"),
        entregadas=contar("ENTREGADO"),
        ultimas=[OrdenOut.de(o, _estudiante(db, o)) for o in ultimas],
    )
