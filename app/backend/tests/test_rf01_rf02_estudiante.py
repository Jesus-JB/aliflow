"""RF-01 (login institucional con Google) y RF-02 (perfil en el primer ingreso)."""

import pytest
from sqlalchemy import func, select, text

from aliflow import seguridad
from aliflow.models import Estudiante, Usuario
from aliflow.seguridad import IdentidadGoogle


@pytest.fixture
def google(monkeypatch):
    """Sustituye la verificación contra Google por una identidad controlada.

    Lo que se prueba es la decisión de Aliflow sobre una identidad ya firmada;
    la verificación criptográfica la hace la librería de Google.
    """
    identidad = {"valor": None}

    def falso(token, client_id):
        if token == "token-invalido":
            raise ValueError("firma inválida")
        return identidad["valor"]

    monkeypatch.setattr(seguridad, "verificar_id_token_google", falso)

    def usar(email, hd="uees.edu.ec", verificado=True, nombre="Ana Pérez"):
        identidad["valor"] = IdentidadGoogle(email, nombre, verificado, hd)

    return usar


def test_c1_correo_institucional_crea_sesion_y_lleva_al_menu(client, google):
    google("ana.perez@uees.edu.ec")
    r = client.post("/auth/google", json={"id_token": "t"})
    assert r.status_code == 200
    assert r.json()["destino"] == "/estudiante"
    assert client.get("/auth/me").json()["email"] == "ana.perez@uees.edu.ec"


@pytest.mark.parametrize(
    "email,hd,verificado",
    [
        ("ana@gmail.com", None, True),  # otro dominio
        ("ana@uees.edu.ec", None, True),  # Gmail personal con correo @uees: sin hd
        ("ana@uees.edu.ec", "uees.edu.ec", False),  # correo no verificado
        ("ana@uees.edu.ec.evil.com", "uees.edu.ec.evil.com", True),  # sufijo engañoso
    ],
)
def test_c2_dominio_no_autorizado_se_rechaza_sin_crear_perfil(
    client, google, db, email, hd, verificado
):
    google(email, hd=hd, verificado=verificado)
    r = client.post("/auth/google", json={"id_token": "t"})
    assert r.status_code == 403
    assert "uees.edu.ec" in r.json()["detail"]
    assert db.scalar(select(func.count()).select_from(Usuario)) == 0


def test_c3_token_manipulado_no_otorga_acceso(client, google):
    r = client.post("/auth/google", json={"id_token": "token-invalido"})
    assert r.status_code == 401
    assert client.get("/auth/me").status_code == 401


def test_c4_no_se_guarda_contrasena_del_estudiante(client, google, db):
    google("ana.perez@uees.edu.ec")
    client.post("/auth/google", json={"id_token": "t"})
    assert db.scalar(text("SELECT password_hash FROM usuario")) is None


def test_rf02_c1_primer_ingreso_crea_un_perfil(client, google, db):
    google("ana.perez@uees.edu.ec")
    client.post("/auth/google", json={"id_token": "t"})
    assert db.scalar(select(func.count()).select_from(Estudiante)) == 1


def test_rf02_c2_ingresos_siguientes_no_duplican(client, google, db):
    google("ana.perez@uees.edu.ec")
    for _ in range(3):
        assert client.post("/auth/google", json={"id_token": "t"}).status_code == 200
    assert db.scalar(select(func.count()).select_from(Usuario)) == 1
    assert db.scalar(select(func.count()).select_from(Estudiante)) == 1


def test_cuenta_operativa_no_entra_por_google(client, google, mundo):
    from aliflow.models import Rol

    # El correo del gerente no es @uees en el fixture; se fuerza uno que sí lo sea.
    mundo.gerente_a.email = "gerente@uees.edu.ec"
    mundo.db.commit()
    google("gerente@uees.edu.ec")
    r = client.post("/auth/google", json={"id_token": "t"})
    assert r.status_code == 403
    assert mundo.db.get(Usuario, mundo.gerente_a.id).rol is Rol.PROVEEDOR
