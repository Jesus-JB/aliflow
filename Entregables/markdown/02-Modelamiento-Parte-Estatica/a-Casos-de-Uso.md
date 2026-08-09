# Documentación de Casos de Uso — Aliflow

![Diagrama de casos de uso de Aliflow](../../uml/casos-de-uso.svg)

**Diagrama fuente:** `../../uml/casos-de-uso.puml` (mismo directorio) — es la fuente editable; `../../uml/casos-de-uso.svg` es la imagen renderizada que se muestra arriba (generada con el servidor público de PlantUML). Si editas el `.puml`, regenera el SVG para que la imagen quede sincronizada — instrucciones en `../../uml/README-diagramas.md`.

**Referencia:** cada caso de uso indica el paso correspondiente de `../../../Flujos-Aliflow-Revision.html` (formato `{rol}-{número}`, ver nota en `../../../Hallazgos-Ingenieria-API-Generica.md` sección 5) del que se derivó.

**Convención visual:** fondo amarillo = propuesta de Ingeniería sin validar con Negocios. Misma convención usada en `../../uml/diagrama-clases.puml` y `../../uml/diagrama-componentes.puml`. En esta revisión (28-jul-2026) los tres casos de uso que estaban en amarillo (UC12/UC13/UC14, del rol Administrador) fueron eliminados o reasignados. Los que están en amarillo ahora son otros: **UC13, UC14, UC15 y "Acreditar sello"**, del requisito nuevo de cartilla de fidelidad. Los números UC13/UC14 se reutilizaron y **no tienen relación con los anteriores**.

## Cambios de esta revisión (28-jul-2026, decisiones de Negocios)

| Qué cambió | Antes | Ahora |
|---|---|---|
| **Número de roles** | 4 actores primarios (Estudiante, Proveedor, Operador, Administrador de plataforma) | **3** — Estudiante, Proveedor, Operador. El "Administrador" **es** el Proveedor: el gerente del local. No existe un super-admin de plataforma. |
| **UC12/UC13/UC14** | Propuesta de Ingeniería para el super-admin (alta de proveedores, métricas globales, gestión de usuarios) | UC13 y UC14 **eliminados**. UC12 se redefine como "Gestionar usuarios del local" y pasa al Proveedor. |
| **Personal múltiple por local** | Pendiente de definir | **Confirmado**: un local puede tener varias cuentas de Proveedor y varias de Operador. |
| **ERP del proveedor** | Un solo ERP objetivo (se creía que Barú usaba Alpwin) | **Multi-ERP**: cada local usa el suyo (Barú → Contífico, Caramel Coffee → Alpwin), con conexión **bidireccional**. |
| **Código de retiro (UC5)** | Pendiente entre QR y numérico; propuesta de UUID firmado | **Código numérico corto** (6 dígitos), dictado de viva voz al Operador. |
| **Recarga de saldo (UC2)** | Pendiente entre saldo por proveedor y saldo único | **Recarga única**, distribuida internamente por Aliflow. |
| **Cartilla de fidelidad** | No existía como requisito | **Requisito nuevo**: el estudiante acumula sellos por compra y al completar la cartilla gana un premio. Se agregan UC13, UC14, UC15 y el sub-flujo UC5d. Cuántos sellos y qué premio siguen sin definir. |

## Actores

| Actor | Tipo | Descripción |
|---|---|---|
| **Estudiante** | Primario | Usuario institucional que recarga saldo, consulta el menú, compra y retira almuerzos. |
| **Proveedor** | Primario | La **persona** que administra un local: menú, inventario, métricas, integración con su ERP y las cuentas de su propio personal. Es el gerente del local — Negocios confirmó (28-jul-2026) que el rol "Administrador" y el rol "Proveedor" son el mismo. Un local puede tener **varias** cuentas de Proveedor. |
| **Operador** | Primario | Valida las compras realizadas por los estudiantes y marca la entrega física del almuerzo en el punto de entrega. Un local puede tener varios. (En discusiones previas del equipo aparecía como "cajero"; el nombre oficial del rol es **Operador**.) |
| **Proveedor de Identidad (Google OAuth)** | Secundario / sistema externo | Autentica al Estudiante mediante OAuth 2.0 / OpenID Connect. |
| **Sistema ERP del local** | Secundario / sistema externo | **No es uno solo**: cada local de la universidad usa un ERP distinto (Barú → **Contífico**, Caramel Coffee → **Alpwin**, etc.). La conexión es **bidireccional** — Aliflow lee inventario/menú del ERP y le devuelve órdenes y pagos. Todos entran por la misma API genérica (patrón Adapter, ver `../../../Hallazgos-Ingenieria-API-Generica.md` sección 3). |

