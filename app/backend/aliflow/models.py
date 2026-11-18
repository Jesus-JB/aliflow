"""Mapeo ORM de las tablas que usa la aplicación.

El esquema lo dueña la migración SQL, no estas clases: aquí solo se declara lo
necesario para leer y escribir. Si una columna cambia, cambia primero en
migrations/sql/ y después acá.
"""

import enum
import uuid
from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Computed,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    LargeBinary,
    Numeric,
    Text,
    Time,
)
from sqlalchemy.dialects.postgresql import CITEXT, INET, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from aliflow.db import Base


class Rol(enum.StrEnum):
    ESTUDIANTE = "ESTUDIANTE"
    # En la base el rol Proveedor se llama ADMINISTRADOR: Negocios usa ambos
    # nombres para el mismo rol (el gerente del local).
    PROVEEDOR = "ADMINISTRADOR"
    OPERADOR = "OPERADOR"
    SUPERADMIN = "SUPERADMIN"


UUID_NUEVO = "gen_random_uuid()"

rol_enum = Enum(
    Rol, name="rol_usuario", create_type=False, values_callable=lambda e: [m.value for m in e]
)


class Proveedor(Base):
    __tablename__ = "proveedor"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    nombre_comercial: Mapped[str] = mapped_column(Text)
    ruc: Mapped[str] = mapped_column(Text, unique=True)
    activo: Mapped[bool] = mapped_column(Boolean, server_default="true")
    hora_maxima_retiro: Mapped[time] = mapped_column(Time)


class PuntoEntrega(Base):
    __tablename__ = "punto_entrega"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    proveedor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("proveedor.id"))
    nombre: Mapped[str] = mapped_column(Text)
    ubicacion: Mapped[str | None] = mapped_column(Text)


class Usuario(Base):
    __tablename__ = "usuario"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    nombre_completo: Mapped[str] = mapped_column(Text)
    email: Mapped[str] = mapped_column(CITEXT, unique=True)
    rol: Mapped[Rol] = mapped_column(rol_enum)
    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()"
    )
    activo: Mapped[bool] = mapped_column(Boolean, server_default="true")
    password_hash: Mapped[str | None] = mapped_column(Text)

    vinculo_local: Mapped["UsuarioProveedor | None"] = relationship(lazy="joined")

    @property
    def proveedor_id(self) -> uuid.UUID | None:
        """El local del usuario. None para Estudiante y Super-Admin."""
        return self.vinculo_local.proveedor_id if self.vinculo_local else None


class Estudiante(Base):
    __tablename__ = "estudiante"

    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuario.id"), primary_key=True)
    rol: Mapped[Rol] = mapped_column(rol_enum, server_default="ESTUDIANTE")
    codigo_institucional: Mapped[str | None] = mapped_column(Text, unique=True)


class UsuarioProveedor(Base):
    __tablename__ = "usuario_proveedor"

    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuario.id"), primary_key=True)
    rol: Mapped[Rol] = mapped_column(rol_enum)
    proveedor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("proveedor.id"))
    punto_entrega_id: Mapped[uuid.UUID | None] = mapped_column(UUID)


class Sesion(Base):
    __tablename__ = "sesion"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuario.id"))
    token_hash: Mapped[bytes] = mapped_column(LargeBinary, unique=True)
    creada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")
    ultima_actividad: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()"
    )
    revocada_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ip: Mapped[str | None] = mapped_column(INET)
    agente_usuario: Mapped[str | None] = mapped_column(Text)

    usuario: Mapped[Usuario] = relationship(lazy="joined")


class RegistroAuditoria(Base):
    __tablename__ = "registro_auditoria"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuario.id"))
    rol: Mapped[Rol | None] = mapped_column(rol_enum)
    accion: Mapped[str] = mapped_column(Text)
    entidad_afectada: Mapped[str] = mapped_column(Text)
    entidad_id: Mapped[uuid.UUID | None] = mapped_column(UUID)
    detalle: Mapped[dict | None] = mapped_column(JSONB)
    fecha_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")


# ─────────────────────────────────────────────────────────────────────────────
# Menú, billetera, órdenes y fidelidad (sprints 2 a 5)
# ─────────────────────────────────────────────────────────────────────────────

estado_orden = Enum("COMPRADO", "ENTREGADO", "EXPIRADO", name="estado_orden", create_type=False)
estado_codigo = Enum(
    "VALIDO", "UTILIZADO", "VENCIDO", name="estado_codigo_retiro", create_type=False
)
estado_pago = Enum("APROBADO", "PENDIENTE", "RECHAZADO", name="estado_pago", create_type=False)
estado_cartilla = Enum(
    "EN_CURSO", "COMPLETA", "CANJEADA", "EXPIRADA", name="estado_cartilla", create_type=False
)
tipo_movimiento = Enum(
    "RECARGA", "COMPRA", "REVERSO", "AJUSTE", name="tipo_movimiento", create_type=False
)


class Plato(Base):
    __tablename__ = "plato"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    proveedor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("proveedor.id"))
    nombre: Mapped[str] = mapped_column(Text)
    descripcion: Mapped[str | None] = mapped_column(Text)
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    activo: Mapped[bool] = mapped_column(Boolean, server_default="true")
    stock_erp: Mapped[int] = mapped_column(Integer, server_default="0")
    emoji: Mapped[str | None] = mapped_column(Text)


