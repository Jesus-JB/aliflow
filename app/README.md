# Aliflow — aplicación

El producto real, construido contra la especificación de `Entregables/`. El
prototipo de `Entregables/mockups/prototipo-web/` sigue siendo la referencia
visual, pero **esto** es lo que va a producción.

| Parte | Tecnología | Carpeta |
|---|---|---|
| API | FastAPI · SQLAlchemy 2 · Alembic · Python 3.12+ | `backend/` |
| Web | Next.js 16 · React 19 · Tailwind 4 · TypeScript | `frontend/` |
| Base de datos | PostgreSQL 16 | migraciones en `backend/migrations/` |

Es el stack que fijan los diagramas de componentes y de despliegue (entregable 02).

---

## Levantarlo

### Con Docker (lo más simple)

```bash
cd app
docker compose up --build
docker compose exec api python -m aliflow.cli sembrar-demo   # datos de prueba
```

Web en http://localhost:3000 · documentación de la API en http://localhost:8000/docs

### Sin Docker (para desarrollar)

```bash
# Base de datos: cualquier PostgreSQL 15+ con una base vacía "aliflow".

# API
cd app/backend
python3 -m venv .venv && .venv/bin/pip install -e ".[dev]"
cp .env.example .env                     # y ajustar ALIFLOW_DATABASE_URL
.venv/bin/alembic upgrade head
.venv/bin/python -m aliflow.cli sembrar-demo
.venv/bin/uvicorn aliflow.main:app --reload

# Web (otra terminal)
cd app/frontend
npm install
cp .env.example .env.local
npm run dev
```

`sembrar-demo` crea un local de prueba con un Proveedor, un Operador y un
Super-Admin. Sus correos se imprimen al correrlo. **Nunca se corre contra producción.**

### Pruebas

```bash
cd app/backend
ALIFLOW_TEST_DATABASE_URL=postgresql+psycopg://usuario@localhost:5432/aliflow_test .venv/bin/pytest
scripts/probar-restricciones.sh postgresql://usuario@localhost:5432/una_base_vacia
```

Las pruebas corren contra **PostgreSQL real**: buena parte de las reglas de
negocio vive en restricciones de la base, y probarlas contra otro motor no
probaría nada. Cada archivo de `tests/` se nombra por los requerimientos que
cubre, y cada prueba por el criterio de aceptación que verifica.

La integración continua (`.github/workflows/ci-app.yml`) corre todo esto en
cada push que toque `app/`.

---

## Ambiente de demostración

Para que Negocios y el cliente la vean funcionando. **No es producción**: los
datos son de prueba y la web lo dice en una franja arriba.

| Parte | Dónde | Plan |
|---|---|---|
| Web | https://aliflow-uees.vercel.app — proyecto Vercel `aliflow`, raíz `app/frontend` | Hobby (gratis) |
| API | https://aliflow-api.vercel.app — proyecto Vercel `aliflow-api`, raíz `app/backend`, entrada `index.py` | Hobby (gratis) |
| Base de datos | Neon (PostgreSQL 18, `us-east-1`), creada desde el Marketplace de Vercel | Free |

La web llama a la API por la misma reescritura `/api/*` que en desarrollo
(`ALIFLOW_API_URL` apunta a la API). Variables configuradas en Vercel:

- **API:** `ALIFLOW_DATABASE_URL` (la pone Neon), `ALIFLOW_ENTORNO=demo`, `ALIFLOW_COOKIE_SEGURA=true`.
- **Web:** `ALIFLOW_API_URL`, `NEXT_PUBLIC_ALIFLOW_DEMO=1`, `NEXT_PUBLIC_DOMINIO_INSTITUCIONAL`.

Cada push a `main` redespliega el proyecto cuya carpeta cambió. **Las migraciones
no corren solas** (Vercel no tiene dónde correrlas antes de levantar la API): si
un sprint agrega una, hay que aplicarla a mano contra la URL sin pooler
(`ALIFLOW_DATABASE_URL_UNPOOLED`, se obtiene con `vercel env pull`):

```bash
cd app/backend
ALIFLOW_DATABASE_URL='<url sin pooler>' .venv/bin/alembic upgrade head
```

Las cuentas de prueba se sembraron con `sembrar-demo --password <clave>`; la
clave se comparte por fuera del repositorio.

---

## Configurar el ingreso con Google (RF-01)

Sin esto el botón de estudiante muestra un aviso y solo funciona el ingreso del
personal.

