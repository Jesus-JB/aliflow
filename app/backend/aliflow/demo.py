"""Datos del ambiente de demostración: el piloto con Barú.

Los platos, los cupos y la tarjeta de sellos salen del prototipo navegable. Todo
se crea con los mismos servicios que usa la aplicación (recarga, compra,
entrega), así que los datos cumplen las mismas reglas que los reales.

Nunca se corre contra producción.
"""

from datetime import datetime, time, timedelta
from decimal import Decimal

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from aliflow.auditoria import auditar
from aliflow.config import get_settings
from aliflow.models import (
    Estudiante,
    InventarioReservado,
    Plato,
    ProgramaFidelidad,
    Proveedor,
    PuntoEntrega,
    Rol,
    Usuario,
    UsuarioProveedor,
)
from aliflow.routers.auth import EMAIL_ESTUDIANTE_DEMO
from aliflow.seguridad import hashear_password
from aliflow.servicios import ErrorDeNegocio
from aliflow.servicios.billetera import acreditar_recarga
from aliflow.servicios.compras import Item, comprar
from aliflow.servicios.retiro import entregar
from aliflow.tiempo import ahora, en_zona

# Hora máxima de retiro de la demo. Más tarde que la de un almuerzo real para
# que la demostración funcione también en una presentación por la tarde; el
# gerente la cambia desde su panel (RN-05).
HORA_MAXIMA_DEMO = time(21, 0)

PLATOS = [
    # nombre, descripción, precio, emoji, cupo diario para Aliflow, stock ERP
    (
        "Seco de pollo",
        "Pollo guisado con arroz, menestra, ensalada fresca y ají",
        "3.50",
        "🍗",
        15,
        30,
    ),
    ("Encebollado", "Caldo tradicional con atún, yuca y curtido de cebolla", "3.00", "🍜", 10, 18),
    ("Almuerzo del día", "Sopa, segundo y jugo. Cambia cada día", "3.25", "🥘", 25, 40),
    # Cupo cero a propósito: muestra cómo se ve un plato agotado (no se oculta).
    ("Bowl de quinua", "Quinua con vegetales salteados, aguacate y aderezo", "4.00", "🥗", 0, 6),
    ("Jugo natural", "Naranja o maracuyá, sin azúcar añadida", "1.00", "🧃", 30, 50),
]

# Compradores ficticios para que el panel del local tenga actividad del día.
COMPRADORES = [
    "Camila Rivas",
    "Andrés Molina",
    "Valentina Ruiz",
    "Diego Paredes",
    "María José León",
]


def reiniciar(db: Session) -> None:
    """Vacía todas las tablas de datos. TRUNCATE no dispara los triggers de
    inmutabilidad (son por fila), que es justo lo que se necesita aquí."""
    tablas = db.scalars(
        text(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' "
            "AND tablename <> 'alembic_version'"
        )
    ).all()
    db.execute(text(f"TRUNCATE {', '.join(tablas)} RESTART IDENTITY CASCADE"))


def _cuenta(db: Session, nombre: str, email: str, rol: Rol, password: str | None) -> Usuario:
    u = Usuario(
        nombre_completo=nombre,
        email=email,
        rol=rol,
        password_hash=hashear_password(password) if password else None,
    )
    db.add(u)
    db.flush()
    return u


def _estudiante(db: Session, nombre: str, email: str) -> Usuario:
    u = _cuenta(db, nombre, email, Rol.ESTUDIANTE, None)
    db.add(Estudiante(usuario_id=u.id))
    db.flush()
    return u