> **Nota sobre vocabulario:** "Proveedor" se usa en dos sentidos que conviene no confundir. Como **actor/rol** es la persona que gerencia el local. Como **entidad** (clase `Proveedor` del diagrama de clases) es el local/negocio en sí — el tenant. En el diagrama de clases la persona se modela como `Administrador`, subclase de `UsuarioProveedor`; ver `../02-Modelamiento-Parte-Estatica/b-Diagrama-de-Clases.md`, sección "Usuarios".

---

## UC1 — Iniciar sesión institucional

| Campo | Detalle |
|---|---|
| **Actor primario** | Estudiante |
| **Actor secundario** | Proveedor de Identidad (Google OAuth) |
| **Referencia** | `est-1` — Autenticación |
| **Precondición** | El estudiante posee un correo institucional válido en el dominio autorizado. |
| **Flujo principal** | 1. El estudiante selecciona "Iniciar sesión con Google".<br>2. El sistema redirige al proveedor de identidad y solicita consentimiento (`<<include>>` UC1a).<br>3. El backend valida que el dominio del correo pertenezca a la lista institucional autorizada y que el token no esté expirado.<br>4. Se genera una sesión autenticada (token/JWT). |
| **Flujo alternativo (extend)** | **UC1b — Crear perfil y tarjeta virtual:** si es el primer ingreso del estudiante, se crea su perfil y tarjeta virtual con saldo en cero antes de continuar. |
| **Excepción** | Si el dominio del correo no pertenece a la lista institucional autorizada, se rechaza el acceso (validación crítica marcada en el flujo). |
| **Postcondición** | El estudiante queda autenticado con una sesión válida. |

## UC2 — Recargar saldo

| Campo | Detalle |
|---|---|
| **Actor primario** | Estudiante |
| **Referencia** | `est-2` — Recarga de tarjeta virtual |
| **Precondición** | El estudiante está autenticado (UC1). |
| **Flujo principal** | 1. El estudiante selecciona "Recargar saldo" e ingresa un monto (o elige uno predefinido).<br>2. Se redirige al método de recarga definido por el negocio.<br>3. Al confirmarse el pago, el sistema actualiza el saldo (operación atómica) e incluye la generación del comprobante (`<<include>>` UC2a).<br>4. El estudiante ve su saldo actualizado. |
| **Postcondición** | El saldo del estudiante queda incrementado; existe un comprobante de recarga asociado. |
| **Resuelto (28-jul-2026)** | El estudiante hace **una única recarga**, que va a una bolsa común gastable en cualquier local; Aliflow distribuye internamente hacia cada proveedor. Ya no hay recarga separada por local. Lo único abierto es *cuándo* ocurre esa distribución interna — ver `../../../Decisiones-Pendientes-Negocios.md`, punto 4. |

## UC3 — Consultar menú del día

| Campo | Detalle |
|---|---|
| **Actor primario** | Estudiante |
| **Actor secundario** | Sistema ERP del Proveedor |
| **Referencia** | `est-3` — Consulta del menú del día |
| **Precondición** | El estudiante está autenticado. |
| **Flujo principal** | 1. El estudiante accede a "Menú del día".<br>2. El sistema sincroniza/consulta el catálogo del proveedor (`<<include>>` UC3a), vía la API genérica o una base local ya sincronizada.<br>3. Se muestra el menú con disponibilidad actualizada. |
| **Excepción** | Si no hay sincronización en tiempo real, puede presentarse el caso "vendido antes de confirmar" al momento de la compra (ver UC4). |
| **Postcondición** | El estudiante visualiza platos disponibles, precio y stock. |

