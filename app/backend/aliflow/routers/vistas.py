"""Formas de respuesta compartidas entre los routers de la operación."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from aliflow.models import InventarioReservado, Orden, Plato, Usuario
from aliflow.servicios import ErrorDeNegocio
from aliflow.servicios.fidelidad import ResultadoSello


def http(e: ErrorDeNegocio) -> HTTPException:
    return HTTPException(e.codigo, e.mensaje)


class LineaOut(BaseModel):
    plato: str
    emoji: str | None
    cantidad: int
    precio_unitario: Decimal


class OrdenOut(BaseModel):
    id: uuid.UUID
    numero: str
    proveedor_id: uuid.UUID
    estado: str
    codigo: str
    estado_codigo: str
    fecha_hora: datetime
    hora_maxima_retiro: str
    subtotal: Decimal
    descuento: Decimal
    motivo_descuento: str | None
    total: Decimal
    es_canje: bool
    entregado_en: datetime | None
    lineas: list[LineaOut]
    estudiante: str | None = None

    @classmethod
    def de(cls, o: Orden, estudiante: Usuario | None = None) -> "OrdenOut":
        return cls(
            id=o.id,
            numero=numero_orden(o.id),
            proveedor_id=o.proveedor_id,
            estado=o.estado,
            codigo=o.codigo.valor,
            estado_codigo=o.codigo.estado,
            fecha_hora=o.fecha_hora,
            hora_maxima_retiro=o.hora_maxima_retiro.strftime("%H:%M"),
            subtotal=o.subtotal,
            descuento=o.descuento,
            motivo_descuento=o.motivo_descuento,
            total=o.total,
            es_canje=o.es_canje,
            entregado_en=o.entregado_en,
            lineas=[
                LineaOut(
                    plato=d.plato.nombre,
                    emoji=d.plato.emoji,
                    cantidad=d.cantidad,
                    precio_unitario=d.precio_unitario,
                )
                for d in o.detalles
            ],
            estudiante=nombre_corto(estudiante.nombre_completo) if estudiante else None,
        )


class SelloOut(BaseModel):
    acreditado: bool
    sellos: int
    requeridos: int
    completa: bool
    motivo: str | None

    @classmethod
    def de(cls, r: ResultadoSello | None) -> "SelloOut | None":
        return cls(**r.__dict__) if r else None


def numero_orden(orden_id: uuid.UUID) -> str:
    """Identificador corto para hablar de una orden en el mostrador."""
    return f"A-{orden_id.hex[:5].upper()}"


def nombre_corto(nombre: str) -> str:
    """Nombre e inicial del apellido: suficiente para entregar, sin exponer más."""
    partes = nombre.split()
    if len(partes) < 2:
        return nombre
    return f"{partes[0]} {partes[1][0]}."


def cupos_del_dia(db: Session, plato_ids: list[uuid.UUID], dia: date) -> dict:
    filas = db.scalars(
        select(InventarioReservado).where(
            InventarioReservado.plato_id.in_(plato_ids), InventarioReservado.fecha_vigencia == dia
        )
    )
    return {f.plato_id: f for f in filas}


def disponible(plato: Plato, cupos: dict) -> bool:
    """RN-15: al estudiante solo se le dice si hay o no, nunca cuántas quedan."""
    c = cupos.get(plato.id)
    return c is not None and c.cupo_consumido < c.cupo_asignado