1. En [Google Cloud Console](https://console.cloud.google.com/) → *APIs y servicios* → *Credenciales* → **Crear ID de cliente de OAuth**, tipo *Aplicación web*.
2. En *Orígenes autorizados de JavaScript* agregar `http://localhost:3000` y el dominio de producción.
3. Copiar el client ID en `ALIFLOW_GOOGLE_CLIENT_ID` (backend) y `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend).
4. **Para producción hace falta que TI de la UEES autorice la aplicación** en el Google Workspace de la universidad. Sin eso, los estudiantes pueden ver una pantalla de "app no verificada" o un bloqueo, según la política del dominio.

El backend acepta a un estudiante solo si se cumplen tres condiciones: el correo
está verificado, termina en `@uees.edu.ec` y la cuenta pertenece al Workspace de
la UEES (claim `hd`). La tercera condición evita que alguien entre con una
cuenta personal de Gmail registrada con un correo institucional.

---

## Decisiones técnicas

**Sesiones opacas del lado del servidor, no JWT.** RF-05 exige que, tras
cerrar sesión, el token deje de aceptarse, y RF-04 que revocar una cuenta corte
sus sesiones en la siguiente petición. Un JWT no se puede invalidar antes de que
expire. La tabla `sesion` guarda solo el SHA-256 del token.

**La API vive bajo el mismo origen que la web.** Next reescribe `/api/*` hacia
el backend, así que la cookie de sesión es de primera parte, `httpOnly` y
`SameSite=Lax`, sin CORS ni cookies de terceros.

**Lo ajeno responde 404, no 403** (RF-06 c1). Pedir la cuenta de otro local da
exactamente la misma respuesta que pedir una que no existe. El filtro por local
va en la consulta SQL, no en un `if` posterior.

**El esquema lo dueña el SQL, no el ORM.** `migrations/sql/0001_esquema_base.sql`
es el DDL del entregable 04 sin cambios. Lo que el Sprint 1 necesitó agregar
está en `0002_sprint1.sql`, con el porqué de cada cambio. Las migraciones no se
autogeneran: el autogenerador no sabe producir CHECK, FK compuestas ni triggers.

**Contraseñas con Argon2id**, verificando siempre aunque el correo no exista,
para que el tiempo de respuesta no revele qué cuentas hay.

**La hora es la de Ecuador, no la del servidor.** "Hoy" y la hora máxima de
retiro se calculan en `America/Guayaquil` (`aliflow/tiempo.py`); un servidor en
UTC cambiaría de día a las 19:00.

**El cupo se descuenta con una actualización condicional** (`cupo_consumido +
n <= cupo_asignado`), respaldada por la restricción `cupo_no_sobrevendido`. Hay
una prueba con cinco compras simultáneas de la última unidad: se vende una.

**La entrega invalida el código con una actualización condicional**: dos
operadores con el mismo código a la vez dan una sola entrega (también probado).

**Lo vencido se marca al consultar.** No hace falta una tarea programada para
que el estado que se ve sea el correcto; al consultar, lo no retirado después
de la hora máxima pasa a EXPIRADO.

**El estudiante de demostración y la pasarela simulada** solo existen con
`ALIFLOW_ENTORNO` en `desarrollo`, `pruebas` o `demo`. En producción esas rutas
responden 404 y 503.

---

## Estado de la construcción

Los sprints 1 a 5 están construidos de punta a punta y se pueden probar en el
ambiente de demostración. El piloto es **solo con Barú**.

| Módulo | Estado | Qué se puede hacer |
|---|---|---|
| Ingreso y cuentas (RF-01 a RF-06) | ✅ | Personal con contraseña; estudiante con Google (falta el client ID) o con la cuenta de demostración |
| Menú y cupo reservado (RF-13 a RF-18) | ✅ | El gerente carga platos y ajusta el cupo de hoy; el estudiante ve Disponible o Agotado, nunca la cantidad |
| Saldo por local y recarga (RF-07 a RF-10) | ✅ con pasarela simulada | La recarga va a un local y solo se gasta ahí. **Falta elegir la pasarela real** |
| Compra (RF-19 a RF-24) | ✅ | Compra con saldo, código de 6 dígitos, hora máxima de retiro del local, historial |
| Retiro (RF-25 a RF-29) | ✅ | El Operador teclea el código; inexistente, ya usado y vencido se distinguen |
| Tarjeta de sellos (RF-32 a RF-36) | ✅ | Sello al entregar, tope diario, canje como descuento del 100% |
| Panel en vivo del local | ✅ | Ventas, pedidos por hora, cupo por plato con alertas y ventas perdidas por agotado; se actualiza cada 10 s |
| Integración con ERP (Contífico) | ⏳ | Esperando credenciales |
| Consola del Super-Admin | ⏳ | Sprint 6 |

La marca es la de la propuesta de Negocios de noviembre de 2026 (paleta,
Poppins e Inter, logo y "Pide antes. Sin filas."). Los colores viven en
`frontend/src/lib/tokens.ts`, con la regla de contraste explicada ahí.

### Datos de la demo

`python -m aliflow.cli sembrar-demo --reiniciar --password <clave>` deja la base
con Barú, cinco platos (el Bowl de quinua sin cupo, para mostrar un agotado),
cupo para un mes, la tarjeta de sellos (8 sellos, un almuerzo gratis) y la
estudiante de demostración con 6 de 8 sellos y saldo. `sembrar-ventas-hoy`
agrega compras del día para que el panel del local no arranque vacío; conviene
correrlo la mañana de una presentación.

La hora máxima de retiro de la demo es 21:00, para que funcione también en una
presentación por la tarde. El gerente la cambia en *Horario*.

### Pendientes conocidos

- **`npm run dev` recarga la página cada segundo** en algunos navegadores. `npm run build && npm start` funciona bien.
- **Límites de recarga** ($1 a $100) son provisionales: los define Negocios.
- **Límite de intentos de validación (RF-31).** Los intentos fallidos ya quedan auditados; falta el bloqueo temporal.
- **La contraseña temporal no obliga a cambiarse en el primer ingreso.**
- **Los gestores de contraseñas de algunos navegadores** bloquean el formulario en `http://localhost`. En el ambiente de demostración (HTTPS) no pasa.