## UC4 — Comprar almuerzo

| Campo | Detalle |
|---|---|
| **Actor primario** | Estudiante |
| **Actor secundario** | Sistema ERP del Proveedor |
| **Referencia** | `est-4` — Compra del almuerzo |
| **Precondición** | El estudiante consultó el menú (UC3) y tiene saldo disponible. |
| **Flujo principal** | 1. El estudiante selecciona un plato y confirma la compra.<br>2. El sistema valida saldo y disponibilidad (`<<include>>` UC4a, con revalidación de stock justo antes de confirmar).<br>3. Si ambas validaciones pasan: se descuenta el saldo (atómico), se crea la orden en estado "Comprado", se genera el comprobante (`<<include>>` UC4b) y se notifica al proveedor (`<<include>>` UC4c). |
| **Flujo alternativo** | Si falla alguna validación (saldo o stock insuficiente), se muestra el error y no se ejecuta ningún descuento. |
| **Excepción crítica** | Concurrencia: dos estudiantes no deben poder comprar la última unidad simultáneamente — requiere bloqueo/transacción atómica (ya identificado como riesgo). |
| **Postcondición** | Orden creada en estado "Comprado"; saldo y stock descontados; comprobante generado; ERP del proveedor notificado. |

## UC5 — Retirar y entregar almuerzo

| Campo | Detalle |
|---|---|
| **Actor primario** | Estudiante y Operador (caso de uso compartido — ambos participan de la misma transacción) |
| **Referencia** | `est-6` (Estudiante) y `op-2`/`op-3`/`op-4`/`op-5` (Operador) |
| **Precondición** | Existe una orden en estado "Comprado" (UC4). |
| **Flujo principal** | 1. El estudiante se presenta en el punto de entrega con su código de validación.<br>2. El operador busca la orden (`<<include>>` UC5a — por código o búsqueda manual por nombre/ID institucional si el estudiante no tiene el código).<br>3. El sistema valida y confirma la entrega (`<<include>>` UC5b): verifica que el estado sea "Comprado" (no "Entregado"), cambia el estado a "Entregado", registra timestamp y operador, e invalida el código (uso único). |
| **Flujo alternativo (extend)** | **UC5c — Manejar excepción de entrega:** código inválido/ya usado (mensaje de error con hora de entrega previa), o fallo de conexión (v1 no tiene modo offline — riesgo ya documentado). |
| **Postcondición** | Orden en estado "Entregado"; código invalidado. |
| **Resuelto (28-jul-2026)** | Formato del código: **numérico corto de 6 dígitos**. El estudiante se lo presenta/dicta al Operador, que lo digita en Aliflow para marcar el retiro. Desbloquea el prototipo de mockups. |
| **Pendiente** | Regla de expiración de una orden nunca retirada (sección 5.3 del hallazgo de Ingeniería). |

## UC6 — Iniciar sesión operativa

| Campo | Detalle |
|---|---|
| **Actor primario** | Proveedor, Operador |
| **Referencia** | `prov-1`, `op-1` |
| **Precondición** | El usuario tiene una cuenta con el rol correspondiente ya asignada (no es OAuth institucional, son credenciales propias del rol). |
| **Flujo principal** | 1. El usuario inicia sesión con sus credenciales de rol.<br>2. El sistema valida el rol y da acceso a la interfaz correspondiente (panel de administración para Proveedor; interfaz simplificada optimizada para uso rápido en el caso de Operador). |
| **Postcondición** | Sesión autenticada con permisos del rol correspondiente. |

## UC7 — Configurar integración con sistema externo

