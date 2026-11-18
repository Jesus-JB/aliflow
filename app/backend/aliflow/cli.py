"""Tareas de administración por línea de comandos.

    python -m aliflow.cli crear-superadmin --email a@b.ec --nombre "Nombre"
    python -m aliflow.cli sembrar-demo [--password CLAVE] [--reiniciar]
    python -m aliflow.cli sembrar-ventas-hoy

El primer Super-Admin no puede crearse desde la aplicación (nadie tiene permiso
todavía), así que nace aquí. La contraseña se pide por consola o se genera.
"""

import argparse
import getpass
import secrets

from sqlalchemy.orm import Session

from aliflow.config import get_settings
from aliflow.db import get_engine
from aliflow.models import Rol, Usuario
from aliflow.seguridad import hashear_password


def crear_superadmin(email: str, nombre: str) -> None:
    password = getpass.getpass("Contraseña (vacío para generar una): ") or secrets.token_urlsafe(16)
    with Session(get_engine()) as db, db.begin():
        db.add(
            Usuario(
                nombre_completo=nombre,
                email=email,
                rol=Rol.SUPERADMIN,
                password_hash=hashear_password(password),
            )
        )
    print(f"Super-Admin creado: {email}\nContraseña: {password}")


def sembrar_demo(password: str, reiniciar: bool) -> None:
    """El piloto con Barú, listo para mostrar. Con --reiniciar vacía antes la base."""
    from aliflow import demo

    if get_settings().es_produccion:
        raise SystemExit("sembrar-demo no se corre contra producción.")
    with Session(get_engine()) as db:
        if reiniciar:
            demo.reiniciar(db)
        cuentas = demo.sembrar(db, password)
        db.commit()
    print(f"Demo sembrada. Personal con contraseña {password}:")
    for rol, email in cuentas.items():
        print(f"  {rol:<10} {email}")


def sembrar_ventas_hoy() -> None:
    """Agrega compras de hoy para que el panel del local tenga actividad."""
    from sqlalchemy import select

    from aliflow import demo
    from aliflow.models import Plato, Proveedor
    from aliflow.tiempo import ahora

    if get_settings().es_produccion:
        raise SystemExit("No se corre contra producción.")
    with Session(get_engine()) as db:
        baru = db.scalars(select(Proveedor).where(Proveedor.nombre_comercial == "Barú")).one()
        platos = {
            p.nombre: p for p in db.scalars(select(Plato).where(Plato.proveedor_id == baru.id))
        }
        operador = db.scalars(select(Usuario).where(Usuario.email == "operador@demo.aliflow")).one()
        n = demo.sembrar_ventas_de_hoy(db, baru, platos, operador, ahora())
        db.commit()
    print(f"{n} compras de hoy agregadas.")


def main() -> None:
    p = argparse.ArgumentParser(prog="aliflow")
    sub = p.add_subparsers(dest="cmd", required=True)
    sa = sub.add_parser("crear-superadmin")
    sa.add_argument("--email", required=True)
    sa.add_argument("--nombre", required=True)
    sd = sub.add_parser("sembrar-demo")
    sd.add_argument("--password", default="demo1234")
    sd.add_argument("--reiniciar", action="store_true", help="vacía la base antes de sembrar")
    sub.add_parser("sembrar-ventas-hoy")
    args = p.parse_args()
    if args.cmd == "crear-superadmin":
        crear_superadmin(args.email, args.nombre)
    elif args.cmd == "sembrar-demo":
        sembrar_demo(args.password, args.reiniciar)
    else:
        sembrar_ventas_hoy()


if __name__ == "__main__":
    main()
