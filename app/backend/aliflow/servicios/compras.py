"""Compra contra el cupo reservado (RF-19 a RF-23) y emisión del código de retiro.

La compra solo se confirma si pasan las dos validaciones dentro de la misma
transacción: saldo en ese local y cupo disponible. Si una falla no se descuenta
nada, y el rechazo queda registrado para el panel del local (RF-18).
"""

import secrets
import uuid
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from aliflow.auditoria import auditar
from aliflow.models import (
    CodigoRetiro,
    ComprobanteCompra,
    InventarioReservado,
    Orden,
    OrdenDetalle,
    Plato,
    Proveedor,
    Usuario,
)
from aliflow.servicios import ErrorDeNegocio
from aliflow.servicios.billetera import mover, saldo_de
from aliflow.tiempo import en_zona

MOTIVO_PREMIO = "Premio de fidelidad"


@dataclass
class Item:
    plato_id: uuid.UUID
    cantidad: int


def proveedor_activo(db: Session, proveedor_id: uuid.UUID) -> Proveedor:
    p = db.get(Proveedor, proveedor_id)
    if p is None or not p.activo:
        raise ErrorDeNegocio(404, "Ese local no existe o no está disponible")
    return p


def _rechazar(
    db: Session,
    estudiante: Usuario,
    proveedor: Proveedor,
    motivo: str,
    mensaje: str,
    plato: Plato | None = None,
) -> ErrorDeNegocio:
    """Registra el rechazo y lo confirma antes de responder: la métrica de
    ventas perdidas (RF-18) no puede depender de que la petición termine bien."""
    auditar(
        db,
        estudiante,
        "COMPRA_RECHAZADA",
        "plato" if plato else "proveedor",
        plato.id if plato else proveedor.id,
        motivo=motivo,
        proveedor_id=proveedor.id,
    )
    db.commit()
    return ErrorDeNegocio(409, mensaje)


def _emitir_codigo(db: Session, orden: Orden, proveedor: Proveedor, dia: date) -> CodigoRetiro:
    """Seis dígitos únicos entre los códigos VIGENTES del local (RN-02 del DDL:
    ux_codigo_vigente_por_local). Ante una colisión, reintenta con otro."""
    vence = en_zona(dia, proveedor.hora_maxima_retiro)
    for _ in range(20):
        valor = f"{secrets.randbelow(1_000_000):06d}"
        try:
            with db.begin_nested():
                codigo = CodigoRetiro(
                    orden_id=orden.id,
                    proveedor_id=proveedor.id,
                    valor=valor,
                    fecha_compra=dia,
                    fecha_expiracion=vence,
                )
                db.add(codigo)
                db.flush()
            return codigo
        except IntegrityError:
            continue
    raise ErrorDeNegocio(503, "No se pudo generar el código de retiro. Intenta de nuevo.")


def comprar(
    db: Session,
    estudiante: Usuario,
    proveedor_id: uuid.UUID,
    items: list[Item],
    cuando: datetime,
    *,
    es_canje: bool = False,
) -> Orden:
    if not items or any(i.cantidad <= 0 for i in items):
        raise ErrorDeNegocio(422, "La orden necesita al menos un plato")
    proveedor = proveedor_activo(db, proveedor_id)
    dia = cuando.date()

    # RN-03 / RN-05: el código vale hasta la hora máxima de retiro del local.
    # Comprar después de esa hora daría un código que nace vencido.
    if cuando.timetz().replace(tzinfo=None) > proveedor.hora_maxima_retiro:
        hora = proveedor.hora_maxima_retiro.strftime("%H:%M")
        raise ErrorDeNegocio(
            409, f"{proveedor.nombre_comercial} recibe pedidos hasta las {hora}. Vuelve mañana."
        )

    # RN-01: el filtro por local va en la consulta. Un plato de otro local no
    # existe para esta orden.
    ids = [i.plato_id for i in items]
    platos = {
        p.id: p
        for p in db.scalars(
            select(Plato).where(
                Plato.id.in_(ids), Plato.proveedor_id == proveedor.id, Plato.activo.is_(True)
            )
        )
    }
    if len(platos) != len(set(ids)):
        raise ErrorDeNegocio(404, f"Ese plato no está en el menú de {proveedor.nombre_comercial}")

    subtotal = sum((platos[i.plato_id].precio * i.cantidad for i in items), Decimal("0"))
    descuento = subtotal if es_canje else Decimal("0")

    # RF-19 c1 y RF-20: el saldo se valida dentro de la transacción, bloqueado.
    saldo = None
    if not es_canje:
        saldo = saldo_de(db, estudiante.id, proveedor.id, bloquear=True)
        if saldo is None or saldo.monto_actual < subtotal:
            raise _rechazar(
                db,
                estudiante,
                proveedor,
                "SALDO",
                f"Saldo insuficiente en {proveedor.nombre_comercial}. Recarga en este local "
                "para completar la compra.",
            )

    # RF-21: el cupo se descuenta con una actualización condicional. Dos compras
    # simultáneas de la última unidad: una actualiza la fila y la otra encuentra
    # la condición falsa. La restricción cupo_no_sobrevendido respalda lo mismo.
    tramo = db.begin_nested()
    for item in items:
        tomado = db.execute(
            update(InventarioReservado)
            .where(
                InventarioReservado.plato_id == item.plato_id,
                InventarioReservado.fecha_vigencia == dia,
                InventarioReservado.cupo_consumido + item.cantidad
                <= InventarioReservado.cupo_asignado,
            )
            .values(
                cupo_consumido=InventarioReservado.cupo_consumido + item.cantidad,
                version=InventarioReservado.version + 1,
            )
        ).rowcount
        if tomado != 1:
            tramo.rollback()
            plato = platos[item.plato_id]
            raise _rechazar(
                db, estudiante, proveedor, "CUPO", f"{plato.nombre} está agotado por hoy", plato
            )
    tramo.commit()

    orden = Orden(
        estudiante_id=estudiante.id,
        proveedor_id=proveedor.id,
        saldo_establecimiento_id=saldo.id if saldo else None,
        fecha_hora=cuando,
        estado="COMPRADO",
        es_canje=es_canje,
        subtotal=subtotal,
        descuento=descuento,
        motivo_descuento=MOTIVO_PREMIO if es_canje else None,
        hora_maxima_retiro=proveedor.hora_maxima_retiro,
    )
    db.add(orden)
    db.flush()
    for item in items:
        db.add(
            OrdenDetalle(
                orden_id=orden.id,
                plato_id=item.plato_id,
                proveedor_id=proveedor.id,
                cantidad=item.cantidad,
                precio_unitario=platos[item.plato_id].precio,
            )
        )
    _emitir_codigo(db, orden, proveedor, dia)
    db.add(
        ComprobanteCompra(orden_id=orden.id, fecha_emision=cuando, monto_total=subtotal - descuento)
    )
    if saldo is not None:
        mover(db, saldo, -subtotal, "COMPRA", estudiante, cuando, orden_id=orden.id)

    auditar(
        db,
        estudiante,
        "CANJE" if es_canje else "COMPRA",
        "orden",
        orden.id,
        proveedor_id=proveedor.id,
        total=subtotal - descuento,
    )
    db.flush()
    db.refresh(orden)
    return orden
