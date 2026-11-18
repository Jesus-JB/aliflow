"""Operación diaria: saldo por local, compra, retiro con código y tarjeta de sellos.

RF-07 a RF-36. Cada prueba nombra el criterio de aceptación que verifica.
"""

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, time, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select, text

from aliflow import seguridad
from aliflow.main import crear_app
from aliflow.models import (
    InventarioReservado,
    Plato,
    ProgramaFidelidad,
    RegistroAuditoria,
)
from aliflow.routers import estudiante as r_estudiante
from aliflow.routers import local as r_local
from aliflow.routers import operador as r_operador
from aliflow.seguridad import IdentidadGoogle
from aliflow.tiempo import zona
from tests.conftest import entrar

MEDIODIA = time(12, 0)


@pytest.fixture
def reloj(monkeypatch):
    """Fija la hora de la aplicación: las reglas dependen del día y de la hora
    máxima de retiro, y la suite no puede depender de a qué hora se corre."""
    estado = {"ahora": datetime.combine(datetime.now(zona()).date(), MEDIODIA, tzinfo=zona())}

    def ahora():
        return estado["ahora"]

    for modulo in (r_estudiante, r_operador, r_local):
        monkeypatch.setattr(modulo, "ahora", ahora)

    class Reloj:
        def poner(self, cuando: datetime):
            estado["ahora"] = cuando

        @property
        def hoy(self):
            return estado["ahora"].date()

    return Reloj()


@pytest.fixture
def estudiante(monkeypatch):
    """Cliente con sesión de estudiante. El token de Google es el propio correo."""
    monkeypatch.setattr(
        seguridad,
        "verificar_id_token_google",
        lambda token, _: IdentidadGoogle(token, token.split("@")[0], True, "uees.edu.ec"),
    )

    def nuevo(email="ana@uees.edu.ec") -> TestClient:
        c = TestClient(crear_app())
        assert c.post("/auth/google", json={"id_token": email}).status_code == 200
        return c

    return nuevo


@pytest.fixture
def menu(mundo, db, reloj):
    """Dos platos en el local A y uno en el B, con cupo para hoy."""

    def plato(local, nombre, precio, cupo):
        p = Plato(proveedor_id=local.id, nombre=nombre, precio=Decimal(precio))
        db.add(p)
        db.flush()
        db.add(InventarioReservado(plato_id=p.id, fecha_vigencia=reloj.hoy, cupo_asignado=cupo))
        db.flush()
        return p

    m = {
        "seco": plato(mundo.local_a, "Seco de pollo", "3.50", 5),
        "jugo": plato(mundo.local_a, "Jugo", "1.00", 1),
        "cafe_b": plato(mundo.local_b, "Café", "1.50", 5),
    }
    db.commit()
    return m


def recargar(c, local, monto="10.00"):
    r = c.post(f"/estudiante/locales/{local.id}/recargas", json={"monto": monto})
    assert r.status_code == 201, r.text
    return r.json()


def comprar(c, local, plato, cantidad=1):
    return c.post(
        "/estudiante/ordenes",
        json={
            "proveedor_id": str(local.id),
            "items": [{"plato_id": str(plato.id), "cantidad": cantidad}],
        },
    )


def cupo(db, plato):
    db.expire_all()
    return db.scalars(
        select(InventarioReservado).where(InventarioReservado.plato_id == plato.id)
    ).one()


# ── Billetera ────────────────────────────────────────────────────────────────


def test_rf07_c1_el_saldo_es_de_cada_local(mundo, menu, estudiante):
    c = estudiante()
    recargar(c, mundo.local_a, "10.00")
    saldos = {x["nombre"]: Decimal(x["saldo"]) for x in c.get("/estudiante/locales").json()}
    assert saldos == {"Local A": Decimal("10.00"), "Local B": Decimal("0.00")}


def test_rn13_el_saldo_de_un_local_no_paga_en_otro(mundo, menu, estudiante, db):
    c = estudiante()
    recargar(c, mundo.local_a, "10.00")
    r = comprar(c, mundo.local_b, menu["cafe_b"])
    assert r.status_code == 409
    assert "Saldo insuficiente en Local B" in r.json()["detail"]
    assert cupo(db, menu["cafe_b"]).cupo_consumido == 0


