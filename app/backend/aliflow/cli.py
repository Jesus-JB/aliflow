"""Tareas de administración por línea de comandos.

    python -m aliflow.cli crear-superadmin --email a@b.ec --nombre "Nombre"
    python -m aliflow.cli sembrar-demo

El primer Super-Admin no puede crearse desde la aplicación (nadie tiene permiso
todavía), así que nace aquí. La contraseña se pide por consola o se genera.
"""

import argparse
import getpass
import secrets
from datetime import time

from sqlalchemy.orm import Session

from aliflow.db import get_engine
from aliflow.models import Proveedor, PuntoEntrega, Rol, Usuario, UsuarioProveedor
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


def sembrar_demo() -> None:
    """Un local de demostración con una cuenta de cada rol operativo. Solo para
    desarrollo: nunca se corre contra producción."""
    with Session(get_engine()) as db, db.begin():
        local = Proveedor(
            nombre_comercial="Local Demo", ruc="0999999999001", hora_maxima_retiro=time(15, 0)
        )
        db.add(local)
        db.flush()
        punto = PuntoEntrega(proveedor_id=local.id, nombre="Caja principal")
        db.add(punto)
        db.flush()
        cuentas = [
            ("Gerente Demo", "gerente@demo.aliflow", Rol.PROVEEDOR, None),
            ("Operador Demo", "operador@demo.aliflow", Rol.OPERADOR, punto.id),
            ("Admin Demo", "admin@demo.aliflow", Rol.SUPERADMIN, None),
        ]
        for nombre, email, rol, punto_id in cuentas:
            u = Usuario(
                nombre_completo=nombre,
                email=email,
                rol=rol,
                password_hash=hashear_password("demo1234"),
            )
            db.add(u)
            db.flush()
            if rol is not Rol.SUPERADMIN:
                db.add(
                    UsuarioProveedor(
                        usuario_id=u.id, rol=rol, proveedor_id=local.id, punto_entrega_id=punto_id
                    )
                )
    print("Demo sembrada. Cuentas con contraseña demo1234:")
    for _, email, rol, _ in cuentas:
        print(f"  {rol.name:<10} {email}")


def main() -> None:
    p = argparse.ArgumentParser(prog="aliflow")
    sub = p.add_subparsers(dest="cmd", required=True)
    sa = sub.add_parser("crear-superadmin")
    sa.add_argument("--email", required=True)
    sa.add_argument("--nombre", required=True)
    sub.add_parser("sembrar-demo")
    args = p.parse_args()
    if args.cmd == "crear-superadmin":
        crear_superadmin(args.email, args.nombre)
    else:
        sembrar_demo()


if __name__ == "__main__":
    main()