| Campo | Detalle |
|---|---|
| **Actor primario** | Proveedor (junto con Ingeniería) |
| **Actor secundario** | Sistema ERP del Proveedor |
| **Referencia** | `prov-2` |
| **Precondición** | El local está dado de alta en Aliflow; su ERP (Contífico, Alpwin, Odoo u otro) ya fue identificado. |
| **Flujo principal** | 1. Se especifica el endpoint/mecanismo de conexión del ERP.<br>2. Se define el mapeo de datos (productos, precios, stock) al modelo canónico de Aliflow.<br>3. La API genérica (patrón Adapter) actúa como capa de abstracción, sin que el resto de Aliflow dependa de la implementación específica del ERP. |
| **Postcondición** | El adaptador correspondiente (`ContificoAdapter`, `AlpwinAdapter`, `OdooAdapter`, …) queda configurado y operativo para ese local, en ambos sentidos: Aliflow lee su inventario y le devuelve órdenes y pagos. |
| **Nota de arquitectura** | Este caso de uso es la materialización directa del reto técnico investigado en `../../../Hallazgos-Ingenieria-API-Generica.md` — ver secciones 3 y 4.2 (demo validado con Odoo Community). |

## UC8 — Administrar menú

| Campo | Detalle |
|---|---|
| **Actor primario** | Proveedor |
| **Referencia** | `prov-3` |
| **Precondición** | El proveedor está autenticado (UC6). |
| **Flujo principal** | 1. El proveedor define el menú del día (plato, descripción, precio, stock inicial), manualmente o sincronizado desde su ERP.<br>2. El sistema valida datos mínimos (precio > 0, nombre no vacío, stock ≥ 0) antes de publicar. |
| **Postcondición** | Menú publicado y disponible para consulta (UC3). |

## UC9 — Consultar métricas y operación

| Campo | Detalle |
|---|---|
| **Actor primario** | Proveedor |
| **Referencia** | `prov-5` |
| **Precondición** | El proveedor está autenticado. |
| **Flujo principal** | 1. El proveedor accede a su panel de métricas.<br>2. El sistema calcula y muestra: almuerzos vendidos por día/semana, ingresos, platos más vendidos, y órdenes "Comprado" pendientes de "Entregado", a partir del histórico de órdenes de Aliflow. |
| **Postcondición** | El proveedor visualiza el estado operativo de su negocio. |
| **Pendiente** | Modelo de cobro de Aliflow al proveedor (comisión/suscripción) — decisión abierta, sección 5.2 del hallazgo de Ingeniería. |

## UC10 — Consultar estado de sincronización

| Campo | Detalle |
|---|---|
| **Actor primario** | Proveedor |
| **Referencia** | `prov-4` |
| **Precondición** | El proveedor tiene su integración configurada (UC7). |
| **Flujo principal** | 1. El proveedor consulta el estado de sincronización de inventario en su panel.<br>2. El sistema muestra la última comunicación exitosa con su ERP y eventos pendientes/fallidos (tabla de reconciliación, ver arquitectura outbox en `../../../Hallazgos-Ingenieria-API-Generica.md` sección 3.4). |
| **Postcondición** | El proveedor conoce si hay ventas pendientes de reflejarse en su ERP externo. |

## UC11 — Consultar detalle de venta (soporte re-emisión de comprobante)

| Campo | Detalle |
|---|---|
| **Actor primario** | Proveedor |
| **Actor secundario** | Sistema ERP del Proveedor |
| **Referencia** | `prov-6` |
| **Precondición** | Existen ventas registradas en Aliflow (UC4). |
| **Flujo principal** | 1. El proveedor consulta o descarga el detalle de una venta (monto, plato, estudiante, fecha/hora) desde Aliflow.<br>2. El proveedor re-emite la factura válida en su propio sistema contable/ERP, usando ese detalle como fuente de datos. |
| **Postcondición** | El proveedor cuenta con la información necesaria para emitir su factura fiscal real; Aliflow nunca emite un comprobante con validez tributaria. |
| **Nota importante** | Este es el caso de uso donde se detectó la contradicción entre el Acta (25-jun-2026) y el flujo documentado respecto al comprobante tributario — ver `../../../Hallazgos-Ingenieria-API-Generica.md` sección 5.1. El modelo correcto es el aquí descrito: re-emisión por el proveedor, no emisión fiscal directa de Aliflow. |

## UC12 — Gestionar usuarios del local