# ── Compra ───────────────────────────────────────────────────────────────────


def test_rf19_c3_la_compra_descuenta_saldo_y_cupo_y_da_codigo(mundo, menu, estudiante, db):
    c = estudiante()
    recargar(c, mundo.local_a, "10.00")
    r = comprar(c, mundo.local_a, menu["seco"], 2)
    assert r.status_code == 201, r.text
    cuerpo = r.json()
    assert Decimal(cuerpo["saldo"]) == Decimal("3.00")
    assert cuerpo["orden"]["estado"] == "COMPRADO"
    assert len(cuerpo["orden"]["codigo"]) == 6 and cuerpo["orden"]["codigo"].isdigit()
    assert cuerpo["orden"]["hora_maxima_retiro"] == "15:00"  # RF-23: la del local
    assert cupo(db, menu["seco"]).cupo_consumido == 2


def test_rf19_c2_sin_saldo_no_se_descuenta_nada_y_queda_registrado(mundo, menu, estudiante, db):
    c = estudiante()
    recargar(c, mundo.local_a, "1.00")
    r = comprar(c, mundo.local_a, menu["seco"])
    assert r.status_code == 409
    assert cupo(db, menu["seco"]).cupo_consumido == 0
    motivos = db.scalars(
        select(RegistroAuditoria.detalle["motivo"].astext).where(
            RegistroAuditoria.accion == "COMPRA_RECHAZADA"
        )
    ).all()
    assert motivos == ["SALDO"]  # RF-18 c2: se distingue de la falta de cupo


def test_rf21_cupo_1_y_cinco_compras_simultaneas_da_una_sola_venta(mundo, menu, estudiante, db):
    clientes = [estudiante(f"e{i}@uees.edu.ec") for i in range(5)]
    for c in clientes:
        recargar(c, mundo.local_a, "5.00")
    with ThreadPoolExecutor(5) as pool:
        codigos = list(
            pool.map(lambda c: comprar(c, mundo.local_a, menu["jugo"]).status_code, clientes)
        )
    assert sorted(codigos) == [201, 409, 409, 409, 409]
    assert cupo(db, menu["jugo"]).cupo_consumido == 1


def test_rf18_el_agotado_queda_como_venta_perdida_en_el_panel(mundo, menu, estudiante):
    c = estudiante()
    recargar(c, mundo.local_a, "5.00")
    assert comprar(c, mundo.local_a, menu["jugo"]).status_code == 201
    r = comprar(c, mundo.local_a, menu["jugo"])
    assert r.status_code == 409 and "agotado" in r.json()["detail"]
    panel = entrar(None, "gerente.a@x.ec").get("/proveedor/panel").json()
    jugo = next(p for p in panel["platos"] if p["nombre"] == "Jugo")
    assert jugo["perdidas_por_agotado"] == 1 and jugo["alerta"] == "Agotado"
    assert panel["rechazos_por_cupo"] == 1 and panel["ordenes"] == 1


def test_rn15_el_estudiante_ve_agotado_pero_no_cuantas_quedan(mundo, menu, estudiante):
    c = estudiante()
    recargar(c, mundo.local_a, "5.00")
    comprar(c, mundo.local_a, menu["jugo"])
    platos = c.get(f"/estudiante/locales/{mundo.local_a.id}").json()["menu"]
    jugo = next(p for p in platos if p["nombre"] == "Jugo")
    assert jugo["disponible"] is False  # se muestra, no se oculta
    assert "cupo_asignado" not in jugo and "cupo_restante" not in jugo


def test_rn03_despues_de_la_hora_maxima_no_se_vende(mundo, menu, estudiante, reloj):
    c = estudiante()
    recargar(c, mundo.local_a, "5.00")
    reloj.poner(datetime.combine(reloj.hoy, time(15, 1), tzinfo=zona()))
    r = comprar(c, mundo.local_a, menu["seco"])
    assert r.status_code == 409 and "hasta las 15:00" in r.json()["detail"]


