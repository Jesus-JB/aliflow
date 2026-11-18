"""Tarjeta de sellos por local (RF-32 a RF-36, RN-08, RN-12).

El sello se acredita al ENTREGAR, nunca al comprar: si fuera al comprar, el
estudiante podría llenar la tarjeta sin retirar nunca su almuerzo y el local
pagaría un premio por ventas que no ocurrieron.
"""

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from aliflow.auditoria import auditar
from aliflow.models import Canje, Cartilla, Orden, ProgramaFidelidad, Sello, Usuario
from aliflow.servicios import ErrorDeNegocio
from aliflow.servicios.compras import Item, comprar

VIGENTES = ("EN_CURSO", "COMPLETA")


@dataclass
class ResultadoSello:
    acreditado: bool
    sellos: int
    requeridos: int
    completa: bool
    motivo: str | None = None


def programa_de(db: Session, proveedor_id: uuid.UUID) -> ProgramaFidelidad | None:
    return db.scalars(
        select(ProgramaFidelidad).where(
            ProgramaFidelidad.proveedor_id == proveedor_id, ProgramaFidelidad.activo.is_(True)
        )
    ).one_or_none()


def cartilla_vigente(
    db: Session,
    programa: ProgramaFidelidad,
    estudiante_id: uuid.UUID,
    cuando: datetime,
    *,
    crear: bool = False,
    bloquear: bool = False,
) -> Cartilla | None:
    q = select(Cartilla).where(
        Cartilla.programa_id == programa.id,
        Cartilla.estudiante_id == estudiante_id,
        Cartilla.estado.in_(VIGENTES),
    )
    if bloquear:
        q = q.with_for_update()
    cartilla = db.scalars(q).one_or_none()

    # RF-36: una cartilla incompleta con caducidad vencida expira.
    if (
        cartilla is not None
        and cartilla.estado == "EN_CURSO"
        and cartilla.fecha_expiracion is not None
        and cartilla.fecha_expiracion < cuando
    ):
        cartilla.estado = "EXPIRADA"
        db.flush()
        cartilla = None

    if cartilla is None and crear:
        vence = (
            cuando + timedelta(days=programa.vigencia_cartilla_dias)
            if programa.vigencia_cartilla_dias
            else None
        )
        try:
            with db.begin_nested():
                cartilla = Cartilla(
                    programa_id=programa.id,
                    estudiante_id=estudiante_id,
                    sellos_acumulados=0,
                    estado="EN_CURSO",
                    fecha_inicio=cuando,
                    fecha_expiracion=vence,
                )
                db.add(cartilla)
                db.flush()
        except IntegrityError:
            # Otra entrega simultánea la creó primero (ux_cartilla_en_curso).
            return cartilla_vigente(db, programa, estudiante_id, cuando, bloquear=bloquear)
    return cartilla


def acreditar_sello(db: Session, orden: Orden, cuando: datetime) -> ResultadoSello | None:
    """None si el local no tiene programa activo (RF-32 c2)."""
    if orden.es_canje:  # RF-33 c4: un premio no acredita sello.
        return None
    programa = programa_de(db, orden.proveedor_id)
    if programa is None:
        return None
    cartilla = cartilla_vigente(
        db, programa, orden.estudiante_id, cuando, crear=True, bloquear=True
    )
    assert cartilla is not None
    resultado = ResultadoSello(
        acreditado=False,
        sellos=cartilla.sellos_acumulados,
        requeridos=programa.sellos_requeridos,
        completa=cartilla.estado == "COMPLETA",
    )
    if cartilla.estado == "COMPLETA":
        resultado.motivo = "La tarjeta ya está completa: falta canjear el premio"
        return resultado

    # RN-08 / RF-33 c3: tope de sellos por día, configurable por local.
    del_dia = db.scalar(
        select(func.count())
        .select_from(Sello)
        .where(Sello.cartilla_id == cartilla.id, Sello.fecha == cuando.date())
    )
    if del_dia >= programa.max_sellos_por_dia:
        resultado.motivo = "Ya recibió el sello de hoy"
        return resultado

    db.add(Sello(cartilla_id=cartilla.id, orden_id=orden.id, fecha=cuando.date(), creado_en=cuando))
    cartilla.sellos_acumulados += 1
    if cartilla.sellos_acumulados >= programa.sellos_requeridos:
        cartilla.estado = "COMPLETA"
    db.flush()
    resultado.acreditado = True
    resultado.sellos = cartilla.sellos_acumulados
    resultado.completa = cartilla.estado == "COMPLETA"
    return resultado


def canjear(
    db: Session, estudiante: Usuario, proveedor_id: uuid.UUID, plato_id: uuid.UUID, cuando: datetime
) -> Orden:
    """RF-35: el premio es una orden real con el precio del plato y un descuento
    del 100% rotulado. Descuenta cupo y genera código, pero no toca el saldo."""
    programa = programa_de(db, proveedor_id)
    if programa is None:
        raise ErrorDeNegocio(404, "Este local no tiene tarjeta de sellos")
    cartilla = cartilla_vigente(db, programa, estudiante.id, cuando)
    if cartilla is None or cartilla.estado != "COMPLETA":
        raise ErrorDeNegocio(409, "Todavía no completas la tarjeta de sellos de este local")

    orden = comprar(db, estudiante, proveedor_id, [Item(plato_id, 1)], cuando, es_canje=True)

    # RF-35 c3: el paso a CANJEADA es condicional. Un doble canje simultáneo
    # encuentra cero filas y falla sin crear la orden (se revierte todo).
    cambiadas = db.execute(
        update(Cartilla)
        .where(Cartilla.id == cartilla.id, Cartilla.estado == "COMPLETA")
        .values(estado="CANJEADA")
    ).rowcount
    if cambiadas != 1:
        raise ErrorDeNegocio(409, "Este premio ya fue canjeado")
    db.add(
        Canje(
            cartilla_id=cartilla.id,
            orden_id=orden.id,
            premio_entregado=programa.descripcion_premio,
            fecha_hora=cuando,
        )
    )
    auditar(db, estudiante, "CANJE_PREMIO", "cartilla", cartilla.id, orden_id=orden.id)
    return orden