| Campo | Detalle |
|---|---|
| **Actor primario** | Proveedor (administrador del local) |
| **Referencia** | `prov-1` — "el proveedor **o personal autorizado**". Este caso de uso cierra ese vacío. |
| **Precondición** | El proveedor está autenticado (UC6). |
| **Flujo principal** | 1. El proveedor crea una cuenta nueva para su local, eligiendo el rol: **Proveedor** (otro administrador) u **Operador**.<br>2. Si es Operador, lo asocia a un punto de entrega.<br>3. Puede revocar accesos o restablecer credenciales de las cuentas de su propio local. |
| **Postcondición** | El personal del local queda habilitado con el rol que le corresponde, con acceso limitado a ese local. |
| **Regla de alcance** | Un Proveedor solo puede gestionar cuentas **de su propio local**. No hay ningún rol con visibilidad sobre todos los locales. |

> **Cambio del 28-jul-2026:** este caso de uso reemplaza al antiguo UC14 ("Gestionar usuarios y roles", del super-admin). Los antiguos **UC12** ("Dar de alta / gestionar proveedores") y **UC13** ("Métricas globales de la plataforma") quedaron **eliminados** junto con el rol Administrador de plataforma que los justificaba. Ambos eran hipótesis de Ingeniería y estaban marcados en amarillo justamente por eso.
>
> **Consecuencia abierta:** si nadie dentro del sistema da de alta un local nuevo, ese paso es **manual y fuera del alcance de v1** — lo hace el equipo de Aliflow directamente contra la base de datos, junto con la configuración de la integración (UC7). Está registrado como punto abierto en `../../../Decisiones-Pendientes-Negocios.md`.

## Cartilla de fidelidad — UC13, UC14, UC15

> ⚠️ **Requisito nuevo (28-jul-2026), modelado como propuesta de Ingeniería.** Negocios pidió una "cartilla de fidelidad": el estudiante acumula un sello por compra y al completar la cartilla gana un premio. **Cuántos sellos hacen falta y cuál es el premio todavía están en definición**, así que se modelan como *configuración por local* (UC14) y no como constantes del sistema — cuando Negocios los defina, es un valor en base de datos, no un cambio de código.
>
> **Nota sobre la numeración:** UC13 y UC14 existieron antes con otro significado (métricas globales y gestión de usuarios del super-admin) y fueron eliminados en esta misma revisión. Estos son casos de uso nuevos que reutilizan esos números.

### UC13 — Consultar cartilla de fidelidad

| Campo | Detalle |
|---|---|
| **Actor primario** | Estudiante |
| **Referencia** | Ninguna aún — requisito nuevo, no está en el flujo ni en el acta. |
| **Precondición** | El estudiante está autenticado (UC1). |
| **Flujo principal** | 1. El estudiante abre su sección de fidelidad.<br>2. El sistema muestra **una cartilla por local** en el que haya comprado: sellos acumulados sobre sellos requeridos, premio ofrecido, y fecha de expiración si aplica.<br>3. Si alguna cartilla está `COMPLETA`, se destaca que tiene un premio disponible para canjear (UC15). |
| **Postcondición** | El estudiante conoce su avance en cada local. |

### UC14 — Configurar programa de fidelidad del local

| Campo | Detalle |
|---|---|
| **Actor primario** | Proveedor (administrador del local) |
| **Referencia** | Ninguna aún — requisito nuevo. |
| **Precondición** | El proveedor está autenticado (UC6). |
| **Flujo principal** | 1. El proveedor activa o desactiva el programa de fidelidad de **su** local.<br>2. Define cuántos sellos requiere la cartilla, en qué consiste el premio, cuántos sellos como máximo se pueden acumular por día, y si la cartilla caduca.<br>3. El sistema valida los datos mínimos (sellos requeridos > 0). |
| **Postcondición** | El programa queda activo; a partir de ahí, cada entrega acredita sellos (UC5d). |
| **Regla de alcance** | El programa es **por local**, no de la plataforma: el costo del premio lo absorbe el local, así que cada uno define el suyo. Un local puede no tener programa. |

### UC15 — Canjear premio de la cartilla

