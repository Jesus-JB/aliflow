"""Mapeo ORM de las tablas que usa el Sprint 1.

El esquema lo dueña la migración SQL, no estas clases: aquí solo se declara lo
necesario para leer y escribir. Si una columna cambia, cambia primero en
migrations/sql/ y después acá.
"""

import enum
import uuid
from datetime import datetime, time

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, LargeBinary, Text, Time
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
