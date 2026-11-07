"""Escritura en la bitácora inmutable (RF-54, RN-10).

Se escribe en la misma transacción que la acción auditada: si la acción se
revierte, su registro también. Una bitácora que registra cosas que no pasaron
es tan poco confiable como una que omite las que sí.
"""

import uuid

from sqlalchemy.orm import Session

from aliflow.models import RegistroAuditoria, Usuario


def auditar(
    db: Session,
    actor: Usuario | None,
    accion: str,
    entidad: str,
    entidad_id: uuid.UUID | None = None,
    **detalle,
) -> None:
    db.add(
        RegistroAuditoria(
            usuario_id=actor.id if actor else None,
            rol=actor.rol if actor else None,
            accion=accion,
            entidad_afectada=entidad,
            entidad_id=entidad_id,
            detalle={k: str(v) for k, v in detalle.items()} or None,
        )
    )