def test_rn01_no_se_compra_un_plato_de_otro_local(mundo, menu, estudiante):
    c = estudiante()
    recargar(c, mundo.local_a, "5.00")
    assert comprar(c, mundo.local_a, menu["cafe_b"]).status_code == 404


# ── Retiro ───────────────────────────────────────────────────────────────────


@pytest.fixture
def orden(mundo, menu, estudiante):
    c = estudiante()
    recargar(c, mundo.local_a, "10.00")
    return c, comprar(c, mundo.local_a, menu["seco"]).json()["orden"]


def test_rf25_c3_el_operador_ve_la_orden_antes_de_entregar(orden):
    _, o = orden
    op = entrar(None, "op.a@x.ec")
    r = op.post("/operador/codigos/consultar", json={"codigo": o["codigo"]})
    assert r.status_code == 200
    assert r.json()["orden"]["lineas"][0]["plato"] == "Seco de pollo"
    assert r.json()["orden"]["estudiante"] == "ana"


def test_rf26_rf27_se_entrega_una_sola_vez(orden):
    _, o = orden
    op = entrar(None, "op.a@x.ec")
    r = op.post("/operador/codigos/entregar", json={"codigo": o["codigo"]})
    assert r.status_code == 200 and r.json()["orden"]["estado"] == "ENTREGADO"
    assert r.json()["orden"]["estado_codigo"] == "UTILIZADO"
    otra = op.post("/operador/codigos/entregar", json={"codigo": o["codigo"]})
    assert otra.status_code == 409 and "ya se usó" in otra.json()["detail"]  # RF-28 c1


def test_rf27_c2_dos_entregas_simultaneas_del_mismo_codigo(orden):
    _, o = orden
    ops = [entrar(None, "op.a@x.ec") for _ in range(4)]
    with ThreadPoolExecutor(4) as pool:
        codigos = list(
            pool.map(
                lambda op: (
                    op.post("/operador/codigos/entregar", json={"codigo": o["codigo"]}).status_code
                ),
                ops,
            )
        )
    assert codigos.count(200) == 1


def test_rf25_c2_el_operador_de_otro_local_no_lo_encuentra(orden):
    _, o = orden
    r = entrar(None, "op.b@x.ec").post("/operador/codigos/consultar", json={"codigo": o["codigo"]})
    assert r.status_code == 404


def test_rf28_codigo_de_ayer_es_vencido_no_inexistente(orden, reloj):
    _, o = orden
    reloj.poner(datetime.combine(reloj.hoy + timedelta(days=1), MEDIODIA, tzinfo=zona()))
    op = entrar(None, "op.a@x.ec")
    r = op.post("/operador/codigos/entregar", json={"codigo": o["codigo"]})
    assert r.status_code == 410 and "vencido" in r.json()["detail"]


def test_rf29_lo_no_retirado_expira(orden, reloj):
    c, _ = orden
    reloj.poner(datetime.combine(reloj.hoy + timedelta(days=1), MEDIODIA, tzinfo=zona()))
    estados = [(x["estado"], x["estado_codigo"]) for x in c.get("/estudiante/ordenes").json()]
    assert estados == [("EXPIRADO", "VENCIDO")]


# ── Tarjeta de sellos ────────────────────────────────────────────────────────


@pytest.fixture
def programa(mundo, db):
    db.add(
        ProgramaFidelidad(
            proveedor_id=mundo.local_a.id,
            sellos_requeridos=2,
            descripcion_premio="Un jugo gratis",
            max_sellos_por_dia=1,
        )
    )
    db.commit()


def entregar_compra(c, mundo, plato):
    o = comprar(c, mundo.local_a, plato).json()["orden"]
    return (
        entrar(None, "op.a@x.ec")
        .post("/operador/codigos/entregar", json={"codigo": o["codigo"]})
        .json()
    )


