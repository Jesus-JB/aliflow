"""RF-04 (cuentas del propio local) y RF-06 (cada rol restringido a su ámbito)."""

from sqlalchemy import text

from tests.conftest import entrar


def _crear(c, **datos):
    return c.post("/proveedor/cuentas", json=datos)


def test_rf04_c1_varias_cuentas_de_cada_rol_activas(mundo):
    c = entrar(None, mundo.gerente_a.email)
    assert _crear(c, nombre="G2", email="g2@x.ec", rol="PROVEEDOR").status_code == 201
    assert (
        _crear(
            c, nombre="O2", email="o2@x.ec", rol="OPERADOR", punto_entrega_id=str(mundo.punto_a.id)
        ).status_code
        == 201
    )
    roles = [x["rol"] for x in c.get("/proveedor/cuentas").json()]
    assert roles.count("ADMINISTRADOR") == 2 and roles.count("OPERADOR") == 2


def test_rf04_la_cuenta_creada_puede_entrar_con_la_clave_temporal(mundo):
    c = entrar(None, mundo.gerente_a.email)
    clave = _crear(
        c, nombre="O2", email="o2@x.ec", rol="OPERADOR", punto_entrega_id=str(mundo.punto_a.id)
    ).json()["password_temporal"]
    assert entrar(None, "o2@x.ec", clave).get("/auth/me").json()["destino"] == "/operador"


def test_rf04_c2_no_ve_cuentas_de_otro_local(mundo):
    c = entrar(None, mundo.gerente_a.email)
    emails = {x["email"] for x in c.get("/proveedor/cuentas").json()}
    assert mundo.gerente_b.email not in emails and mundo.operador_b.email not in emails


def test_rf04_c2_no_puede_crear_superadmin(mundo, db):
    c = entrar(None, mundo.gerente_a.email)
    for rol in ("SUPERADMIN", "ESTUDIANTE"):
        assert _crear(c, nombre="X", email="x@x.ec", rol=rol).status_code == 422
    assert db.scalar(text("SELECT count(*) FROM usuario WHERE email='x@x.ec'")) == 0


def test_rf04_c2_no_puede_usar_punto_de_entrega_de_otro_local(mundo):
    c = entrar(None, mundo.gerente_a.email)
    r = _crear(
        c, nombre="O", email="o@x.ec", rol="OPERADOR", punto_entrega_id=str(mundo.punto_b.id)
    )
    assert r.status_code == 404


def test_rf04_c2_no_puede_revocar_ni_restablecer_cuentas_de_otro_local(mundo, db):
    c = entrar(None, mundo.gerente_a.email)
    for accion in ("revocar", "restablecer"):
        assert c.post(f"/proveedor/cuentas/{mundo.operador_b.id}/{accion}").status_code == 404
    assert (
        db.scalar(text("SELECT activo FROM usuario WHERE id = :i"), {"i": mundo.operador_b.id})
        is True
    )


def test_rf04_c3_revocar_corta_las_sesiones_activas(mundo):
    operador = entrar(None, mundo.operador_a.email)
    assert operador.get("/auth/me").status_code == 200
    gerente = entrar(None, mundo.gerente_a.email)
    assert gerente.post(f"/proveedor/cuentas/{mundo.operador_a.id}/revocar").status_code == 200
    assert operador.get("/auth/me").status_code == 401


def test_rf04_restablecer_invalida_la_clave_anterior(mundo):
    from tests.conftest import PASSWORD

    gerente = entrar(None, mundo.gerente_a.email)
    nueva = gerente.post(f"/proveedor/cuentas/{mundo.operador_a.id}/restablecer").json()
    from fastapi.testclient import TestClient

    from aliflow.main import crear_app

    r = TestClient(crear_app()).post(
        "/auth/login", json={"email": mundo.operador_a.email, "password": PASSWORD}
    )
    assert r.status_code == 401
    assert entrar(None, mundo.operador_a.email, nueva["password_temporal"])


def test_rf06_c1_recurso_ajeno_responde_igual_que_inexistente(mundo):
    import uuid

    c = entrar(None, mundo.gerente_a.email)
    ajeno = c.post(f"/proveedor/cuentas/{mundo.operador_b.id}/restablecer")
    inexistente = c.post(f"/proveedor/cuentas/{uuid.uuid4()}/restablecer")
    assert ajeno.status_code == inexistente.status_code == 404
    assert ajeno.json() == inexistente.json()


def test_rf06_c2_solo_superadmin_cruza_locales_y_queda_auditado(mundo, db):
    gerente = entrar(None, mundo.gerente_a.email)
    assert gerente.get(f"/admin/proveedores/{mundo.local_b.id}/cuentas").status_code == 403

    admin = entrar(None, mundo.superadmin.email)
    r = admin.get(f"/admin/proveedores/{mundo.local_b.id}/cuentas")
    assert r.status_code == 200
    assert {x["email"] for x in r.json()} == {mundo.gerente_b.email, mundo.operador_b.email}
    assert (
        db.scalar(
            text(
                "SELECT count(*) FROM registro_auditoria WHERE accion='CONSULTA_CRUZADA' "
                "AND entidad_id = :p"
            ),
            {"p": mundo.local_b.id},
        )
        == 1
    )


def test_auditoria_es_inmutable(mundo, db):
    import pytest
    from sqlalchemy.exc import DBAPIError

    entrar(None, mundo.gerente_a.email)
    with pytest.raises(DBAPIError, match="inmutable"):
        db.execute(text("DELETE FROM registro_auditoria"))
    db.rollback()


def test_rf06_puntos_de_entrega_solo_del_propio_local(mundo):
    c = entrar(None, mundo.gerente_a.email)
    ids = {p["id"] for p in c.get("/proveedor/puntos-entrega").json()}
    assert ids == {str(mundo.punto_a.id)}
