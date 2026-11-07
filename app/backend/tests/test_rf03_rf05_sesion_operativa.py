"""RF-03 (login operativo por rol) y RF-05 (cierre y expiración de sesión)."""

from datetime import timedelta

import pytest
from sqlalchemy import text

from tests.conftest import PASSWORD, entrar


@pytest.mark.parametrize(
    "cuenta,destino",
    [("gerente_a", "/proveedor"), ("operador_a", "/operador"), ("superadmin", "/admin")],
)
def test_rf03_c1_cada_rol_aterriza_en_su_interfaz(client, mundo, cuenta, destino):
    r = client.post(
        "/auth/login", json={"email": getattr(mundo, cuenta).email, "password": PASSWORD}
    )
    assert r.status_code == 200
    assert r.json()["destino"] == destino


def test_rf03_c2_contrasena_guardada_con_argon2(mundo, db):
    h = db.scalar(
        text("SELECT password_hash FROM usuario WHERE email = :e"), {"e": mundo.gerente_a.email}
    )
    assert h.startswith("$argon2id$")
    assert PASSWORD not in h


def test_rf03_c3_operador_rechazado_por_el_backend_en_ruta_de_proveedor(mundo):
    c = entrar(None, mundo.operador_a.email)
    assert c.get("/proveedor/cuentas").status_code == 403


def test_contrasena_incorrecta_y_correo_inexistente_dan_el_mismo_error(client, mundo):
    a = client.post("/auth/login", json={"email": mundo.gerente_a.email, "password": "mal"})
    b = client.post("/auth/login", json={"email": "nadie@x.ec", "password": "mal"})
    assert a.status_code == b.status_code == 401
    assert a.json() == b.json()


def test_intento_fallido_queda_en_auditoria(client, mundo, db):
    client.post("/auth/login", json={"email": mundo.gerente_a.email, "password": "mal"})
    assert (
        db.scalar(
            text("SELECT count(*) FROM registro_auditoria WHERE accion = 'INICIO_SESION_FALLIDO'")
        )
        == 1
    )


def test_rf05_c1_tras_cerrar_sesion_el_token_no_se_acepta(mundo):
    c = entrar(None, mundo.gerente_a.email)
    token = c.cookies.get("aliflow_sesion")
    assert c.post("/auth/logout").status_code == 204
    # Aunque alguien haya copiado el token, ya no sirve.
    from fastapi.testclient import TestClient

    from aliflow.main import crear_app

    otro = TestClient(crear_app())
    r = otro.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_rf05_c2_sesion_de_operador_inactiva_expira(mundo, db, monkeypatch):
    c = entrar(None, mundo.operador_a.email)
    assert c.get("/auth/me").status_code == 200
    # Simula 3 horas sin actividad; el plazo por defecto del Operador es 2.
    db.execute(text("UPDATE sesion SET ultima_actividad = now() - :d"), {"d": timedelta(hours=3)})
    db.commit()
    assert c.get("/auth/me").status_code == 401


def test_rf05_c2_el_plazo_es_configurable(mundo, db, monkeypatch):
    from aliflow.config import get_settings

    monkeypatch.setenv("ALIFLOW_INACTIVIDAD_OPERADOR_MIN", "600")
    get_settings.cache_clear()
    try:
        c = entrar(None, mundo.operador_a.email)
        db.execute(
            text("UPDATE sesion SET ultima_actividad = now() - :d"), {"d": timedelta(hours=3)}
        )
        db.commit()
        assert c.get("/auth/me").status_code == 200
    finally:
        get_settings.cache_clear()