def test_rf33_el_sello_llega_al_entregar_y_respeta_el_tope_diario(
    mundo, menu, estudiante, programa
):
    c = estudiante()
    recargar(c, mundo.local_a, "20.00")
    comprar(c, mundo.local_a, menu["seco"])  # comprada y no retirada: sin sello (c1)
    assert c.get(f"/estudiante/locales/{mundo.local_a.id}").json()["cartilla"]["sellos"] == 0
    assert entregar_compra(c, mundo, menu["seco"])["sello"]["acreditado"] is True
    segunda = entregar_compra(c, mundo, menu["seco"])["sello"]
    assert segunda["acreditado"] is False and segunda["sellos"] == 1  # c3


def test_rf35_el_canje_es_descuento_del_100_y_no_toca_el_saldo(
    mundo, menu, estudiante, programa, reloj, db
):
    c = estudiante()
    recargar(c, mundo.local_a, "20.00")
    entregar_compra(c, mundo, menu["seco"])
    reloj.poner(datetime.combine(reloj.hoy + timedelta(days=1), MEDIODIA, tzinfo=zona()))
    db.add(InventarioReservado(plato_id=menu["seco"].id, fecha_vigencia=reloj.hoy, cupo_asignado=5))
    db.commit()
    entregar_compra(c, mundo, menu["seco"])
    local = c.get(f"/estudiante/locales/{mundo.local_a.id}").json()
    assert local["cartilla"]["completa"] is True
    saldo = Decimal(local["saldo"])

    r = c.post(
        f"/estudiante/locales/{mundo.local_a.id}/canje", json={"plato_id": str(menu["seco"].id)}
    )
    assert r.status_code == 201, r.text
    o = r.json()
    assert Decimal(o["subtotal"]) == Decimal("3.50") and Decimal(o["total"]) == 0  # RN-12
    assert o["motivo_descuento"] == "Premio de fidelidad" and o["es_canje"] is True
    assert Decimal(c.get(f"/estudiante/locales/{mundo.local_a.id}").json()["saldo"]) == saldo
    otra = c.post(
        f"/estudiante/locales/{mundo.local_a.id}/canje", json={"plato_id": str(menu["seco"].id)}
    )
    assert otra.status_code == 409
    canjes = db.scalar(select(func.count()).select_from(text("canje")))
    assert canjes == 1


# ── Gerente ──────────────────────────────────────────────────────────────────


def test_rf16_c1_el_cupo_no_baja_de_lo_vendido(mundo, menu, estudiante):
    c = estudiante()
    recargar(c, mundo.local_a, "10.00")
    comprar(c, mundo.local_a, menu["seco"], 2)
    g = entrar(None, "gerente.a@x.ec")
    r = g.put(f"/proveedor/platos/{menu['seco'].id}/cupo", json={"cupo_asignado": 1})
    assert r.status_code == 409
    r = g.put(f"/proveedor/platos/{menu['seco'].id}/cupo", json={"cupo_asignado": 8})
    assert r.status_code == 200 and r.json()["cupo_asignado"] == 8


def test_rf06_el_gerente_no_toca_platos_de_otro_local(mundo, menu):
    g = entrar(None, "gerente.a@x.ec")
    r = g.patch(f"/proveedor/platos/{menu['cafe_b'].id}", json={"precio": "9.99"})
    assert r.status_code == 404


def test_rn05_la_hora_de_retiro_la_fija_cada_local(mundo, menu, estudiante):
    g = entrar(None, "gerente.a@x.ec")
    assert g.patch("/proveedor/local", json={"hora_maxima_retiro": "13:30"}).status_code == 200
    c = estudiante()
    recargar(c, mundo.local_a, "10.00")
    assert comprar(c, mundo.local_a, menu["seco"]).json()["orden"]["hora_maxima_retiro"] == "13:30"


def test_estudiante_demo_solo_fuera_de_produccion(client, monkeypatch):
    from aliflow.config import get_settings

    assert client.post("/auth/estudiante-demo").status_code == 404  # sin sembrar
    monkeypatch.setattr(get_settings(), "entorno", "produccion")
    assert client.post("/auth/estudiante-demo").json()["detail"] == "Not Found"
