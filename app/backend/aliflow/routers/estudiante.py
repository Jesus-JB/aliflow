"""Interfaz del Estudiante: locales, menú, saldo por local, compra, órdenes y sellos."""

import secrets
import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from aliflow.config import Settings, get_settings
from aliflow.db import get_db
from aliflow.deps import requiere_rol
from aliflow.models import Orden, Plato, Proveedor, Rol, Usuario
from aliflow.routers.vistas import OrdenOut, cupos_del_dia, disponible, http
from aliflow.servicios import ErrorDeNegocio
from aliflow.servicios.billetera import acreditar_recarga, saldo_de
from aliflow.servicios.compras import Item, comprar, proveedor_activo
from aliflow.servicios.fidelidad import canjear, cartilla_vigente, programa_de
from aliflow.servicios.retiro import expirar_vencidas
from aliflow.tiempo import ahora

router = APIRouter(prefix="/estudiante", tags=["estudiante"])
solo_estudiante = requiere_rol(Rol.ESTUDIANTE)

# Pendiente de Negocios (pregunta de límites). Mientras tanto, los del taller 07.
RECARGA_MINIMA = Decimal("1.00")
RECARGA_MAXIMA = Decimal("100.00")


class LocalResumen(BaseModel):
    id: uuid.UUID
    nombre: str
    hora_maxima_retiro: str
    saldo: Decimal


class PlatoMenu(BaseModel):
    id: uuid.UUID
    nombre: str
    descripcion: str | None
    precio: Decimal
    emoji: str | None
    disponible: bool


class CartillaOut(BaseModel):
    sellos: int
    requeridos: int
    premio: str
    completa: bool
    vence: str | None
    max_sellos_por_dia: int


class LocalDetalle(LocalResumen):
    recibe_pedidos: bool
    menu: list[PlatoMenu]
    cartilla: CartillaOut | None


def _saldo(db: Session, u: Usuario, proveedor_id: uuid.UUID) -> Decimal:
    s = saldo_de(db, u.id, proveedor_id)
    return s.monto_actual if s else Decimal("0.00")


@router.get("/locales", response_model=list[LocalResumen])
def locales(u: Usuario = Depends(solo_estudiante), db: Session = Depends(get_db)):
    """RF-15 c4: solo los locales activos."""
    filas = db.scalars(
        select(Proveedor).where(Proveedor.activo.is_(True)).order_by(Proveedor.nombre_comercial)
    )
    return [
        LocalResumen(
            id=p.id,
            nombre=p.nombre_comercial,
            hora_maxima_retiro=p.hora_maxima_retiro.strftime("%H:%M"),
            saldo=_saldo(db, u, p.id),
        )
        for p in filas
    ]


@router.get("/locales/{proveedor_id}", response_model=LocalDetalle)
def local(
    proveedor_id: uuid.UUID, u: Usuario = Depends(solo_estudiante), db: Session = Depends(get_db)
):
    """RF-15 c3: menú, saldo y tarjeta de sellos del local elegido, juntos."""
    try:
        p = proveedor_activo(db, proveedor_id)
    except ErrorDeNegocio as e:
        raise http(e) from None
    momento = ahora()
    platos = list(
        db.scalars(
            select(Plato)
            .where(Plato.proveedor_id == p.id, Plato.activo.is_(True))
            .order_by(Plato.nombre)
        )
    )
    cupos = cupos_del_dia(db, [x.id for x in platos], momento.date())
    menu = [
        PlatoMenu(
            id=x.id,
            nombre=x.nombre,
            descripcion=x.descripcion,
            precio=x.precio,
            emoji=x.emoji,
            disponible=disponible(x, cupos),
        )
        for x in platos
    ]
    # RF-15 c3: un plato agotado se muestra como agotado, no se oculta (RF-15 del menú).
    menu.sort(key=lambda m: not m.disponible)

    cartilla = None
    programa = programa_de(db, p.id)
    if programa:
        c = cartilla_vigente(db, programa, u.id, momento)
        cartilla = CartillaOut(
            sellos=c.sellos_acumulados if c else 0,
            requeridos=programa.sellos_requeridos,
            premio=programa.descripcion_premio,
            completa=bool(c and c.estado == "COMPLETA"),
            vence=c.fecha_expiracion.date().isoformat() if c and c.fecha_expiracion else None,
            max_sellos_por_dia=programa.max_sellos_por_dia,
        )
    return LocalDetalle(
        id=p.id,
        nombre=p.nombre_comercial,
        hora_maxima_retiro=p.hora_maxima_retiro.strftime("%H:%M"),
        saldo=_saldo(db, u, p.id),
        recibe_pedidos=momento.time() <= p.hora_maxima_retiro,
        menu=menu,
        cartilla=cartilla,
    )