| Campo | Detalle |
|---|---|
| **Actor primario** | Estudiante y Operador (transacción compartida, igual que UC5) |
| **Referencia** | Ninguna aún — requisito nuevo. |
| **Precondición** | El estudiante tiene una cartilla en estado `COMPLETA` en ese local. |
| **Flujo principal** | 1. El estudiante elige el plato del premio y confirma el canje.<br>2. El sistema crea una **orden real** (`<<include>>` UC4) con `esCanje = true` y total $0: se descuenta el stock y se genera código de retiro como en cualquier compra, pero **no** se descuenta saldo.<br>3. La cartilla pasa a `CANJEADA` mediante una actualización atómica y condicional (`WHERE estado = 'COMPLETA'`), igual que la redención del código de retiro.<br>4. El Operador entrega el premio y confirma, como en UC5. |
| **Flujo alternativo** | Si la cartilla ya fue canjeada entre el paso 1 y el 3 (doble canje concurrente), la actualización afecta 0 filas y se informa error sin crear la orden. |
| **Postcondición** | Cartilla en `CANJEADA`; orden de canje entregada; inventario del local descontado. |
| **Pendiente** | Cómo debe representarse una venta de $0 en el ERP del local (documento de cortesía / descuento 100%) — se resuelve distinto en Contífico que en Alpwin. Ver `../../../Decisiones-Pendientes-Negocios.md`, punto 9. |

---

## Acta del 30-jul-2026 — UC16 y UC17

### UC16 — Administrar inventario reservado para Aliflow

| Campo | Detalle |
|---|---|
| **Actor primario** | Proveedor |
| **Referencia** | Acta del 30-jul-2026, sección 1.3. |
| **Precondición** | El proveedor está autenticado (UC6) y tiene platos publicados (UC8). |
| **Flujo principal** | 1. El proveedor consulta el cupo actualmente asignado a Aliflow por plato.<br>2. Asigna, aumenta o reduce las unidades destinadas exclusivamente a las ventas por Aliflow.<br>3. El sistema valida que el cupo no sea negativo ni menor al ya consumido.<br>4. El cupo queda disponible para la compra de estudiantes (UC4). |
| **Postcondición** | Aliflow puede vender hasta el cupo asignado, con independencia de lo que ocurra en la caja del local. |
| **Regla de negocio** | **Aliflow valida la compra contra este cupo, no contra el stock total del ERP.** Si el local tiene 100 almuerzos y asigna 25 a Aliflow, la aplicación deja de vender al llegar a 25 aunque el ERP reporte unidades libres. |
| **Por qué se diseñó así** | Elimina la sobreventa **por diseño** en lugar de mitigarla sincronizando más seguido. Aliflow deja de competir con la caja por el mismo contador. Ver `../../../Decisiones-Pendientes-Negocios.md`, punto 10. |
| **Pendiente** | El proceso de asignación y su visualización en el panel quedaron como tarea para la próxima reunión. |

### UC17 — Configurar horario máximo de retiro

| Campo | Detalle |
|---|---|
| **Actor primario** | Proveedor |
| **Referencia** | Acta del 30-jul-2026, secciones 6.1 y 6.2. |
| **Precondición** | El proveedor está autenticado (UC6). |
| **Flujo principal** | 1. El proveedor define la hora máxima hasta la que se pueden retirar los almuerzos de su local.<br>2. El sistema la guarda en `Proveedor.horaMaximaRetiro`.<br>3. A partir de ahí, el mensaje de confirmación que ve el estudiante al comprar se arma con ese valor, y la expiración del código de retiro se calcula con él. |
| **Postcondición** | El horario aplica solo a ese local y se refleja automáticamente en la app del estudiante. |
| **Regla de negocio** | **El horario no puede estar fijo en el código.** Cada local define el suyo. La vigencia del código termina, como máximo, al terminar el día de la compra. |

---

## Super-Admin de Aliflow — UC18, UC19 y UC20

> ⚠️ **Acordado verbalmente en la reunión del 30-jul-2026; no consta en el acta.** Conviene incorporarlo al acta para que quede constancia formal.
>
> **Nota sobre el vaivén:** el 28-jul Negocios indicó que este rol **no existía** y sus casos de uso se eliminaron (ver la tabla de cambios al inicio de este documento). El 30-jul la decisión se revirtió. Los números UC13 y UC14 ya se habían reutilizado para la cartilla de fidelidad, así que este rol usa **UC18–UC20**.

