"""Interfaz del Proveedor (gerente del local): menú y cupos, horario, tarjeta de
sellos, pedidos del día y el panel en vivo.

Todo se filtra por el local del usuario en la consulta misma (RF-06): un plato
de otro local responde 404, igual que uno que no existe.
"""

import uuid
from datetime import date, time
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from aliflow.auditoria import auditar
from aliflow.config import get_settings
from aliflow.db import get_db
from aliflow.deps import requiere_rol
from aliflow.models import (
    InventarioReservado,
    Orden,
    OrdenDetalle,
    Plato,
    ProgramaFidelidad,
    Proveedor,
    Recarga,
    RegistroAuditoria,
    Rol,
    Usuario,
)
from aliflow.routers.vistas import OrdenOut, cupos_del_dia
from aliflow.servicios.retiro import expirar_vencidas
from aliflow.tiempo import ahora, en_zona

router = APIRouter(prefix="/proveedor", tags=["proveedor"])
solo_proveedor = requiere_rol(Rol.PROVEEDOR)

# RF-17: con este cupo restante o menos, el panel avisa.
UMBRAL_CUPO_BAJO = 3


# ── Local ────────────────────────────────────────────────────────────────────


class LocalOut(BaseModel):
    id: uuid.UUID
    nombre: str
    hora_maxima_retiro: str


class LocalIn(BaseModel):
    hora_maxima_retiro: time


def _local(db: Session, u: Usuario) -> Proveedor:
    p = db.get(Proveedor, u.proveedor_id)
    assert p is not None
    return p


@router.get("/local", response_model=LocalOut)
def ver_local(u: Usuario = Depends(solo_proveedor), db: Session = Depends(get_db)):
    p = _local(db, u)
    return LocalOut(
        id=p.id,
        nombre=p.nombre_comercial,
        hora_maxima_retiro=p.hora_maxima_retiro.strftime("%H:%M"),
    )


@router.patch("/local", response_model=LocalOut)
def editar_local(
    datos: LocalIn, u: Usuario = Depends(solo_proveedor), db: Session = Depends(get_db)
):
    """RN-05: la hora máxima de retiro es del local, no del sistema. Las órdenes
    ya emitidas conservan la hora con la que se compraron."""
    p = _local(db, u)
    anterior = p.hora_maxima_retiro
    p.hora_maxima_retiro = datos.hora_maxima_retiro.replace(second=0, microsecond=0)
    auditar(db, u, "HORA_RETIRO", "proveedor", p.id, antes=anterior, despues=p.hora_maxima_retiro)
    return ver_local(u, db)


# ── Menú y cupos ─────────────────────────────────────────────────────────────


class PlatoOut(BaseModel):
    id: uuid.UUID
    nombre: str
    descripcion: str | None
    precio: Decimal
    emoji: str | None
    activo: bool
    stock_erp: int
    cupo_asignado: int
    cupo_vendido: int


class PlatoIn(BaseModel):
    nombre: str = Field(min_length=1, max_length=80)
    descripcion: str | None = Field(default=None, max_length=200)
    precio: Decimal = Field(gt=0, decimal_places=2)
    emoji: str | None = Field(default=None, max_length=8)


class PlatoCambio(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=80)
    descripcion: str | None = Field(default=None, max_length=200)
    precio: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    emoji: str | None = Field(default=None, max_length=8)
    activo: bool | None = None


class CupoIn(BaseModel):
    cupo_asignado: int = Field(ge=0, le=1000)


def _plato(db: Session, u: Usuario, plato_id: uuid.UUID) -> Plato:
    p = db.scalars(
        select(Plato).where(Plato.id == plato_id, Plato.proveedor_id == u.proveedor_id)
    ).one_or_none()
    if p is None:
        raise HTTPException(404, "Plato no encontrado")
    return p


def _plato_out(p: Plato, cupos: dict) -> PlatoOut:
    c = cupos.get(p.id)
    return PlatoOut(
        id=p.id,
        nombre=p.nombre,
        descripcion=p.descripcion,
        precio=p.precio,
        emoji=p.emoji,
        activo=p.activo,
        stock_erp=p.stock_erp,
        cupo_asignado=c.cupo_asignado if c else 0,
        cupo_vendido=c.cupo_consumido if c else 0,
    )


@router.get("/platos", response_model=list[PlatoOut])
def platos(u: Usuario = Depends(solo_proveedor), db: Session = Depends(get_db)):
    filas = list(
        db.scalars(select(Plato).where(Plato.proveedor_id == u.proveedor_id).order_by(Plato.nombre))
    )
    cupos = cupos_del_dia(db, [p.id for p in filas], ahora().date())
    return [_plato_out(p, cupos) for p in filas]


@router.post("/platos", response_model=PlatoOut, status_code=201)
def crear_plato(
    datos: PlatoIn, u: Usuario = Depends(solo_proveedor), db: Session = Depends(get_db)
):
    p = Plato(proveedor_id=u.proveedor_id, **datos.model_dump())
    db.add(p)
    db.flush()
    auditar(db, u, "PLATO_CREADO", "plato", p.id, nombre=p.nombre, precio=p.precio)
    db.refresh(p)
    return _plato_out(p, {})


