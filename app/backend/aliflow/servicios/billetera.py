"""Saldo por establecimiento (RN-13) llevado como libro de movimientos (RF-56).

El saldo pertenece al local: se recarga para un local y solo se gasta ahí. El
dinero va de la pasarela a la cuenta del local; Aliflow registra el movimiento,
no lo posee (RN-14).
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from aliflow.auditoria import auditar
from aliflow.models import (
    ComprobanteRecarga,
    MovimientoSaldo,
    Pago,
    Proveedor,
    Recarga,
    SaldoEstablecimiento,
    Usuario,
)
from aliflow.servicios import ErrorDeNegocio

CENTAVO = Decimal("0.01")


def saldo_de(
    db: Session, estudiante_id: uuid.UUID, proveedor_id: uuid.UUID, bloquear: bool = False
) -> SaldoEstablecimiento | None:
    q = select(SaldoEstablecimiento).where(
        SaldoEstablecimiento.estudiante_id == estudiante_id,
        SaldoEstablecimiento.proveedor_id == proveedor_id,
    )
    if bloquear:
        q = q.with_for_update()
    return db.scalars(q).one_or_none()


def obtener_o_crear_saldo(
    db: Session, estudiante_id: uuid.UUID, proveedor_id: uuid.UUID
) -> SaldoEstablecimiento:
    """El saldo de un local nace con la primera recarga, no al registrarse: un
    estudiante no tiene por qué tener saldo en locales donde nunca compró."""
    db.execute(
        insert(SaldoEstablecimiento)
        .values(estudiante_id=estudiante_id, proveedor_id=proveedor_id)
        .on_conflict_do_nothing(index_elements=["estudiante_id", "proveedor_id"])
    )
    saldo = saldo_de(db, estudiante_id, proveedor_id, bloquear=True)
    assert saldo is not None
    return saldo


def mover(
    db: Session,
    saldo: SaldoEstablecimiento,
    monto: Decimal,
    tipo: str,
    actor: Usuario,
    cuando: datetime,
    *,
    recarga_id: uuid.UUID | None = None,
    orden_id: uuid.UUID | None = None,
) -> MovimientoSaldo:
    """Registra un movimiento y actualiza la caché del saldo en la misma
    transacción. El saldo tiene que venir bloqueado (FOR UPDATE)."""
    anterior = saldo.monto_actual
    posterior = anterior + monto
    if posterior < 0:
        raise ErrorDeNegocio(409, "Saldo insuficiente en este establecimiento")
    mov = MovimientoSaldo(
        saldo_establecimiento_id=saldo.id,
        tipo=tipo,
        monto=monto,
        saldo_anterior=anterior,
        saldo_posterior=posterior,
        recarga_id=recarga_id,
        orden_id=orden_id,
        creado_en=cuando,
        creado_por=actor.id,
    )
    db.add(mov)
    saldo.monto_actual = posterior
    saldo.version += 1
    return mov


def acreditar_recarga(
    db: Session,
    estudiante: Usuario,
    proveedor: Proveedor,
    monto: Decimal,
    *,
    id_pasarela: str,
    numero_operacion: str,
    cuando: datetime,
) -> Recarga:
    """Acredita una recarga que la pasarela ya aprobó (RF-08, RF-09, RF-10).

    Reprocesar la misma confirmación no acredita dos veces: la restricción
    recarga_operacion_unica lo impide en la base.
    """
    monto = monto.quantize(CENTAVO)
    saldo = obtener_o_crear_saldo(db, estudiante.id, proveedor.id)
    recarga = Recarga(
        saldo_establecimiento_id=saldo.id,
        proveedor_destino_id=proveedor.id,
        monto_total=monto,
        fecha_hora=cuando,
        numero_operacion=numero_operacion,
        estado_transaccion="APROBADO",
        id_pasarela=id_pasarela,
        usuario_id=estudiante.id,
    )
    db.add(recarga)
    db.flush()
    db.add(
        Pago(
            recarga_id=recarga.id,
            monto=monto,
            estado="APROBADO",
            fecha_hora=cuando,
            id_transaccion_pasarela=f"{id_pasarela}:{numero_operacion}",
        )
    )
    db.add(ComprobanteRecarga(recarga_id=recarga.id, fecha_emision=cuando))
    mover(db, saldo, monto, "RECARGA", estudiante, cuando, recarga_id=recarga.id)
    auditar(
        db,
        estudiante,
        "RECARGA",
        "recarga",
        recarga.id,
        proveedor_id=proveedor.id,
        monto=monto,
        pasarela=id_pasarela,
    )
    return recarga