Es un administrador **del lado de Aliflow**, no de ningún local. Es el único rol con visibilidad sobre todos los tenants.

### UC18 — Dar de alta un local y crear su vista de proveedor

| Campo | Detalle |
|---|---|
| **Actor primario** | Super-Admin de Aliflow |
| **Precondición** | Existe un acuerdo comercial con el local. |
| **Flujo principal** | 1. El Super-Admin registra el local nuevo con sus datos (nombre comercial, RUC, puntos de entrega).<br>2. Crea su vista de proveedor y la primera cuenta de Proveedor del local.<br>3. Configura la integración con el ERP de ese local (`<<include>>` UC7).<br>4. El local queda habilitado para publicar menú y vender. |
| **Postcondición** | El local opera como un tenant más de la plataforma. |
| **Qué cierra** | El punto que quedó abierto el 28-jul: *"si ningún rol del sistema da de alta un local nuevo, ese paso es manual y fuera de alcance"*. **Ya no es manual ni está fuera de alcance.** |

### UC19 — Brindar soporte a los locales

| Campo | Detalle |
|---|---|
| **Actor primario** | Super-Admin de Aliflow |
| **Flujo principal** | 1. El Super-Admin consulta el estado de un local: órdenes, sincronización con su ERP, cupo reservado, incidencias.<br>2. Diagnostica y resuelve el problema, o escala al equipo técnico. |
| **Regla de alcance** | Es el único rol que puede ver información de más de un local. Cada acción queda en `RegistroAuditoria`. |

### UC20 — Administrar la plataforma

| Campo | Detalle |
|---|---|
| **Actor primario** | Super-Admin de Aliflow |
| **Flujo principal** | Configuración general de Aliflow: activar o desactivar locales, parámetros globales y monitoreo del estado de las integraciones de todos los tenants. |

---

## Casos de uso incluidos/extendidos (sub-flujos reutilizables)

Estos no son procesos de negocio independientes, sino pasos reutilizados dentro de los casos de uso principales (relación `<<include>>`/`<<extend>>` en el diagrama). Se documentan de forma breve:

| ID | Nombre | Incluido/extiende en | Propósito |
|---|---|---|---|
| UC1a | Autenticar con proveedor de identidad | UC1 (include) | Delegar la autenticación en Google OAuth 2.0 / OIDC. |
| UC1b | Crear perfil y tarjeta virtual | UC1 (extend, solo primer ingreso) | Inicializar el perfil del estudiante con saldo en cero. |
| UC2a | Generar comprobante de recarga | UC2 (include) | Emitir constancia sin validez tributaria de la recarga. |
| UC3a | Sincronizar catálogo con sistema del proveedor | UC3 (include) | Obtener platos/precio/stock actualizados vía la API genérica. |
| UC4a | Validar saldo y disponibilidad | UC4 (include) | Revalidar saldo suficiente y stock justo antes de confirmar la compra. |
| UC4b | Generar comprobante de compra | UC4 (include) | Emitir constancia interna sin validez tributaria (ver UC11). |
| UC4c | Notificar venta al sistema del proveedor | UC4 (include) | Descontar stock en el ERP externo vía la API genérica (patrón outbox si falla, ver arquitectura). |
| UC5a | Buscar orden (código o manual) | UC5 (include) | Ubicar la orden por código de validación o por nombre/ID institucional. |
| UC5b | Validar y confirmar entrega | UC5 (include) | Verificar estado, cambiar a "Entregado", invalidar código, registrar timestamp/operador. |
| UC5c | Manejar excepción de entrega | UC5 (extend) | Código inválido/ya usado, o fallo de conectividad (riesgo v1 sin modo offline). |
| UC5d | Acreditar sello en la cartilla | UC5 (include) | Sumar un sello a la cartilla vigente del estudiante en ese local, si el local tiene programa de fidelidad activo y no se acreditó ya un sello ese día. |

---

*Documento preparado por el Grupo de Ingeniería como parte del entregable 02.a (Diagramas de casos de uso y documentación completa de cada caso de uso).*