@router.patch("/platos/{plato_id}", response_model=PlatoOut)
def editar_plato(
    plato_id: uuid.UUID,
    datos: PlatoCambio,
    u: Usuario = Depends(solo_proveedor),
    db: Session = Depends(get_db),
):
    p = _plato(db, u, plato_id)
    cambios = datos.model_dump(exclude_unset=True)
    for campo, valor in cambios.items():
        setattr(p, campo, valor)
    auditar(db, u, "PLATO_EDITADO", "plato", p.id, **cambios)
    db.flush()
    return _plato_out(p, cupos_del_dia(db, [p.id], ahora().date()))


@router.put("/platos/{plato_id}/cupo", response_model=PlatoOut)
def asignar_cupo(
    plato_id: uuid.UUID,
    datos: CupoIn,
    u: Usuario = Depends(solo_proveedor),
    db: Session = Depends(get_db),
):
    """RF-16: el cupo de hoy para Aliflow. No puede quedar por debajo de lo ya
    vendido: lo impide la restricción cupo_no_sobrevendido."""
    p = _plato(db, u, plato_id)
    dia = ahora().date()
    try:
        with db.begin_nested():
            db.execute(
                insert(InventarioReservado)
                .values(plato_id=p.id, fecha_vigencia=dia, cupo_asignado=datos.cupo_asignado)
                .on_conflict_do_update(
                    index_elements=["plato_id", "fecha_vigencia"],
                    set_={
                        "cupo_asignado": datos.cupo_asignado,
                        "version": InventarioReservado.version + 1,
                    },
                )
            )
    except IntegrityError:
        vendido = cupos_del_dia(db, [p.id], dia)[p.id].cupo_consumido
        raise HTTPException(
            409, f"Hoy ya se vendieron {vendido}. El cupo no puede quedar por debajo de eso."
        ) from None
    auditar(db, u, "CUPO_ASIGNADO", "plato", p.id, fecha=dia, cupo=datos.cupo_asignado)
    db.expire_all()
    return _plato_out(p, cupos_del_dia(db, [p.id], dia))


# ── Tarjeta de sellos ────────────────────────────────────────────────────────


class FidelidadIO(BaseModel):
    activo: bool
    sellos_requeridos: int = Field(gt=0, le=50)
    descripcion_premio: str = Field(min_length=1, max_length=120)
    max_sellos_por_dia: int = Field(default=1, gt=0, le=10)
    vigencia_cartilla_dias: int | None = Field(default=None, gt=0, le=730)


@router.get("/fidelidad", response_model=FidelidadIO | None)
def ver_fidelidad(u: Usuario = Depends(solo_proveedor), db: Session = Depends(get_db)):
    p = db.scalars(
        select(ProgramaFidelidad).where(ProgramaFidelidad.proveedor_id == u.proveedor_id)
    ).one_or_none()
    return FidelidadIO.model_validate(p, from_attributes=True) if p else None


@router.put("/fidelidad", response_model=FidelidadIO)
def configurar_fidelidad(
    datos: FidelidadIO, u: Usuario = Depends(solo_proveedor), db: Session = Depends(get_db)
):
    """RF-32: cada local define sus sellos, su premio, su tope diario y su
    caducidad. Nada de esto es una constante del sistema (RN-05)."""
    db.execute(
        insert(ProgramaFidelidad)
        .values(proveedor_id=u.proveedor_id, **datos.model_dump())
        .on_conflict_do_update(index_elements=["proveedor_id"], set_=datos.model_dump())
    )
    auditar(db, u, "FIDELIDAD_CONFIGURADA", "proveedor", u.proveedor_id, **datos.model_dump())
    return datos


# ── Pedidos y panel ──────────────────────────────────────────────────────────


def _inicio_del_dia(dia: date):
    return en_zona(dia, time(0, 0))


@router.get("/ordenes", response_model=list[OrdenOut])
def ordenes_de_hoy(u: Usuario = Depends(solo_proveedor), db: Session = Depends(get_db)):
    momento = ahora()
    expirar_vencidas(db, momento, proveedor_id=u.proveedor_id)
    filas = db.scalars(
        select(Orden)
        .where(
            Orden.proveedor_id == u.proveedor_id,
            Orden.fecha_hora >= _inicio_del_dia(momento.date()),
        )
        .order_by(Orden.fecha_hora.desc())
        .limit(100)
    ).unique()
    return [OrdenOut.de(o, db.get(Usuario, o.estudiante_id)) for o in filas]


class HoraOut(BaseModel):
    hora: int
    ordenes: int


class PlatoPanel(BaseModel):
    id: uuid.UUID
    nombre: str
    emoji: str | None
    vendidos: int
    cupo_asignado: int
    cupo_restante: int
    perdidas_por_agotado: int
    alerta: str | None