def sembrar(db: Session, password: str) -> dict[str, str]:
    if get_settings().es_produccion:
        raise SystemExit("La demo no se siembra en producción.")
    momento = ahora()
    hoy = momento.date()

    baru = Proveedor(
        nombre_comercial="Barú", ruc="0992345678001", hora_maxima_retiro=HORA_MAXIMA_DEMO
    )
    db.add(baru)
    db.flush()
    punto = PuntoEntrega(
        proveedor_id=baru.id, nombre="Mostrador Barú", ubicacion="Patio de comidas"
    )
    db.add(punto)
    db.flush()

    gerente = _cuenta(db, "Gerente Barú", "gerente@demo.aliflow", Rol.PROVEEDOR, password)
    operador = _cuenta(db, "Operador Barú", "operador@demo.aliflow", Rol.OPERADOR, password)
    _cuenta(db, "Admin Aliflow", "admin@demo.aliflow", Rol.SUPERADMIN, password)
    db.add(UsuarioProveedor(usuario_id=gerente.id, rol=Rol.PROVEEDOR, proveedor_id=baru.id))
    db.add(
        UsuarioProveedor(
            usuario_id=operador.id,
            rol=Rol.OPERADOR,
            proveedor_id=baru.id,
            punto_entrega_id=punto.id,
        )
    )
    db.flush()
    db.refresh(operador)

    platos: dict[str, Plato] = {}
    for nombre, desc, precio, emoji, cupo, stock in PLATOS:
        p = Plato(
            proveedor_id=baru.id,
            nombre=nombre,
            descripcion=desc,
            precio=Decimal(precio),
            emoji=emoji,
            stock_erp=stock,
        )
        db.add(p)
        db.flush()
        platos[nombre] = p
        # Una semana hacia atrás (el historial de la estudiante demo) y un mes
        # hacia adelante, para que la demo funcione cualquier día sin tocar nada.
        for d in range(-7, 31):
            db.add(
                InventarioReservado(
                    plato_id=p.id, fecha_vigencia=hoy + timedelta(days=d), cupo_asignado=cupo
                )
            )
    db.flush()

    db.add(
        ProgramaFidelidad(
            proveedor_id=baru.id,
            sellos_requeridos=8,
            descripcion_premio="Un almuerzo del día gratis",
            max_sellos_por_dia=1,
            vigencia_cartilla_dias=90,
        )
    )
    db.flush()

    # La estudiante de demostración: recargó hace una semana y retiró seis
    # almuerzos en seis días distintos, así que su tarjeta va en 6 de 8.
    ana = _estudiante(db, "Ana Morales", EMAIL_ESTUDIANTE_DEMO)
    acreditar_recarga(
        db,
        ana,
        baru,
        Decimal("30.00"),
        id_pasarela="DEMO",
        numero_operacion="SIEMBRA-ANA",
        cuando=en_zona(hoy - timedelta(days=7), time(9, 0)),
    )
    for dias in range(6, 0, -1):
        dia = hoy - timedelta(days=dias)
        orden = comprar(
            db, ana, baru.id, [Item(platos["Almuerzo del día"].id, 1)], en_zona(dia, time(12, 10))
        )
        entregar(db, operador, orden.codigo.valor, en_zona(dia, time(12, 40)))

    sembrar_ventas_de_hoy(db, baru, platos, operador, momento)
    return {"gerente": gerente.email, "operador": operador.email, "estudiante": ana.email}


def sembrar_ventas_de_hoy(
    db: Session,
    baru: Proveedor,
    platos: dict[str, Plato],
    operador: Usuario,
    momento: datetime,
) -> int:
    """Unas cuantas compras de hoy, repartidas en las últimas horas, para que el
    panel del local no arranque vacío. Las dos primeras ya se retiraron."""
    nombres = list(platos)
    hechas = 0
    for i, nombre in enumerate(COMPRADORES):
        cuando = momento - timedelta(minutes=35 * (len(COMPRADORES) - i))
        if cuando.date() != momento.date():
            continue
        email = f"comprador{i + 1}@demo.aliflow"
        u = db.scalar(select(Usuario).where(Usuario.email == email)) or _estudiante(
            db, nombre, email
        )
        try:
            acreditar_recarga(
                db,
                u,
                baru,
                Decimal("10.00"),
                id_pasarela="DEMO",
                numero_operacion=f"SIEMBRA-{momento:%Y%m%d}-{i}",
                cuando=cuando,
            )
            plato = platos[nombres[i % len(nombres)]]
            if plato.nombre == "Bowl de quinua":
                # Intento rechazado por cupo agotado: alimenta la métrica de
                # ventas perdidas (RF-18).
                auditar(
                    db,
                    u,
                    "COMPRA_RECHAZADA",
                    "plato",
                    plato.id,
                    motivo="CUPO",
                    proveedor_id=baru.id,
                )
                plato = platos["Seco de pollo"]
            orden = comprar(db, u, baru.id, [Item(plato.id, 1)], cuando)
            if i < 2:
                entregar(db, operador, orden.codigo.valor, cuando + timedelta(minutes=20))
            hechas += 1
        except ErrorDeNegocio:
            # Fuera del horario de pedidos del local: esa compra no se siembra.
            continue
    return hechas