class InventarioReservado(Base):
    __tablename__ = "inventario_reservado"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    plato_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("plato.id"))
    fecha_vigencia: Mapped[date] = mapped_column(Date)
    cupo_asignado: Mapped[int] = mapped_column(Integer, server_default="0")
    cupo_consumido: Mapped[int] = mapped_column(Integer, server_default="0")
    version: Mapped[int] = mapped_column(Integer, server_default="0")


class SaldoEstablecimiento(Base):
    __tablename__ = "saldo_establecimiento"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    estudiante_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("estudiante.usuario_id"))
    proveedor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("proveedor.id"))
    monto_actual: Mapped[Decimal] = mapped_column(Numeric(10, 2), server_default="0")
    version: Mapped[int] = mapped_column(Integer, server_default="0")


class Recarga(Base):
    __tablename__ = "recarga"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    saldo_establecimiento_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("saldo_establecimiento.id")
    )
    proveedor_destino_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("proveedor.id"))
    monto_total: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    fecha_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    numero_operacion: Mapped[str] = mapped_column(Text)
    estado_transaccion: Mapped[str] = mapped_column(estado_pago)
    id_pasarela: Mapped[str] = mapped_column(Text)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuario.id"))


class Pago(Base):
    __tablename__ = "pago"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    recarga_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("recarga.id"))
    monto: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    estado: Mapped[str] = mapped_column(estado_pago)
    fecha_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    id_transaccion_pasarela: Mapped[str] = mapped_column(Text, unique=True)


class ComprobanteRecarga(Base):
    __tablename__ = "comprobante_recarga"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    recarga_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("recarga.id"), unique=True)
    fecha_emision: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Orden(Base):
    __tablename__ = "orden"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    estudiante_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("estudiante.usuario_id"))
    proveedor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("proveedor.id"))
    saldo_establecimiento_id: Mapped[uuid.UUID | None] = mapped_column(UUID)
    fecha_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    estado: Mapped[str] = mapped_column(estado_orden, server_default="COMPRADO")
    es_canje: Mapped[bool] = mapped_column(Boolean, server_default="false")
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    descuento: Mapped[Decimal] = mapped_column(Numeric(10, 2), server_default="0")
    motivo_descuento: Mapped[str | None] = mapped_column(Text)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), Computed("subtotal - descuento"))
    hora_maxima_retiro: Mapped[time] = mapped_column(Time)
    operador_id: Mapped[uuid.UUID | None] = mapped_column(UUID)
    entregado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    detalles: Mapped[list["OrdenDetalle"]] = relationship(lazy="selectin")
    codigo: Mapped["CodigoRetiro"] = relationship(lazy="joined", uselist=False)


class OrdenDetalle(Base):
    __tablename__ = "orden_detalle"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    orden_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orden.id"))
    plato_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("plato.id"))
    proveedor_id: Mapped[uuid.UUID] = mapped_column(UUID)
    cantidad: Mapped[int] = mapped_column(Integer)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    plato: Mapped[Plato] = relationship(lazy="joined")


class CodigoRetiro(Base):
    __tablename__ = "codigo_retiro"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    orden_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orden.id"), unique=True)
    proveedor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("proveedor.id"))
    valor: Mapped[str] = mapped_column(Text)
    fecha_compra: Mapped[date] = mapped_column(Date)
    fecha_expiracion: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    estado: Mapped[str] = mapped_column(estado_codigo, server_default="VALIDO")


class ComprobanteCompra(Base):
    __tablename__ = "comprobante_compra"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    orden_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orden.id"), unique=True)
    fecha_emision: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    monto_total: Mapped[Decimal] = mapped_column(Numeric(10, 2))


class MovimientoSaldo(Base):
    __tablename__ = "movimiento_saldo"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    saldo_establecimiento_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("saldo_establecimiento.id")
    )
    tipo: Mapped[str] = mapped_column(tipo_movimiento)
    monto: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    saldo_anterior: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    saldo_posterior: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    recarga_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("recarga.id"))
    orden_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("orden.id"))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    creado_por: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuario.id"))


class ProgramaFidelidad(Base):
    __tablename__ = "programa_fidelidad"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    proveedor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("proveedor.id"), unique=True)
    sellos_requeridos: Mapped[int] = mapped_column(Integer)
    descripcion_premio: Mapped[str] = mapped_column(Text)
    max_sellos_por_dia: Mapped[int] = mapped_column(Integer, server_default="1")
    vigencia_cartilla_dias: Mapped[int | None] = mapped_column(Integer)
    activo: Mapped[bool] = mapped_column(Boolean, server_default="true")


class Cartilla(Base):
    __tablename__ = "cartilla"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    programa_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("programa_fidelidad.id"))
    estudiante_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("estudiante.usuario_id"))
    sellos_acumulados: Mapped[int] = mapped_column(Integer, server_default="0")
    estado: Mapped[str] = mapped_column(estado_cartilla, server_default="EN_CURSO")
    fecha_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    fecha_expiracion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Sello(Base):
    __tablename__ = "sello"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    cartilla_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cartilla.id"))
    orden_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orden.id"), unique=True)
    fecha: Mapped[date] = mapped_column(Date)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Canje(Base):
    __tablename__ = "canje"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, server_default=UUID_NUEVO)
    cartilla_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cartilla.id"), unique=True)
    orden_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orden.id"), unique=True)
    premio_entregado: Mapped[str] = mapped_column(Text)
    fecha_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True))