class RecargaIn(BaseModel):
    monto: Decimal = Field(gt=0, decimal_places=2)


class RecargaOut(BaseModel):
    id: uuid.UUID
    monto: Decimal
    saldo: Decimal
    numero_operacion: str
    comprobante: str


@router.post("/locales/{proveedor_id}/recargas", response_model=RecargaOut, status_code=201)
def recargar(
    proveedor_id: uuid.UUID,
    datos: RecargaIn,
    u: Usuario = Depends(solo_estudiante),
    db: Session = Depends(get_db),
    s: Settings = Depends(get_settings),
):
    """RF-08 con la pasarela de demostración. En producción esta ruta la
    reemplaza la confirmación de la pasarela real, que aún no está elegida."""
    if not s.permite_demo:
        raise HTTPException(503, "La pasarela de pagos todavía no está habilitada")
    if not RECARGA_MINIMA <= datos.monto <= RECARGA_MAXIMA:
        raise HTTPException(422, f"La recarga va de ${RECARGA_MINIMA} a ${RECARGA_MAXIMA}")
    try:
        p = proveedor_activo(db, proveedor_id)
        operacion = secrets.token_hex(6).upper()
        r = acreditar_recarga(
            db, u, p, datos.monto, id_pasarela="DEMO", numero_operacion=operacion, cuando=ahora()
        )
    except ErrorDeNegocio as e:
        raise http(e) from None
    return RecargaOut(
        id=r.id,
        monto=r.monto_total,
        saldo=_saldo(db, u, p.id),
        numero_operacion=operacion,
        comprobante="Comprobante interno sin validez tributaria",
    )


class ItemIn(BaseModel):
    plato_id: uuid.UUID
    cantidad: int = Field(default=1, ge=1, le=10)


class CompraIn(BaseModel):
    proveedor_id: uuid.UUID
    items: list[ItemIn] = Field(min_length=1)


class CompraOut(BaseModel):
    orden: OrdenOut
    saldo: Decimal


@router.post("/ordenes", response_model=CompraOut, status_code=201)
def crear_orden(
    datos: CompraIn, u: Usuario = Depends(solo_estudiante), db: Session = Depends(get_db)
):
    try:
        orden = comprar(
            db, u, datos.proveedor_id, [Item(i.plato_id, i.cantidad) for i in datos.items], ahora()
        )
    except ErrorDeNegocio as e:
        raise http(e) from None
    return CompraOut(orden=OrdenOut.de(orden), saldo=_saldo(db, u, datos.proveedor_id))


@router.get("/ordenes", response_model=list[OrdenOut])
def mis_ordenes(u: Usuario = Depends(solo_estudiante), db: Session = Depends(get_db)):
    """RF-24: historial con estado. Lo vencido se marca antes de mostrarlo."""
    expirar_vencidas(db, ahora(), estudiante_id=u.id)
    filas = db.scalars(
        select(Orden).where(Orden.estudiante_id == u.id).order_by(Orden.fecha_hora.desc()).limit(50)
    ).unique()
    return [OrdenOut.de(o) for o in filas]


class CanjeIn(BaseModel):
    plato_id: uuid.UUID


@router.post("/locales/{proveedor_id}/canje", response_model=OrdenOut, status_code=201)
def canjear_premio(
    proveedor_id: uuid.UUID,
    datos: CanjeIn,
    u: Usuario = Depends(solo_estudiante),
    db: Session = Depends(get_db),
):
    try:
        orden = canjear(db, u, proveedor_id, datos.plato_id, ahora())
    except ErrorDeNegocio as e:
        raise http(e) from None
    return OrdenOut.de(orden)
