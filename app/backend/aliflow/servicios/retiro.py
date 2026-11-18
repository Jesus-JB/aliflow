"""Retiro con código de 6 dígitos (RF-25 a RF-29, RN-03, RN-04).

El Operador teclea el código; no hay lector de QR en ningún punto del sistema.
La entrega invalida el código con una actualización condicional: dos intentos
casi simultáneos del mismo código dan exactamente una entrega.
"""

import uuid
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from aliflow.auditoria import auditar
from aliflow.models import CodigoRetiro, Orden, Usuario
from aliflow.servicios import ErrorDeNegocio
from aliflow.servicios.fidelidad import ResultadoSello, acreditar_sello


def expirar_vencidas(
    db: Session,
    cuando: datetime,
    *,
    proveedor_id: uuid.UUID | None = None,
    estudiante_id: uuid.UUID | None = None,
) -> int:
    """RF-29: lo no retirado hasta la hora máxima de retiro pasa a EXPIRADO y
    su código a VENCIDO. Se ejecuta al consultar, así el estado que se ve
    siempre es el correcto aunque no haya una tarea programada."""
    q = update(CodigoRetiro).where(
        CodigoRetiro.estado == "VALIDO", CodigoRetiro.fecha_expiracion < cuando
    )
    if proveedor_id:
        q = q.where(CodigoRetiro.proveedor_id == proveedor_id)
    if estudiante_id:
        q = q.where(
            CodigoRetiro.orden_id.in_(select(Orden.id).where(Orden.estudiante_id == estudiante_id))
        )
    ordenes = db.scalars(q.values(estado="VENCIDO").returning(CodigoRetiro.orden_id)).all()
    if ordenes:
        db.execute(
            update(Orden)
            .where(Orden.id.in_(ordenes), Orden.estado == "COMPRADO")
            .values(estado="EXPIRADO")
        )
        for orden_id in ordenes:
            auditar(db, None, "ORDEN_EXPIRADA", "orden", orden_id)
    return len(ordenes)


@dataclass
class Consulta:
    codigo: CodigoRetiro
    orden: Orden


def consultar(db: Session, operador: Usuario, valor: str, cuando: datetime) -> Consulta:
    """RF-25 c3: antes de entregar, el Operador ve a quién y qué entrega."""
    proveedor_id = operador.proveedor_id
    if not (len(valor) == 6 and valor.isdigit()):
        raise ErrorDeNegocio(422, "El código tiene 6 dígitos")
    expirar_vencidas(db, cuando, proveedor_id=proveedor_id)

    # Un mismo valor puede repetirse en el histórico del local; el vigente
    # manda, y si no hay vigente se informa el más reciente.
    codigo = db.scalars(
        select(CodigoRetiro)
        .where(CodigoRetiro.proveedor_id == proveedor_id, CodigoRetiro.valor == valor)
        .order_by((CodigoRetiro.estado == "VALIDO").desc(), CodigoRetiro.fecha_compra.desc())
        .limit(1)
    ).one_or_none()
    if codigo is None:
        # RF-31: cada intento fallido queda registrado con Operador e instante.
        auditar(db, operador, "CODIGO_INEXISTENTE", "codigo_retiro", None, valor=valor)
        db.commit()
        raise ErrorDeNegocio(404, f"No existe una orden con el código {valor} en este local")
    orden = db.get(Orden, codigo.orden_id)
    assert orden is not None
    return Consulta(codigo, orden)


@dataclass
class Entrega:
    orden: Orden
    sello: ResultadoSello | None


def entregar(db: Session, operador: Usuario, valor: str, cuando: datetime) -> Entrega:
    consulta = consultar(db, operador, valor, cuando)
    if consulta.codigo.estado == "UTILIZADO":
        hora = consulta.orden.entregado_en
        cuando_txt = hora.astimezone(cuando.tzinfo).strftime("%H:%M") if hora else ""
        raise ErrorDeNegocio(409, f"Este código ya se usó: la orden se entregó a las {cuando_txt}")
    if consulta.codigo.estado == "VENCIDO":
        raise ErrorDeNegocio(410, "Este código está vencido: era válido solo el día de la compra")

    # RF-27: invalidación atómica y condicional.
    usados = db.execute(
        update(CodigoRetiro)
        .where(CodigoRetiro.id == consulta.codigo.id, CodigoRetiro.estado == "VALIDO")
        .values(estado="UTILIZADO")
    ).rowcount
    if usados != 1:
        raise ErrorDeNegocio(409, "Este código acaba de usarse en otro punto de entrega")

    orden = consulta.orden
    orden.estado = "ENTREGADO"
    orden.operador_id = operador.id
    orden.entregado_en = cuando
    db.flush()
    sello = acreditar_sello(db, orden, cuando)
    auditar(
        db,
        operador,
        "ENTREGA",
        "orden",
        orden.id,
        sello=sello.acreditado if sello else "sin programa",
    )
    db.refresh(consulta.codigo)
    return Entrega(orden, sello)
