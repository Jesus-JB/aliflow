# Demo: Aliflow ↔ Odoo Community

Prueba de concepto de la arquitectura de integración propuesta en
`Hallazgos-Ingenieria-API-Generica.md` (patrón Adapter): `odoo_adapter.py`
implementa `IInventoryProvider` contra Odoo Community real, vía su API XML-RPC.

**Alcance de este demo:** demostrar que el flujo menú → compra → descuento de
stock → comprobante funciona técnicamente contra un Odoo real. No incluye
todavía la activación de la localización fiscal `l10n_ec` con certificado SRI
— ese hueco se deja pendiente a propósito (ver `Hallazgos-Ingenieria-API-Generica.md`),
porque por ahora es un demo técnico, no una prueba de facturación real.

## 1. Levantar Odoo

Requiere Docker y Docker Compose instalados.

```bash
cd demo-odoo
docker compose up -d
```

Espera unos segundos a que el contenedor `odoo` termine de iniciar (puedes ver
el progreso con `docker compose logs -f odoo`).

## 2. Crear la base de datos (paso manual, solo la primera vez)

Odoo no expone la creación de bases de datos por API — hay que hacerlo una vez
desde el navegador:

1. Abre `http://localhost:8069`.
2. Se abrirá el asistente de creación de base de datos. Completa:
   - **Nombre de la base de datos:** `aliflow`
   - **Email:** el que quieras usar como admin (ej. `admin@aliflow.local`)
   - **Contraseña:** la que uses en `ODOO_PASSWORD` más abajo
   - **País:** Ecuador (para dejar la localización `l10n_ec` disponible más adelante)
   - **Cargar datos de demostración:** puedes dejarlo desmarcado
3. Espera a que Odoo termine de crear la base — te dejará ya logueado.

## 3. Instalar las apps necesarias

Dentro de Odoo, ve al menú **Apps** (quita el filtro "Apps" para ver todas) e
instala:
- **Inventario** (Inventory) — necesaria para `stock.quant` / `qty_available`.
- **Facturación** (Invoicing) — necesaria para crear `account.move`.

## 4. Configurar las variables de conexión

El script usa variables de entorno con estos valores por defecto:

| Variable | Default | Debe coincidir con... |
|---|---|---|
| `ODOO_URL` | `http://localhost:8069` | la URL donde corre el contenedor |
| `ODOO_DB` | `aliflow` | el nombre de base que creaste en el paso 2 |
| `ODOO_USERNAME` | `admin` | el email que usaste como admin en el paso 2 |
| `ODOO_PASSWORD` | `admin` | la contraseña que definiste en el paso 2 |

Puedes exportarlas antes de correr el script, por ejemplo:

```bash
export ODOO_DB=aliflow
export ODOO_USERNAME=admin@aliflow.local
export ODOO_PASSWORD=tu_password
```

(Alternativa más "producción-correcta": generar una API Key en Odoo desde
Preferencias → Seguridad de la cuenta → "New API Key", y usarla en
`ODOO_PASSWORD` en vez de la contraseña real.)

## 5. Correr el demo

No requiere dependencias externas — usa `json` y `urllib.request` de la
librería estándar de Python (JSON-RPC, no XML-RPC — ver nota en la sección 6).

```bash
python3 demo.py
```

El demo corre 3 escenarios en secuencia:

- **A — Flujo normal**: carga un menú realista (4 platos, inspirados en lo que
  ofrecería Barú), consulta el menú, compra un plato, y genera la factura en
  Odoo. Es la evolución del demo original (menú → compra → comprobante).
- **B — Concurrencia real**: lanza 5 compras simultáneas (con hilos de verdad,
  no simuladas) sobre un plato con solo 3 unidades de stock, contra el dominio
  propio de Aliflow (`plato_local.py`), no contra Odoo — ver sección 6 para el
  porqué.
- **C — Patrón Outbox**: procesa un evento de sincronización contra un
  adaptador que simula a Alpwin (sin API pública), con reintentos hasta
  marcarlo `FALLIDO`.

Puedes verificar el resultado del Escenario A directamente en la interfaz de Odoo:
- **Inventario → Productos** para ver el stock actualizado.
- **Facturación → Clientes → Facturas** para ver la factura creada (en
  estado borrador — no está autorizada por el SRI, que es justo el hueco
  pendiente ya documentado).

## 6. Resultado real de correrlo (confirmado en vivo, 26-jul-2026)

El demo se corrió contra una instancia real (Odoo 17 Community, país Ecuador,
apps Inventario + Facturación) y funcionó de punta a punta: producto creado,
menú consultado, stock descontado de 20 a 19, y factura (`account.move`)
creada en Odoo. Dos hallazgos técnicos que valen la pena dejar documentados:

- **Hubo que cambiar de XML-RPC a JSON-RPC.** El método `stock.quant.action_apply_inventory`
  no retorna ningún valor (`None`), y el protocolo XML-RPC no puede transmitir
  `None` ("cannot marshal None unless allow_none is enabled") — lanza un error
  aunque la operación sí se haya aplicado correctamente en el servidor. JSON-RPC
  (mismo backend, mismo endpoint que usa el propio cliente web de Odoo) no
  tiene ese problema. `odoo_adapter.py` ya está escrito usando JSON-RPC.
- **Odoo omite la clave `result` en la respuesta JSON** cuando el método
  llamado no retorna nada — la respuesta cruda es literalmente
  `{"jsonrpc": "2.0", "id": 0}`, sin `result` ni `error`. No es un fallo, es
  el comportamiento normal para ese tipo de métodos. `_json_rpc()` lo maneja
  con `body.get("result")` en vez de `body["result"]`.

Con esto, el patrón `stock.quant` + `inventory_mode` + `action_apply_inventory`
para `set_stock` queda **confirmado como funcional**, no solo documentado por
la comunidad.

Pendiente aparte (esperado y aceptado desde el inicio, ver sección "Alcance"):
la factura queda en estado borrador, sin autorización real ante el SRI —
requeriría subir un certificado `.p12` real y no es necesario para este demo.

## 7. Hallazgo importante (27-jul-2026): el control de concurrencia no se puede delegar al ERP externo

Al implementar `OdooAdapter.reservar_stock()` (bloqueo optimista contra el
stock de Odoo vía JSON-RPC) y probarlo con 5 hilos comprando concurrentemente
con solo 3 unidades disponibles, **se vendieron las 5** — el mecanismo de
"releer antes de escribir" no cierra la ventana de carrera real, porque no
hay forma de hacer un `UPDATE` atómico condicionado a una versión sobre una
API RPC externa sin transacciones propias.

**Esto no es un fallo del diseño — lo confirma.** El diagrama de clases ya
ponía `Plato.version` y `reservarStock()` en el dominio propio de Aliflow
(PostgreSQL), no en el ERP externo. La prueba demostró *por qué* esa decisión
es la correcta: solo la base de datos propia de Aliflow puede dar una
garantía transaccional real. El ERP se sincroniza después, de forma
asíncrona, vía el patrón Outbox — y por eso no necesita ser atómico.

`plato_local.py` simula ese dominio propio con un lock real (equivalente
conceptual a `SELECT ... FOR UPDATE` en una transacción de PostgreSQL), y el
Escenario B del demo corre la prueba de concurrencia ahí, no contra Odoo —
con resultado correcto (3 de 5 compras exitosas, nunca más de lo disponible).

`OdooAdapter.reservar_stock()` se deja en el código, pero con una advertencia
explícita en su docstring: solo sirve como sincronización de "mejor
esfuerzo" hacia Odoo, nunca como mecanismo de bloqueo de concurrencia real.
