"""Consola del Super-Admin. En el Sprint 1 solo existe lo que demuestra RF-06 c2:
el único rol que cruza locales, y cada cruce queda en la bitácora (RN-10).
El resto del módulo H llega en el Sprint 6."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from aliflow.auditoria import auditar
from aliflow.db import get_db
from aliflow.deps import requiere_rol
from aliflow.models import Proveedor, Rol, Usuario
from aliflow.routers.cuentas import NO_ENCONTRADO, CuentaOut, _out, cuentas_del_local

router = APIRouter(prefix="/admin", tags=["super-admin"])

solo_superadmin = requiere_rol(Rol.SUPERADMIN)


@router.get("/proveedores/{proveedor_id}/cuentas", response_model=list[CuentaOut])
def cuentas_de_un_local(
    proveedor_id: uuid.UUID,
    yo: Usuario = Depends(solo_superadmin),
    db: Session = Depends(get_db),
):
    if db.scalar(select(Proveedor.id).where(Proveedor.id == proveedor_id)) is None:
        raise NO_ENCONTRADO
    auditar(db, yo, "CONSULTA_CRUZADA", "proveedor", proveedor_id, recurso="cuentas")
    return [_out(u) for u in cuentas_del_local(db, proveedor_id)]
