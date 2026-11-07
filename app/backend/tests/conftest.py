"""Las pruebas corren contra PostgreSQL real, no contra SQLite ni mocks: buena
parte de las reglas de negocio vive en restricciones de la base, y probarlas
contra otro motor no probaría nada.

La base de pruebas se indica con ALIFLOW_TEST_DATABASE_URL. Se recrea desde las
migraciones al empezar la sesión y se vacía entre pruebas.
"""

import os
from datetime import time

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

URL = os.environ.get(
    "ALIFLOW_TEST_DATABASE_URL", "postgresql+psycopg://aliflow@localhost:5432/aliflow_test"
)
os.environ["ALIFLOW_DATABASE_URL"] = URL
os.environ["ALIFLOW_ENTORNO"] = "pruebas"
os.environ["ALIFLOW_DOMINIO_INSTITUCIONAL"] = "uees.edu.ec"

from aliflow.main import crear_app  # noqa: E402
from aliflow.models import Proveedor, PuntoEntrega, Rol, Usuario, UsuarioProveedor  # noqa: E402
from aliflow.seguridad import hashear_password  # noqa: E402

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(URL)
    with eng.begin() as c:
        c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
    cfg = Config(os.path.join(BACKEND, "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(BACKEND, "migrations"))
    cfg.attributes["database_url"] = URL
    command.upgrade(cfg, "head")
    yield eng
    eng.dispose()


@pytest.fixture(autouse=True)
def limpiar(engine):
    yield
    with engine.begin() as c:
        tablas = c.scalars(
            text(
                "SELECT tablename FROM pg_tables WHERE schemaname='public' "
                "AND tablename <> 'alembic_version'"
            )
        ).all()
        # TRUNCATE no dispara los triggers por fila que vuelven inmutable la
        # auditoría, que es justo lo que se necesita para limpiar entre pruebas.
        c.execute(text(f"TRUNCATE {', '.join(tablas)} CASCADE"))


@pytest.fixture
def db(engine):
    with Session(engine, expire_on_commit=False) as s:
        yield s


@pytest.fixture
def client(engine):
    return TestClient(crear_app())


PASSWORD = "clave-de-prueba"


class Mundo:
    """Dos locales, cada uno con su gerente y su operador, y un Super-Admin."""

    def __init__(self, db: Session):
        self.db = db
        self.local_a, self.punto_a = self._local("Local A", "0990000000001")
        self.local_b, self.punto_b = self._local("Local B", "0990000000002")
        self.gerente_a = self._cuenta("gerente.a@x.ec", Rol.PROVEEDOR, self.local_a)
        self.operador_a = self._cuenta("op.a@x.ec", Rol.OPERADOR, self.local_a, self.punto_a)
        self.gerente_b = self._cuenta("gerente.b@x.ec", Rol.PROVEEDOR, self.local_b)
        self.operador_b = self._cuenta("op.b@x.ec", Rol.OPERADOR, self.local_b, self.punto_b)
        self.superadmin = self._cuenta("root@x.ec", Rol.SUPERADMIN, None)
        db.commit()

    def _local(self, nombre, ruc):
        p = Proveedor(nombre_comercial=nombre, ruc=ruc, hora_maxima_retiro=time(15))
        self.db.add(p)
        self.db.flush()
        punto = PuntoEntrega(proveedor_id=p.id, nombre="Caja")
        self.db.add(punto)
        self.db.flush()
        return p, punto

    def _cuenta(self, email, rol, local, punto=None):
        u = Usuario(
            nombre_completo=email, email=email, rol=rol, password_hash=hashear_password(PASSWORD)
        )
        self.db.add(u)
        self.db.flush()
        if local is not None:
            self.db.add(
                UsuarioProveedor(
                    usuario_id=u.id,
                    rol=rol,
                    proveedor_id=local.id,
                    punto_entrega_id=punto.id if punto else None,
                )
            )
            self.db.flush()
        return u


@pytest.fixture
def mundo(db):
    return Mundo(db)


def entrar(engine_or_client, email, password=PASSWORD) -> TestClient:
    """Devuelve un cliente nuevo con la sesión de esa cuenta abierta."""
    c = TestClient(crear_app())
    r = c.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return c