class PanelOut(BaseModel):
    actualizado: str
    ventas: Decimal
    ordenes: int
    entregadas: int
    por_retirar: int
    vencidas: int
    recargas: Decimal
    canjes: int
    costo_premios: Decimal
    rechazos_por_cupo: int
    rechazos_por_saldo: int
    hora_pico: int | None
    por_hora: list[HoraOut]
    platos: list[PlatoPanel]


@router.get("/panel", response_model=PanelOut)
def panel(u: Usuario = Depends(solo_proveedor), db: Session = Depends(get_db)):
    """Lo que pasa hoy en el local, en vivo: ventas, demanda por hora, cupo por
    plato y ventas perdidas por agotado (RF-17, RF-18)."""
    momento = ahora()
    local = u.proveedor_id
    expirar_vencidas(db, momento, proveedor_id=local)
    desde = _inicio_del_dia(momento.date())
    del_dia = (Orden.proveedor_id == local, Orden.fecha_hora >= desde)

    por_estado = dict(
        db.execute(select(Orden.estado, func.count()).where(*del_dia).group_by(Orden.estado)).all()
    )
    ventas = db.scalar(
        select(func.coalesce(func.sum(Orden.total), 0)).where(*del_dia, Orden.es_canje.is_(False))
    )
    canjes, costo_premios = db.execute(
        select(func.count(), func.coalesce(func.sum(Orden.descuento), 0)).where(
            *del_dia, Orden.es_canje.is_(True)
        )
    ).one()
    recargas = db.scalar(
        select(func.coalesce(func.sum(Recarga.monto_total), 0)).where(
            Recarga.proveedor_destino_id == local,
            Recarga.fecha_hora >= desde,
            Recarga.estado_transaccion == "APROBADO",
        )
    )

    zona = get_settings().zona_horaria
    hora = func.extract("hour", func.timezone(zona, Orden.fecha_hora)).label("h")
    por_hora = [
        HoraOut(hora=int(h), ordenes=n)
        for h, n in db.execute(
            select(hora, func.count()).where(*del_dia).group_by(hora).order_by(hora)
        )
    ]
    hora_pico = max(por_hora, key=lambda x: x.ordenes).hora if por_hora else None

    rechazos = (
        select(
            RegistroAuditoria.detalle["motivo"].astext.label("motivo"),
            RegistroAuditoria.entidad_id,
            func.count().label("n"),
        )
        .where(
            RegistroAuditoria.accion == "COMPRA_RECHAZADA",
            RegistroAuditoria.detalle["proveedor_id"].astext == str(local),
            RegistroAuditoria.fecha_hora >= desde,
        )
        .group_by("motivo", RegistroAuditoria.entidad_id)
    )
    perdidas: dict[uuid.UUID, int] = {}
    por_cupo = por_saldo = 0
    for motivo, entidad, n in db.execute(rechazos):
        if motivo == "CUPO":
            por_cupo += n
            perdidas[entidad] = perdidas.get(entidad, 0) + n
        else:
            por_saldo += n

    vendidos = dict(
        db.execute(
            select(OrdenDetalle.plato_id, func.sum(OrdenDetalle.cantidad))
            .join(Orden, Orden.id == OrdenDetalle.orden_id)
            .where(*del_dia)
            .group_by(OrdenDetalle.plato_id)
        ).all()
    )
    activos = list(
        db.scalars(
            select(Plato)
            .where(Plato.proveedor_id == local, Plato.activo.is_(True))
            .order_by(Plato.nombre)
        )
    )
    cupos = cupos_del_dia(db, [p.id for p in activos], momento.date())
    filas = []
    for p in activos:
        c = cupos.get(p.id)
        asignado = c.cupo_asignado if c else 0
        restante = asignado - (c.cupo_consumido if c else 0)
        alerta = None
        if restante <= 0:
            alerta = "Agotado"
        elif restante <= UMBRAL_CUPO_BAJO:
            alerta = "Cupo bajo"
        filas.append(
            PlatoPanel(
                id=p.id,
                nombre=p.nombre,
                emoji=p.emoji,
                vendidos=int(vendidos.get(p.id, 0)),
                cupo_asignado=asignado,
                cupo_restante=restante,
                perdidas_por_agotado=perdidas.get(p.id, 0),
                alerta=alerta,
            )
        )
    filas.sort(key=lambda f: -f.vendidos)

    return PanelOut(
        actualizado=momento.strftime("%H:%M:%S"),
        ventas=ventas,
        ordenes=sum(por_estado.values()),
        entregadas=por_estado.get("ENTREGADO", 0),
        por_retirar=por_estado.get("COMPRADO", 0),
        vencidas=por_estado.get("EXPIRADO", 0),
        recargas=recargas,
        canjes=canjes,
        costo_premios=costo_premios,
        rechazos_por_cupo=por_cupo,
        rechazos_por_saldo=por_saldo,
        hora_pico=hora_pico,
        por_hora=por_hora,
        platos=filas,
    )
