# Especificación de Requerimientos del Sistema — Aliflow

**Proyecto:** Aliflow — plataforma web para pedir y pagar el almuerzo dentro del campus de la UEES
**Asignatura:** Ingeniería de Software I — Facultad de Ingenierías, Computación
**Entregable:** 01 — Documento de especificación de requerimientos del sistema de software
**Preparado por:** Grupo de Ingeniería
**Creado:** 8-ago-2026
**Repositorio público con las evidencias:** https://github.com/Jesus-JB/aliflow *(entregable 01.d)*
**Prototipo de alta fidelidad:** https://jesus-jb.github.io/aliflow/ *(entregable 01.f)*

---

## 1. Introducción

### 1.1 Propósito del documento

Este documento especifica **qué debe hacer Aliflow y bajo qué restricciones**, de forma verificable. Es la fuente única de los requerimientos del sistema: todo lo demás del repositorio (casos de uso, diagramas UML, modelo de datos, prototipo) es la *realización* de lo que aquí se especifica, y debe poder trazarse hasta un requerimiento de esta lista.

No repite el contenido de los otros documentos. Cuando un requerimiento necesita justificación de diseño, apunta a la sección exacta donde vive.

### 1.2 Alcance del producto

Aliflow es una plataforma **multi-tenant** que permite a un estudiante de la UEES recargar saldo, ver el menú de cualquier local de comida del campus, comprar su almuerzo con anticipación y retirarlo presentando un código. Cada local (Barú, Caramel Coffee, …) opera como un tenant independiente, con su propio menú, su propio personal y **su propio sistema ERP**, con el que Aliflow se integra a través de una API genérica.

**Aliflow no es** un ERP, ni un emisor de facturas electrónicas, ni un sistema de punto de venta. No reemplaza la caja del local: convive con ella.

### 1.3 Audiencia

| Lector | Qué busca aquí |
|---|---|
| Grupo de Negocios / cliente | Confirmar que lo especificado es lo acordado; firmar el acta de conformidad (entregable 01.e) |
| Grupo de Ingeniería | Construir contra criterios de aceptación verificables, no contra interpretaciones |
| Evaluación académica | Los entregables 01.c (RNF clasificados según Sommerville con criterios de validación) y 01.d |

### 1.4 Convenciones

**Identificadores.** `RF-nn` requerimiento funcional · `RNF-P-nn` no funcional de producto · `RNF-O-nn` organizacional · `RNF-E-nn` externo · `RN-nn` regla de negocio transversal · `UCnn` caso de uso · `R-nn` riesgo.

**Prioridad (MoSCoW).**

| Nivel | Significado |
|---|---|
| **Debe** | Sin esto no hay producto. Entra en v1 obligatoriamente. |
| **Debería** | Importante, pero el producto funciona sin ello. Entra en v1 si el cronograma lo permite. |
| **Podría** | Deseable. Primer candidato a salir si hay presión de tiempo. |
| **No en v1** | Explícitamente fuera de alcance, con la razón declarada (sección 8). |

**Estado.**

| Marca | Significado |
|---|---|
| ✅ | **Confirmado por Negocios** — consta en acta o en una decisión cerrada de `Decisiones-Pendientes-Negocios.md`. |
| 🟡 | **Propuesta de Ingeniería** — diseño razonado que Negocios todavía no validó. Equivale al estereotipo `<<propuesta>>` de los diagramas UML y al color amarillo del prototipo. |
| 🔴 | **Bloqueado** — no se puede especificar hasta que se resuelva una decisión abierta. Ver sección 7. |

Esta distinción es deliberada y se mantiene en todo el repositorio: **una propuesta de Ingeniería nunca se presenta como si fuera una decisión del cliente.**

### 1.5 Documentos de referencia

| Documento | Rol respecto de este |
|---|---|
| `ACTA DE REUNIÓN ALIFLOW 30 JULIO.pdf` | Fuente primaria más reciente. Prevalece sobre acuerdos anteriores, salvo donde se señala contradicción. |
| `Acta Reunión Aliflow 3.pdf` (25-jun-2026) | Fuente primaria original. Su sección 4 contiene un error de redacción ya identificado y acordado corregir (ver RN-09). |
| `Decisiones-Pendientes-Negocios.md` | Estado vivo de qué está cerrado y qué sigue abierto. **Si este documento y aquel discrepan, aquel manda.** |
| `Flujos-Aliflow-Revision.html` | Flujo funcional original del que se derivaron los casos de uso (referencias `est-n`, `prov-n`, `op-n`). |
| `uml/Documentacion-Casos-de-Uso.md` | Desarrollo narrativo de cada caso de uso citado en la columna *Origen*. |
| `uml/Documentacion-Diagrama-Clases.md` | Entidades y atributos nombrados en los criterios de aceptación. |
| `Hallazgos-Ingenieria-API-Generica.md` | Investigación que fundamenta los requerimientos de integración (RF-47 a RF-53). |
| `Gestion-de-Riesgos.md` | Los 20 riesgos citados en la columna *Riesgo*. |
| `Mockups-Prototipo.md` | Las 21 pantallas del prototipo, mapeadas a requerimientos en la sección 9. |

---

## 2. Glosario y desambiguaciones

Tres términos de este proyecto se han usado con más de un significado. Fijarlos aquí no es formalismo: dos de las tres ambigüedades ya produjeron trabajo perdido.

| Término | Significado en este documento | Con qué se confunde |
|---|---|---|
| **Proveedor** (entidad) | El **local/negocio**: el tenant. Barú, Caramel Coffee. Clase `Proveedor`. | Con el rol homónimo. |
| **Proveedor** (rol) | La **persona** que gerencia el local. Clase `Administrador`. Negocios lo llama indistintamente "Proveedor" o "Administrador"; **son el mismo rol**. | Con la entidad, y con el Super-Admin. |
| **Cartilla de fidelidad** | **Tarjeta de sellos**: el estudiante acumula un sello por entrega y al completar N sellos gana un premio. ✅ **Confirmado por Negocios el 8-ago-2026.** | Con un **paquete prepago de almuerzos** (comprar 10 almuerzos por adelantado y consumirlos). Son productos distintos con el mismo nombre, y un documento de requerimientos no oficial que circuló en el curso usa esa segunda acepción. **No es la de este proyecto.** |
| **Saldo** | Dinero prepagado por el estudiante **en un establecimiento concreto**, gastable **solo ahí**. Un estudiante puede tener varios saldos, uno por local. | ⚠️ Con el **saldo único** gastable en cualquier local, que fue la decisión #4 del 28-jul-2026 y quedó **revertida** por la decisión #13 el 8-ago-2026. Documentos anteriores a esa fecha describen el modelo antiguo. |
| **Cupo reservado** | Unidades de un plato **apartadas exclusivamente para venta por Aliflow**, administradas manualmente por el Proveedor. Clase `InventarioReservado`. | Con el stock total del ERP (`Plato.stockDisponible`), que en Aliflow es solo un espejo informativo. |
| **Código de retiro** | Código **numérico de 6 dígitos** que el estudiante dicta de viva voz y el Operador teclea. | Con un QR o código de barras escaneable. **No hay escáner en ninguna parte del sistema.** |
| **Comprobante** | Constancia **interna sin validez tributaria** que emite Aliflow. | Con la **factura**, que emite el ERP del local y sí tiene validez tributaria. Ver RN-09. |
| **Operador** | Rol que valida el código y marca la entrega física. | Con "cajero", nombre informal usado en discusiones previas del equipo. |

---

## 3. Actores del sistema

| Actor | Tipo | Autenticación | Ámbito |
|---|---|---|---|
| **Estudiante** | Primario | Google OAuth 2.0 / OIDC, dominio institucional | Su propia cuenta; compra en cualquier local |
| **Proveedor** (gerente del local) | Primario | Credenciales propias del rol | **Un solo local.** Un local puede tener varias cuentas |
| **Operador** | Primario | Credenciales propias del rol | Un local y un punto de entrega. Un local puede tener varios |
| **Super-Admin de Aliflow** | Primario | Credenciales propias del rol | **Todos los locales.** Único rol sin local propio |
| **Proveedor de Identidad (Google)** | Secundario / externo | — | Autentica al Estudiante |
| **ERP del local** (Contífico, Alpwin, Odoo, …) | Secundario / externo | Credenciales por local | Uno por local; heterogéneos |
| **Pasarela de pagos** | Secundario / externo | — | Procesa las recargas. Sin definir (decisión #12) |

> ✅ Los **cuatro roles primarios** —Estudiante, Operador, Proveedor y Super-Admin— quedaron confirmados por Negocios el 8-ago-2026. El acuerdo original sobre el Super-Admin (30-jul) fue verbal y no consta en el acta de esa reunión; el respaldo documental lo aporta el acta de conformidad de esta especificación (entregable 01.e).

---

## 4. Reglas de negocio transversales

Restricciones que aplican a varios requerimientos a la vez. Se enuncian una sola vez para no repetirlas en cada RF.

| ID | Regla | Estado | Origen |
|---|---|---|---|
| **RN-01** | **Una orden pertenece a un solo local.** Todos los ítems de una orden deben ser platos del mismo `Proveedor`. | ✅ | Invariante del diagrama de clases |
| **RN-02** | **La disponibilidad de venta se valida contra el cupo reservado**, nunca contra el stock del ERP. Si el cupo está en cero, Aliflow no vende aunque el ERP reporte unidades libres. | ✅ | Acta 30-jul §1.3, decisión #10 |
| **RN-03** | **El código de retiro vale únicamente el día de la compra**, y como máximo hasta la hora máxima de retiro del local. Tres estados: `VÁLIDO` / `UTILIZADO` / `VENCIDO`. | ✅ | Acta 30-jul, decisión #5 |
| **RN-04** | **El código de retiro es de un solo uso.** Su invalidación es atómica y condicional; una segunda redención debe fallar, no completarse. | ✅ | Riesgo R-14 |
| **RN-05** | **Toda hora, cupo, cantidad de sellos y premio es configuración por local**, nunca constante del sistema. | ✅ | Acta 30-jul §6.1–6.2, decisión #11 |
| **RN-06** | **Aliflow nunca almacena el número completo de una tarjeta ni su código de seguridad.** Solo tipo, últimos cuatro dígitos y el token de la pasarela. | ✅ | Acta 30-jul §3.2–3.3 |
| **RN-07** | **Un Proveedor y un Operador solo pueden ver y operar datos de su propio local.** El aislamiento entre tenants se verifica en el backend, nunca solo en la interfaz. | ✅ | UC12, regla de alcance |
| **RN-08** | **El sello de fidelidad se acredita al entregar, no al comprar**, y como máximo **uno por día** por local. | ✅ | Confirmado por Negocios el 8-ago-2026 |
| **RN-09** | **Aliflow emite comprobantes internos sin validez tributaria; la factura fiscal la emite el ERP del local.** Aliflow no es emisor fiscal en ningún flujo. | ✅ | Acta 30-jul §2.1–2.2, decisión #8 |
| **RN-10** | **Toda operación que mueve dinero o cambia el estado de una orden queda registrada en auditoría**, con actor, acción, entidad afectada y marca de tiempo. | ✅ | Riesgo R-09 |
| **RN-11** | **El control de concurrencia vive en la base de datos de Aliflow**, no se delega en el ERP externo. Validado empíricamente. | ✅ | `demo-odoo/README.md` §7 |
| **RN-12** | **Un canje de premio es una orden real con un descuento del 100% identificado como "Premio"**, no una venta de $0. Conserva el precio original del plato, descuenta cupo y genera código de retiro, pero el total a pagar es $0 y no toca el saldo del estudiante. | ✅ | Confirmado por Negocios el 8-ago-2026 |
| **RN-13** | **El saldo pertenece al establecimiento, no al estudiante.** La recarga es por establecimiento y solo puede gastarse ahí. No hay saldo único ni transferencias entre locales. | ✅ | Decisión #13, resuelta el 8-ago-2026 |
| **RN-14** | **Aliflow no recibe ni custodia fondos en ningún punto.** El dinero de la recarga va de la pasarela a la cuenta del proveedor destino. Aliflow registra el movimiento, no lo posee. | ✅ | Acta 30-jul §3.9, decisión #13 |
| **RN-15** | **Al estudiante nunca se le muestra la cantidad de unidades disponibles**, solo si el plato está *Disponible* o *Agotado*. La cifra del cupo es información interna del local y sí se le muestra al Proveedor. | ✅ | Negocios, 9-ago-2026 |

---

## 5. Requerimientos funcionales

### 5.1 Módulo A — Autenticación, cuentas y control de acceso

#### RF-01 · Iniciar sesión con cuenta institucional
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC1, UC1a, `est-1`

El sistema debe autenticar al Estudiante exclusivamente mediante Google OAuth 2.0 / OpenID Connect, aceptando únicamente correos del dominio institucional autorizado.

**Criterios de aceptación**
1. Con un correo del dominio institucional y consentimiento otorgado, se crea una sesión válida y el estudiante llega al menú del día.
2. Con un correo de un dominio no autorizado, el acceso se rechaza con un mensaje explícito y **no** se crea ningún perfil.
3. La validación del dominio ocurre en el backend. Manipular la respuesta del cliente no otorga acceso.
4. El sistema no almacena en ningún momento la contraseña de la cuenta de Google.

#### RF-02 · Crear perfil y tarjeta virtual en el primer ingreso
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC1b

En el primer ingreso exitoso de un estudiante, el sistema debe crear su perfil y su tarjeta virtual con saldo inicial en cero, antes de darle acceso a cualquier otra funcionalidad.

**Criterios de aceptación**
1. Tras el primer login, existe exactamente un perfil y una tarjeta virtual con saldo `0.00`.
2. En los ingresos siguientes no se crean duplicados: el sistema reutiliza el perfil existente.

#### RF-03 · Iniciar sesión operativa con credenciales de rol
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC6, `prov-1`, `op-1`

Proveedor, Operador y Super-Admin deben autenticarse con credenciales propias del rol —no con OAuth institucional— y ser dirigidos a la interfaz que les corresponde.

**Criterios de aceptación**
1. Cada rol aterriza en su propia interfaz: panel de administración (Proveedor), interfaz simplificada de validación (Operador), consola de plataforma (Super-Admin).
2. Las contraseñas se almacenan con una función de derivación de clave con sal, nunca en claro ni con un hash simple.
3. Un Operador que intenta abrir una ruta del panel de Proveedor recibe un rechazo del backend, no solo la ausencia del enlace en la interfaz.

#### RF-04 · Gestionar las cuentas del propio local
**Prioridad:** Debería · **Estado:** ✅ · **Origen:** UC12, decisión #3

El Proveedor debe poder crear, revocar y restablecer credenciales de cuentas de **su propio local**, eligiendo el rol Proveedor u Operador, y asociando a los Operadores a un punto de entrega.

**Criterios de aceptación**
1. Un local puede tener varias cuentas de Proveedor y varias de Operador simultáneamente activas.
2. Un Proveedor no puede crear, ver ni modificar cuentas de otro local (RN-07), ni crear una cuenta de Super-Admin.
3. Al revocar una cuenta, sus sesiones activas dejan de ser válidas en la siguiente petición al backend.

#### RF-05 · Cerrar sesión y expirar sesiones inactivas
**Prioridad:** Debería · **Estado:** 🟡 · **Origen:** Propuesta de Ingeniería (riesgo R-09)

El sistema debe permitir cerrar sesión explícitamente y debe expirar automáticamente las sesiones inactivas.

**Criterios de aceptación**
1. Tras cerrar sesión, el token deja de ser aceptado por el backend.
2. Una sesión de Operador sin actividad expira en un plazo configurable. *(Justificación: el dispositivo del punto de entrega es compartido y queda desatendido entre entregas.)*

#### RF-06 · Restringir cada rol a su ámbito de datos
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** RN-07, UC19

Toda consulta y toda escritura debe filtrarse por el local del usuario autenticado. Solo el Super-Admin puede acceder a datos de más de un local.

**Criterios de aceptación**
1. Una petición que referencia el identificador de un recurso de otro local devuelve "no encontrado", sin revelar que el recurso existe.
2. Las consultas del Super-Admin que cruzan locales quedan registradas en auditoría (RN-10).

---

### 5.2 Módulo B — Billetera y recarga de saldo

> ✅ **Desbloqueado el 8-ago-2026.** Negocios resolvió la decisión #13: **la recarga se hace por establecimiento**, tomando como referencia el modelo de la aplicación *Parqueo Positivo* (el usuario elige un servicio por defecto y su saldo pertenece a ese servicio). Esto elimina la contradicción con el acta —el dinero llega directo a la cuenta de cada proveedor y Aliflow no custodia fondos— y **revierte la decisión #4**: ya no hay saldo único. Ver sección 7 para lo que la respuesta cerró y lo que abrió.

#### RF-07 · Consultar el saldo por establecimiento
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC1b, decisión #13, RN-13

El estudiante debe poder consultar su saldo **de cada establecimiento en el que haya recargado**. El saldo pertenece al establecimiento, no a la cuenta del estudiante.

**Criterios de aceptación**
1. El saldo de cada establecimiento coincide exactamente con sus recargas aprobadas menos sus compras confirmadas **en ese mismo establecimiento**.
2. La interfaz muestra siempre, de forma visible, **en qué establecimiento está** el estudiante y el saldo que le corresponde. No se presenta una cifra agregada que pueda leerse como gastable en cualquier local.
3. Si el estudiante tiene saldo en varios establecimientos, puede consultarlos todos, pero cada uno se presenta asociado a su local.

#### RF-08 · Recargar saldo en un establecimiento
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC2, `est-2`, decisión #13, acta 30-jul §3.9

El estudiante debe poder recargar saldo **para un establecimiento específico**, por un monto que elija o seleccione de valores predefinidos, a través de una pasarela de pagos. El dinero se dirige a la cuenta de ese proveedor; **Aliflow no lo recibe ni lo custodia en ningún momento**.

**Criterios de aceptación**
1. Toda recarga tiene un establecimiento destino obligatorio; no existe recarga sin local asociado.
2. El saldo se acredita **únicamente** tras una confirmación válida de la pasarela con estado aprobado, y **solo** al saldo de ese establecimiento.
3. Un pago rechazado o pendiente no acredita saldo y deja constancia de su estado.
4. La operación de acreditación es atómica: no existe estado intermedio en el que el pago esté aprobado y el saldo no reflejado.
5. Reprocesar la misma confirmación de pago **no** acredita el saldo dos veces (idempotencia por número de operación).
6. La interfaz advierte al estudiante, antes de confirmar, que el saldo recargado **solo puede usarse en ese establecimiento**.

#### RF-09 · Registrar cada recarga con los datos exigidos por el acta
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** Acta 30-jul §2.1, decisión #13

Cada recarga debe registrar como mínimo: valor, fecha y hora, número de operación, estado de la transacción, identificador de la pasarela, usuario que recargó y **establecimiento destino**, y quedar en histórico.

**Criterios de aceptación**
1. Ninguno de los siete campos puede quedar vacío en una recarga aprobada.
2. El histórico es consultable para auditoría y conciliación, y **no admite borrado** de registros.
3. El histórico permite conciliar, por establecimiento, lo recargado contra lo que su cuenta bancaria recibió.

#### RF-10 · Emitir comprobante interno de recarga
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC2a, decisión #8, RN-09

Cada recarga aprobada debe generar un comprobante interno **marcado explícitamente como sin validez tributaria**.

**Criterios de aceptación**
1. El comprobante lleva de forma visible la leyenda de que no es un documento tributario.
2. No se invoca ningún servicio de facturación electrónica en el flujo de recarga.

#### RF-11 · Guardar métodos de pago tokenizados
**Prioridad:** Podría · **Estado:** 🟡 · **Origen:** Acta 30-jul §3.2–3.3, RN-06

El estudiante debería poder guardar un método de pago para recargas futuras, almacenando **solo** tipo de tarjeta, últimos cuatro dígitos y el token de la pasarela.

**Criterios de aceptación**
1. Una inspección de la base de datos no encuentra en ninguna tabla un número de tarjeta completo ni un código de seguridad.
2. Si la pasarela elegida no soporta tokenización, este requerimiento se retira del alcance (no se implementa una alternativa propia).

#### RF-12 · Impedir el gasto cruzado entre establecimientos
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** Decisión #13, RN-13

Una compra solo puede consumir el saldo del establecimiento donde se realiza. El sistema debe hacer imposible que el saldo de un local pague una compra en otro.

**Criterios de aceptación**
1. Con saldo suficiente en el local A e insuficiente en el local B, una compra en B falla por saldo insuficiente, **sin importar** el saldo total del estudiante.
2. La verificación ocurre en el backend dentro de la transacción de compra (RF-20), no solo en la interfaz.
3. El mensaje de saldo insuficiente nombra el establecimiento y ofrece recargar **en ese** establecimiento.
4. Por cada compra queda registrado de qué saldo de establecimiento se descontó (RN-10).

#### RF-12b · Transferir saldo entre establecimientos
**Prioridad:** No en v1 · **Estado:** ✅ *(excluido)* · **Origen:** Decisión #13

**No se implementa.** Mover saldo del local A al local B exigiría que el proveedor A devuelva dinero y el proveedor B lo reciba, con Aliflow orquestando un movimiento de fondos entre terceros — exactamente lo que el acta §3.9 prohíbe. Se documenta aquí para dejar constancia de que la exclusión es deliberada y no un olvido. Ver sección 8.

---

### 5.3 Módulo C — Catálogo, menú e inventario reservado

#### RF-13 · Publicar y mantener el menú del local
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC8, `prov-3`

El Proveedor debe poder definir el menú de su local —plato, descripción, precio, disponibilidad— manualmente o sincronizándolo desde su ERP.

**Criterios de aceptación**
1. El sistema rechaza publicar un plato con precio menor o igual a cero, nombre vacío o cantidad negativa.
2. Un plato despublicado deja de aparecer en el menú del estudiante inmediatamente, sin afectar las órdenes ya creadas sobre él.

#### RF-14 · Consultar el menú del día
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC3, UC3a, `est-3`

El estudiante debe poder consultar el menú del día de cada local, con plato, precio y disponibilidad para Aliflow.

**Criterios de aceptación**
1. El menú muestra la disponibilidad derivada del **cupo reservado** (RN-02), no del stock del ERP.
2. La disponibilidad se presenta como **estado binario — "Disponible" o "Agotado" —, nunca como cantidad numérica.** El estudiante no ve cuántas unidades quedan (RN-15).
3. Un plato con cupo agotado se muestra explícitamente como agotado, no se oculta.
4. El menú se puede consultar aunque el ERP del local esté caído. *(Consecuencia directa del inventario reservado.)*

#### RF-15 · Elegir establecimiento y mantener el contexto visible
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** Pantalla Estudiante 02, decisión #13, RN-13

El estudiante debe elegir un establecimiento **por defecto** antes de poder operar, y debe poder cambiarlo en cualquier momento. La aplicación debe indicar de forma permanente en qué establecimiento está, porque de eso dependen el menú, el saldo y la cartilla.

**Criterios de aceptación**
1. En el primer ingreso, el sistema exige elegir un establecimiento antes de mostrar menú o saldo.
2. La elección se recuerda entre sesiones y es modificable desde un control siempre visible en la parte superior.
3. Al cambiar de establecimiento cambian **a la vez** menú, saldo (RF-07) y cartilla (RF-34). No queda ningún dato del local anterior en pantalla.
4. Solo se listan locales activos; un local desactivado por el Super-Admin no aparece en el selector.
5. *(Patrón de referencia aportado por Negocios: la aplicación Parqueo Positivo — selección obligatoria de servicio por defecto en el primer ingreso, e indicador permanente del servicio activo junto al saldo.)*

#### RF-16 · Administrar el cupo reservado para Aliflow
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC16, Acta 30-jul §1.3, decisión #10

El Proveedor debe poder consultar, asignar, aumentar y reducir las unidades de cada plato destinadas exclusivamente a la venta por Aliflow.

**Criterios de aceptación**
1. El sistema rechaza un cupo negativo y rechaza reducir el cupo por debajo de las unidades ya vendidas.
2. Un aumento de cupo queda disponible para la compra de estudiantes sin necesidad de republicar el menú.
3. El panel muestra el cupo de Aliflow y el stock del ERP como **dos cifras distintas y rotuladas**, para que no se confundan.

#### RF-17 · Alertar sobre cupo bajo o agotado
**Prioridad:** Debería · **Estado:** 🟡 · **Origen:** Riesgo R-20

El sistema debería alertar al Proveedor en su panel cuando el cupo de un plato baje de un umbral o se agote.

**Criterios de aceptación**
1. Con el cupo por debajo del umbral configurado, el panel muestra una alerta visible sin que el Proveedor tenga que entrar al detalle del plato.
2. *(Justificación: sin esta alerta el fallo de R-20 es silencioso — Aliflow aparece agotado mientras el local tiene comida, y nadie reclama por lo que no puede comprar.)*

#### RF-18 · Registrar las compras rechazadas por cupo agotado
**Prioridad:** Debería · **Estado:** 🟡 · **Origen:** Riesgo R-20

El sistema debería registrar los intentos de compra rechazados por falta de cupo y exponerlos como métrica al Proveedor.

**Criterios de aceptación**
1. El panel de métricas muestra cuántas compras se perdieron por cupo agotado, por plato y por día.
2. *(Justificación: convierte la venta perdida en un dato visible en vez de una ausencia invisible.)*

---

### 5.4 Módulo D — Compra

#### RF-19 · Comprar un almuerzo
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC4, `est-4`

El estudiante debe poder comprar uno o más platos de un mismo local, descontando su saldo y el cupo reservado, y recibiendo un código de retiro.

**Criterios de aceptación**
1. La compra solo se confirma si **ambas** validaciones pasan: saldo suficiente **en ese establecimiento** (RN-13) y cupo disponible.
2. Si alguna falla, se informa el motivo concreto y **no se descuenta nada** — ni saldo ni cupo.
3. Al confirmarse: la orden queda en estado `COMPRADO`, el saldo de ese establecimiento baja exactamente por el total, el cupo baja exactamente por las unidades compradas, y se genera el código de retiro.
4. Los platos de una misma orden pertenecen al mismo local (RN-01); el sistema rechaza cualquier intento contrario.

#### RF-20 · Revalidar saldo y cupo inmediatamente antes de confirmar
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC4a

La validación de saldo y cupo debe repetirse dentro de la transacción de confirmación, no solo al mostrar la pantalla de compra.

**Criterios de aceptación**
1. Si el cupo se agota entre que el estudiante abre la pantalla y confirma, la compra falla con el mensaje correspondiente.
2. El tiempo transcurrido en la pantalla no afecta la corrección del resultado.

#### RF-21 · Impedir la sobreventa bajo concurrencia
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC4 (excepción crítica), RN-11, riesgo R-02

Dos o más compras simultáneas de la última unidad del cupo deben resultar en exactamente una compra confirmada.

**Criterios de aceptación**
1. Con cupo `N` y `M > N` compras concurrentes del mismo plato, se confirman exactamente `N` y fallan `M − N`, sin cupo negativo.
2. El mecanismo (bloqueo optimista con campo de versión) opera en la base de datos de Aliflow, **no** delegado al ERP. *(Se probó delegarlo al ERP y falló bajo concurrencia real: 5 hilos con 3 unidades vendieron 5 — `demo-odoo/README.md` §7.)*
3. Existe una prueba automatizada de concurrencia que ejercita este escenario.

#### RF-22 · Emitir comprobante interno de compra
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC4b, RN-09

Cada compra confirmada debe generar un comprobante interno marcado como sin validez tributaria.

**Criterios de aceptación**
1. El comprobante identifica local, platos, total, fecha y código de retiro.
2. Lleva visible la leyenda de que la factura fiscal la emite el local.

#### RF-23 · Mostrar la confirmación con el horario máximo de retiro
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC17, Acta 30-jul §6.1–6.2

Al confirmarse la compra, el sistema debe mostrar el código de retiro y **hasta qué hora** puede retirarse, tomando el valor configurado por ese local.

**Criterios de aceptación**
1. La hora mostrada proviene de la configuración del local (RN-05); dos locales con horarios distintos muestran mensajes distintos.
2. No existe ninguna hora de retiro fija en el código de la aplicación.

#### RF-24 · Consultar el historial de órdenes
**Prioridad:** Debería · **Estado:** ✅ · **Origen:** UC11, pantalla Estudiante 06

El estudiante debe poder consultar sus órdenes anteriores con su estado.

**Criterios de aceptación**
1. Se distinguen los estados `COMPRADO`, `ENTREGADO` y `EXPIRADO`.
2. Las órdenes de canje aparecen identificadas como premio, mostrando el precio original y el descuento del 100% (RN-12), no un total de $0.00 sin explicación.

---

### 5.5 Módulo E — Retiro y entrega

#### RF-25 · Validar el código de retiro
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC5, UC5a, `op-2`

El Operador debe poder **teclear** un código numérico de 6 dígitos para localizar la orden correspondiente en su local.

**Criterios de aceptación**
1. La interfaz de ingreso es un teclado numérico. **No existe lector de códigos de barras ni de QR en ningún punto del sistema.**
2. Solo se encuentran órdenes del local del Operador (RN-07).
3. Antes de confirmar, la pantalla muestra el nombre del estudiante y el detalle de la orden. *(Mitigación de R-15: la entrega es presencial, así que un código acertado al azar se cae en la verificación visual.)*

#### RF-26 · Confirmar la entrega
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC5b, `op-3`

Al confirmar, el sistema debe cambiar la orden a `ENTREGADO`, invalidar el código y registrar marca de tiempo y Operador.

**Criterios de aceptación**
1. Tras confirmar, la orden está en `ENTREGADO` y el código en `UTILIZADO`.
2. Quedan registrados el Operador que confirmó y el instante exacto (RN-10).

#### RF-27 · Impedir la doble redención del código
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** RN-04, riesgo R-14

Dos intentos de validar el mismo código —incluso desde puntos de entrega distintos y casi simultáneos— deben resultar en exactamente una entrega.

**Criterios de aceptación**
1. La invalidación es una actualización atómica y condicional; si afecta cero filas, se informa error y **no** se completa una segunda entrega.
2. Existe una prueba automatizada que ejercita dos redenciones concurrentes del mismo código.

#### RF-28 · Distinguir los tres casos de fallo de un código
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC5c, decisión #5, pantallas Operador 04 y 05

El sistema debe distinguir y comunicar de forma diferenciada: código **inexistente**, código **ya utilizado** y código **vencido**.

**Criterios de aceptación**
1. Los tres casos producen mensajes distintos; "ya utilizado" indica además la hora de la entrega previa.
2. Un código de una compra de un día anterior se reporta como **vencido**, no como inexistente.

#### RF-29 · Expirar automáticamente las órdenes no retiradas
**Prioridad:** Debe · **Estado:** ✅ (la regla) / 🔴 (el dinero) · **Origen:** RN-03, decisión #5

Al terminar el día de la compra, toda orden en `COMPRADO` debe pasar a `EXPIRADO` y su código a `VENCIDO`.

**Criterios de aceptación**
1. Al día siguiente, ninguna orden del día anterior permanece en `COMPRADO`.
2. La transición queda registrada en auditoría.
3. 🔴 **Qué ocurre con el dinero de una orden expirada no está definido** — el acta fijó cuándo vence el código, no la política de reembolso. Ver sección 7.

#### RF-30 · Buscar una orden sin código
**Prioridad:** Debería · **Estado:** ✅ · **Origen:** UC5a

El Operador debería poder localizar una orden por nombre o identificador institucional del estudiante cuando este no tenga su código.

**Criterios de aceptación**
1. La búsqueda se limita a órdenes vigentes del local del Operador.
2. La entrega por esta vía queda marcada en auditoría como búsqueda manual, distinguible de la validación por código.

#### RF-31 · Limitar los intentos fallidos de validación
**Prioridad:** Debería · **Estado:** 🟡 · **Origen:** Riesgo R-15

El sistema debería limitar los intentos fallidos de validación por sesión de Operador y por ventana de tiempo, y registrar cada fallo.

**Criterios de aceptación**
1. Superado el umbral, la validación se bloquea temporalmente y el hecho queda en auditoría.
2. *(Justificación: con 6 dígitos el espacio de búsqueda es 10⁶ y en la práctica mucho menor, porque solo son válidos los pocos códigos vigentes de ese local en ese momento.)*

---

### 5.6 Módulo F — Cartilla de fidelidad

> ✅ **Confirmado por Negocios el 8-ago-2026.** Se validaron las cinco decisiones de diseño que Ingeniería había tomado sobre una descripción incompleta: **"cartilla" es tarjeta de sellos de fidelidad** (no paquete prepago), **tope de un sello por día**, **el sello se acredita al retirar**, **la cartilla es por local**, y **el premio se cobra como descuento del 100%** con la nota que identifica su origen. Con eso el riesgo R-17 baja de Alta a Baja.
>
> **Sigue faltando el valor de dos configuraciones** —cuántos sellos requiere la cartilla y en qué consiste el premio— pero eso ya no bloquea nada: están modelados como configuración por local (RF-32), así que definirlos es cargar un valor en base de datos.

#### RF-32 · Configurar el programa de fidelidad del local
**Prioridad:** Debería · **Estado:** ✅ · **Origen:** UC14, decisión #9

El Proveedor debe poder activar o desactivar el programa de fidelidad de su local y definir sellos requeridos, premio, tope de sellos por día y caducidad de la cartilla.

**Criterios de aceptación**
1. El sistema rechaza un número de sellos requeridos menor o igual a cero.
2. Un local sin programa activo no acredita sellos y no muestra cartilla a sus compradores.
3. Ninguno de estos valores existe como constante en el código (RN-05).
4. El tope de sellos por día viene con valor **1** por defecto (RN-08).

#### RF-33 · Acreditar el sello al confirmar la entrega
**Prioridad:** Debería · **Estado:** ✅ · **Origen:** UC5d, RN-08

Al confirmarse una entrega en un local con programa activo, el sistema debe acreditar un sello a la cartilla vigente del estudiante en ese local.

**Criterios de aceptación**
1. El sello se acredita en la confirmación de entrega, **nunca** en la confirmación de compra. *(Si se acreditara al comprar, el estudiante podría llenar la cartilla sin retirar nunca el almuerzo y el local pagaría un premio por ventas que no ocurrieron físicamente.)*
2. Un reintento de la confirmación de entrega —fallo de red, doble clic— **no** acredita dos sellos. La relación sello–orden es uno a uno con restricción de unicidad.
3. Con el tope diario alcanzado, una segunda entrega del mismo día no acredita sello adicional.
4. Una orden de canje (RN-12) no acredita sello.

#### RF-34 · Consultar la cartilla
**Prioridad:** Debería · **Estado:** ✅ · **Origen:** UC13

El estudiante debe poder ver **una cartilla por local** en el que haya comprado, con sellos acumulados sobre requeridos, premio y caducidad si aplica.

**Criterios de aceptación**
1. Las cartillas de distintos locales son independientes: un sello en Barú no avanza la cartilla de Caramel Coffee.
2. Una cartilla completa se destaca como premio disponible.
3. La cartilla mostrada corresponde al establecimiento activo (RF-15 criterio 3).

#### RF-35 · Canjear el premio como descuento del 100%
**Prioridad:** Podría · **Estado:** ✅ · **Origen:** UC15, RN-12, decisión #9

Con una cartilla completa, el estudiante debe poder canjear el premio. El canje genera una **orden real con el precio normal del plato y un descuento del 100% identificado como "Premio"**, de modo que el total a pagar sea $0 sin perder el rastro de cuánto costó.

**Criterios de aceptación**
1. La orden conserva el **precio original** del plato; el descuento se registra como línea o campo propio, con su motivo ("Premio de fidelidad") visible.
2. El canje descuenta cupo y genera código de retiro como cualquier compra, pero **no** descuenta saldo del estudiante.
3. La cartilla pasa a canjeada mediante una actualización atómica y condicional; un doble canje concurrente falla en el segundo intento **sin crear la orden**.
4. La orden de canje se distingue visualmente en el historial del estudiante y en el panel del Operador.
5. *(Por qué importa el descuento y no el $0: una orden de $0 hace invisible el costo del programa. Con descuento identificado, el local puede ver exactamente cuánto le costaron los premios — ver RF-38 criterio 3.)*

#### RF-36 · Expirar cartillas vencidas
**Prioridad:** Podría · **Estado:** ✅ · **Origen:** `uml/estado-cartilla.puml`, decisión #9

Si el local configuró caducidad, las cartillas incompletas deben expirar al cumplirse el plazo.

**Criterios de aceptación**
1. Si el local no configuró caducidad, ninguna cartilla expira.
2. Una cartilla ya completa no expira antes de poder canjearse.

#### RF-37 · Representar el canje en el ERP del local
**Prioridad:** Podría · **Estado:** ✅ *(la regla)* / 🟡 *(la verificación técnica)* · **Origen:** Decisión #9

El sistema debe notificar el canje al ERP del local como una venta con **descuento del 100%** y su motivo, no como una venta de importe cero.

**Criterios de aceptación**
1. El documento enviado al ERP lleva el importe original del plato y un descuento del 100% con concepto identificable.
2. La contabilidad del local puede distinguir un premio de fidelidad de una venta normal y de una anulación.
3. 🟡 **Verificación técnica pendiente:** confirmar contra la documentación de cada ERP que admite un descuento del 100% en línea de venta. Se resuelve distinto en Contífico que en Alpwin. *(La decisión de negocio ya está tomada — antes este requerimiento no se podía ni redactar porque no se sabía si era documento de cortesía o descuento.)*

---

### 5.7 Módulo G — Panel del Proveedor

#### RF-38 · Consultar métricas del local
**Prioridad:** Debería · **Estado:** ✅ · **Origen:** UC9, `prov-5`

El Proveedor debe poder ver almuerzos vendidos por día y semana, ingresos, platos más vendidos y órdenes pendientes de entrega.

**Criterios de aceptación**
1. Las métricas se calculan sobre el histórico de órdenes de Aliflow y solo incluyen el local del Proveedor (RN-07).
2. Las órdenes de canje se cuentan en unidades entregadas pero no suman ingresos.
3. El panel muestra **cuánto costaron los premios de fidelidad** en el período, sumando los descuentos del 100% aplicados (RN-12). *(Es el dato que permite al local saber si su programa de fidelidad le conviene; con el canje modelado como venta de $0 este número no existía.)*

#### RF-39 · Configurar el horario máximo de retiro
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC17, decisión #11

El Proveedor debe poder definir la hora máxima de retiro de su local.

**Criterios de aceptación**
1. El valor guardado se refleja de inmediato en el mensaje de confirmación de compra del estudiante (RF-23) y en el cálculo de expiración del código.
2. El horario aplica solo a ese local.

#### RF-40 · Consultar el estado de sincronización con el ERP
**Prioridad:** Debería · **Estado:** ✅ · **Origen:** UC10, `prov-4`

El Proveedor debe poder ver la última comunicación exitosa con su ERP y los eventos pendientes o fallidos.

**Criterios de aceptación**
1. Se muestran los eventos en cola con su estado y el número de reintentos.
2. Un evento fallido es identificable junto con la orden a la que corresponde, para permitir conciliación manual.

#### RF-41 · Consultar el detalle de una venta para re-emitir la factura
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC11, `prov-6`, RN-09

El Proveedor debe poder consultar y descargar el detalle de una venta (monto, platos, estudiante, fecha y hora) para emitir su factura fiscal en su propio ERP.

**Criterios de aceptación**
1. El detalle contiene todos los datos necesarios para emitir la factura sin volver a preguntar nada.
2. Aliflow **no** emite ni intenta emitir ningún documento fiscal en este flujo.

#### RF-42 · Configurar la integración con el ERP del local
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC7, `prov-2`

Debe existir una forma de registrar, por local, el tipo de ERP, sus credenciales y el mapeo de sus productos al modelo canónico de Aliflow.

**Criterios de aceptación**
1. Cambiar de ERP en un local no requiere modificar el núcleo de la aplicación, solo su configuración y el adaptador correspondiente.
2. Las credenciales del ERP se almacenan cifradas y no son legibles desde ninguna interfaz.
3. Existe una prueba de humo bidireccional que confirma que Aliflow puede leer del ERP y escribirle. *(Es trabajo técnico conjunto con Ingeniería, no una pantalla de autoservicio.)*

---

### 5.8 Módulo H — Super-Admin de Aliflow

> ✅ **Confirmado por Negocios el 8-ago-2026.** El sistema tiene **cuatro roles primarios**: Estudiante, Operador, Proveedor y Super-Admin. Queda pendiente únicamente el respaldo documental: el acuerdo del 30-jul fue verbal y el acta no lo recoge. **El acta de conformidad de este documento (entregable 01.e) resuelve ese vacío**, porque el cliente firma sobre una especificación que sí declara los cuatro roles.

#### RF-43 · Dar de alta un local
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC18

El Super-Admin debe poder registrar un local nuevo con sus datos, crear su vista de proveedor y su primera cuenta de Proveedor, y configurar su integración con el ERP.

**Criterios de aceptación**
1. Al terminar el alta, el local puede publicar menú y vender sin ninguna intervención manual sobre la base de datos.
2. La primera cuenta de Proveedor creada puede a su vez crear el resto del personal del local (RF-04).

#### RF-44 · Activar y desactivar locales
**Prioridad:** Debería · **Estado:** ✅ · **Origen:** UC20

El Super-Admin debe poder activar o desactivar un local.

**Criterios de aceptación**
1. Un local desactivado deja de aparecer en el selector del estudiante (RF-15).
2. Desactivar un local **no** elimina sus órdenes históricas ni impide entregar las órdenes ya compradas.

#### RF-45 · Brindar soporte con visibilidad transversal
**Prioridad:** Debería · **Estado:** ✅ · **Origen:** UC19

El Super-Admin debe poder consultar el estado de cualquier local: órdenes, sincronización con su ERP, cupo reservado e incidencias.

**Criterios de aceptación**
1. Es el único rol que puede ver información de más de un local.
2. Cada acceso a datos de un local queda registrado en auditoría con el identificador del Super-Admin (RN-10).

#### RF-46 · Monitorear el estado de todas las integraciones
**Prioridad:** Debería · **Estado:** 🟡 · **Origen:** UC20, riesgo R-16

El Super-Admin debería contar con una vista consolidada del estado de sincronización de **todos** los locales.

**Criterios de aceptación**
1. La vista permite identificar en una pantalla qué locales tienen eventos fallidos acumulándose.
2. *(Justificación: R-16 advierte que el panel por local le sirve al Proveedor pero no al equipo de Aliflow, que es quien opera N integraciones heterogéneas.)*

---

### 5.9 Módulo I — Integración con ERP externos

#### RF-47 · Exponer una interfaz única de integración
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC7, `Hallazgos-Ingenieria-API-Generica.md` §3

El núcleo del sistema debe comunicarse con cualquier ERP a través de una única interfaz abstracta, sin conocer nunca la implementación concreta.

**Criterios de aceptación**
1. Ninguna clase de dominio importa un SDK ni un cliente HTTP específico de un ERP.
2. La interfaz es bidireccional: lectura de menú y stock; escritura de ventas y pagos.
3. No existe ningún condicional sobre el tipo de ERP fuera de la fábrica de adaptadores.

#### RF-48 · Seleccionar el adaptador según el local
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** `ProviderAdapterFactory`

El sistema debe resolver automáticamente qué adaptador usar a partir del tipo de ERP configurado en el local.

**Criterios de aceptación**
1. Agregar un ERP nuevo requiere una clase adaptadora nueva y un valor de configuración, **cero cambios** en el núcleo.
2. Varios adaptadores distintos operan simultáneamente en producción sin interferir entre sí.

#### RF-49 · Notificar cada venta al ERP del local mediante cola de eventos
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** UC4c, patrón Outbox, riesgo R-02

Cada compra confirmada debe encolar un evento de notificación al ERP; el envío nunca debe ser síncrono dentro de la transacción de compra.

**Criterios de aceptación**
1. Si el ERP está caído, la compra se confirma igual y el evento queda pendiente con reintentos. **No existe la venta huérfana** (cobrada al estudiante y desconocida por el local).
2. Reprocesar un evento ya procesado no duplica la venta en el ERP (idempotencia por identificador de evento).
3. Un evento que agota sus reintentos queda en estado fallido, visible en RF-40, nunca descartado en silencio.

#### RF-50 · Notificar los pagos al ERP
**Prioridad:** Debería · **Estado:** ✅ · **Origen:** Decisión #1, `TipoEvento.NOTIFICAR_PAGO`

El sistema debe poder devolver al ERP del local la información de pago asociada a la venta, para que su contabilidad quede cuadrada.

**Criterios de aceptación**
1. El evento de pago sigue el mismo mecanismo de cola y reintentos que el de venta.

#### RF-51 · Sincronizar el catálogo desde el ERP por consulta periódica
**Prioridad:** Debería · **Estado:** ✅ · **Origen:** UC3a, `Hallazgos-Ingenieria-API-Generica.md` §3

El sistema debe poder obtener menú y stock del ERP de cada local mediante consulta periódica.

**Criterios de aceptación**
1. La sincronización usa **consulta periódica (polling)**, porque **ningún ERP del alcance ofrece webhooks**.
2. El stock traído del ERP se guarda como dato **informativo** y **no** condiciona la venta (RN-02).
3. Un fallo de sincronización no interrumpe la operación de venta de Aliflow.

#### RF-52 · Operar contra un ERP simulado
**Prioridad:** Debe · **Estado:** 🟡 · **Origen:** Riesgo R-01 (acción 2)

El sistema debe poder operar completamente contra un **ERP simulado**, sin credenciales de ningún ERP real.

**Criterios de aceptación**
1. Todo el flujo —menú, compra, notificación de venta, reintentos— se ejecuta de extremo a extremo contra el simulador.
2. Cambiar del simulador a un ERP real es cambio de configuración, no de código del núcleo.
3. *(Justificación: R-01 es el único riesgo catastrófico del proyecto y **no se puede mitigar con trabajo de Ingeniería** — depende de que un tercero entregue credenciales. Este requerimiento lo convierte en manejable: el adaptador se construye y se demuestra igual, y el día que lleguen las credenciales solo hay que enchufarlo.)*

#### RF-53 · Integrar un ERP sin API mediante vía alternativa
**Prioridad:** Podría · **Estado:** 🟡 · **Origen:** Riesgo R-11, decisión #1

Para un local cuyo ERP no expone API —el caso de Alpwin—, el sistema debería integrarse por archivos o base de datos puente, aceptando sincronización por lotes.

**Criterios de aceptación**
1. La ausencia de API en un local **no** degrada la operación de los demás locales.
2. *(Nota: esta vía no está confirmada; depende de la respuesta del proveedor de ese ERP. Ya no bloquea el piloto, porque el local piloto usa un ERP con API REST documentada.)*

---

### 5.10 Módulo J — Auditoría

#### RF-54 · Registrar en auditoría las operaciones sensibles
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** RN-10, riesgo R-09

El sistema debe registrar quién ejecutó cada operación que mueve dinero o cambia el estado de una orden: confirmación de compra, confirmación de entrega, invalidación de código, acreditación al local, y accesos transversales del Super-Admin.

**Criterios de aceptación**
1. Cada registro contiene actor, rol, acción, entidad afectada y marca de tiempo.
2. Los registros de auditoría **no** son editables ni eliminables desde ninguna interfaz del sistema.

#### RF-55 · Registrar los intentos de validación fallidos
**Prioridad:** Debería · **Estado:** 🟡 · **Origen:** Riesgo R-15

Cada intento fallido de validar un código de retiro debe quedar registrado con el Operador y el instante.

**Criterios de aceptación**
1. Es posible detectar en el registro una secuencia de fallos que sugiera un intento de adivinación por fuerza bruta.

#### RF-56 · Conservar el histórico sin borrado
**Prioridad:** Debe · **Estado:** ✅ · **Origen:** Acta 30-jul §2.1

Recargas, órdenes y movimientos de saldo deben conservarse en histórico para auditoría y conciliación.

**Criterios de aceptación**
1. No existe ninguna operación del sistema que elimine físicamente un movimiento de dinero.
2. Una corrección se representa como **movimiento compensatorio**, nunca modificando o borrando el original. *(🟡 El modelo actual todavía no tiene este mecanismo; hace falta si la política de reembolso de órdenes expiradas implica devolución — ver sección 7.)*

---

## 6. Requerimientos no funcionales

Clasificados según **Ian Sommerville**: *de producto* (propiedades del sistema entregado), *organizacionales* (derivadas de las políticas y procedimientos de la organización que desarrolla o usa el sistema) y *externos* (derivados de factores externos al sistema y a su proceso de desarrollo). Cada uno lleva su **criterio de validación**: cómo se comprueba que se cumple.

### 6.1 Requerimientos de producto

#### Usabilidad

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-P-01** | La validación de un código de retiro por parte del Operador debe completarse en **una sola pantalla** y sin más de 8 pulsaciones (6 dígitos + confirmar). | Prueba de recorrido sobre el prototipo: contar pulsaciones desde la pantalla de inicio del Operador hasta la confirmación. Debe ser ≤ 8. |
| **RNF-P-02** | El código de retiro debe ser legible y dictable de viva voz: **6 dígitos numéricos**, presentado con separación visual y en un estilo tipográfico específico. | Inspección del sistema de diseño (existe un estilo de texto dedicado al código) y prueba con 5 usuarios dictando el código sin repetirlo. |
| **RNF-P-03** | Un estudiante que usa la aplicación por primera vez debe completar el flujo de compra sin instrucciones externas. | Prueba de usabilidad con 5 estudiantes que no participaron en el diseño: ≥ 4 completan la compra sin ayuda. |
| **RNF-P-04** | La interfaz del Operador debe ser utilizable en tablet o móvil sostenido con una mano, con los controles de acción en la mitad inferior de la pantalla. | Revisión del prototipo a 390×844: los controles primarios están en el tercio inferior. |
| **RNF-P-05** | Todo texto sobre color de marca debe alcanzar contraste **AA de WCAG 2.1** (4.5:1 para texto normal). | Verificación de contraste sobre las variables de color del sistema de diseño. *(Ya aplicado: el verde del logo da 2.6:1 y por eso **no** se usa en botones con texto blanco; las acciones usan un verde más profundo — `mockups/marca/`.)* |
| **RNF-P-06** | Los mensajes de error deben indicar **qué pasó y qué hacer**, sin códigos técnicos ni jerga. | Revisión de los mensajes de los tres estados de fallo de código (RF-28) y de los fallos de compra (RF-19). |

#### Eficiencia y rendimiento

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-P-07** | La confirmación de una compra debe responder en **≤ 2 s** en el percentil 95, medida desde la petición hasta la respuesta del backend. | Prueba de carga con 50 compras concurrentes; medir p95. |
| **RNF-P-08** | La validación de un código de retiro debe responder en **≤ 1 s** en el percentil 95. | Prueba de carga sobre el endpoint de validación. *(Justificación: ocurre con una fila de estudiantes esperando; es el punto del sistema con menos tolerancia a la latencia.)* |
| **RNF-P-09** | La consulta del menú del día **no debe depender de una llamada síncrona al ERP**. | Prueba con el ERP simulado apagado: el menú responde igual (RF-14 criterio 3). |
| **RNF-P-10** | El sistema debe sostener la carga concurrente de la hora pico de almuerzo sin degradar los dos requerimientos anteriores. | Prueba de carga con el perfil estimado de la franja 12:00–14:00 en el campus. *(La cifra exacta de usuarios concurrentes está sin estimar — ver sección 10.)* |

#### Fiabilidad y disponibilidad

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-P-11** | **Ninguna venta puede quedar huérfana**: si el ERP está caído, la venta se registra igual y se sincroniza después. | Prueba de integración: apagar el ERP simulado, comprar, verificar que la orden existe y el evento queda pendiente; encender el ERP y verificar que se procesa. |
| **RNF-P-12** | Los eventos hacia el ERP deben ser **idempotentes**: reprocesar un evento no duplica su efecto. | Prueba de integración: reenviar el mismo evento dos veces y verificar una sola venta en el ERP. |
| **RNF-P-13** | Las operaciones que descuentan saldo y cupo deben ser **atómicas**: no existe estado intermedio observable. | Prueba de concurrencia (RF-21) y revisión de los límites transaccionales en el código. |
| **RNF-P-14** | La caída del ERP de un local **no** debe afectar la operación de los demás locales. | Prueba con dos locales configurados: apagar el ERP de uno y verificar que el otro opera con normalidad. |
| **RNF-P-15** | El sistema debe estar disponible durante toda la franja de almuerzo de días hábiles. | Monitoreo de disponibilidad en la franja 11:00–15:00; objetivo ≥ 99% mensual sobre esa ventana. *(Fuera de esa franja el impacto de una caída es bajo — es un sistema con demanda concentrada.)* |

#### Seguridad (propiedades del producto)

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-P-16** | Todo el tráfico entre cliente, backend y servicios externos debe viajar sobre **HTTPS/TLS**, sin excepción. | Inspección de la configuración de despliegue; ninguna ruta acepta HTTP en claro. |
| **RNF-P-17** | Las contraseñas de las cuentas operativas deben almacenarse con una función de derivación de clave con sal por registro. | Revisión de código e inspección de la base de datos: ninguna contraseña legible ni con hash simple. |
| **RNF-P-18** | **No debe existir en ninguna tabla** el número completo de una tarjeta ni su código de seguridad (RN-06). | Auditoría del esquema y consulta de verificación sobre la base de datos poblada. |
| **RNF-P-19** | Las credenciales de los ERP y **las credenciales de comercio de la pasarela de cada establecimiento** deben almacenarse cifradas y no ser legibles desde ninguna interfaz. | Inspección de la base de datos y del panel; revisión de que no se registren en los logs. *(La decisión #13 multiplica este requerimiento: ya no es un juego de credenciales de pasarela, sino uno por local.)* |
| **RNF-P-20** | La autorización debe verificarse **en el backend en cada petición**; ocultar un elemento en la interfaz no constituye control de acceso. | Prueba de seguridad: invocar directamente endpoints de otro rol y de otro local con un token válido del rol inferior. Todos deben rechazarse. |
| **RNF-P-21** | Toda entrada del usuario debe validarse en el backend con listas de valores permitidos, sin confiar en la validación del cliente. | Pruebas con entradas maliciosas sobre los endpoints de compra, validación de código y configuración de cupo. |
| **RNF-P-22** | El sistema debe seguir las prácticas del **OWASP Top 10** en autenticación, control de acceso, inyección y exposición de datos. | Revisión de código cruzada entre integrantes, con lista de verificación OWASP, sobre los cuatro endpoints críticos: autenticación, billetera, órdenes y validación de códigos. *(Mitigación de R-03: el equipo tiene poca experiencia construyendo APIs seguras.)* |

#### Portabilidad y mantenibilidad

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-P-23** | El sistema debe ser **una sola aplicación web responsiva**, no aplicaciones nativas por rol. | Verificación de los cuatro roles en navegador de escritorio y móvil. |
| **RNF-P-24** | Debe funcionar en las dos últimas versiones estables de los navegadores mayoritarios, en escritorio y móvil. | Prueba de humo de los flujos principales en cada navegador objetivo. |
| **RNF-P-25** | Agregar un local con un ERP nuevo debe requerir **una clase adaptadora nueva y configuración**, sin modificar el núcleo. | Ejercicio de extensión: agregar un adaptador nuevo y verificar por diff que no se tocó ningún archivo del núcleo. |
| **RNF-P-26** | El diseño debe ser consistente con los **principios SOLID** y no introducir malos olores (clase Dios, obsesión por primitivos, acoplamiento a implementación externa). | Revisión del diagrama de clases contra la tabla de SOLID y la de malos olores de `uml/Documentacion-Diagrama-Clases.md`. |

### 6.2 Requerimientos organizacionales

#### De proceso y desarrollo

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-O-01** | Todo el trabajo debe versionarse en el repositorio público del proyecto, con historial que evidencie el proceso. | Inspección del historial de commits del repositorio. |
| **RNF-O-02** | Todo diagrama UML debe tener su **fuente editable** versionada junto a su imagen renderizada, y ambas deben estar sincronizadas. | Verificación de que cada `.svg` tiene su `.puml` correspondiente y refleja su contenido actual. |
| **RNF-O-03** | Toda propuesta de Ingeniería no validada por el cliente debe estar **visualmente distinguible** de una decisión confirmada, en documentos, diagramas y prototipo. | Verificación de la convención: estereotipo `<<propuesta>>` y fondo amarillo en UML; etiqueta "Pendiente de Negocios" en el prototipo; marca 🟡 en este documento. |
| **RNF-O-04** | Todo cambio de requerimiento posterior al cierre de alcance debe pasar por **control de cambios con reestimación**, no absorberse en silencio. | Existencia del registro de decisiones con fecha, y trazabilidad de cada cambio a la reunión que lo originó. *(Mitigación de R-08, que ya se materializó parcialmente.)* |
| **RNF-O-05** | Los endpoints críticos —autenticación, billetera, órdenes, validación de códigos— deben pasar por **revisión de código entre integrantes** antes de integrarse. | Evidencia de revisión en el historial del repositorio para esos módulos. |
| **RNF-O-06** | El alta de cada local nuevo debe ejecutarse como un **procedimiento con lista de verificación** (credenciales, mapeo de productos, prueba de humo bidireccional), no como un cambio de configuración informal. | Existencia del procedimiento documentado y de su registro de ejecución por local. *(Mitigación de R-16.)* |
| **RNF-O-07** | El proyecto debe mantener un **registro de riesgos vivo**, revisado en cada reunión con el cliente. | `Gestion-de-Riesgos.md` con fechas de revisión y riesgos incorporados tras cada reunión. |

#### Operacionales

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-O-08** | El cupo reservado es responsabilidad operativa del **Proveedor**, que debe mantenerlo al día manualmente. | Procedimiento operativo entregado al local, más las alertas de RF-17 y la métrica de RF-18. *(Este requerimiento existe porque el inventario reservado traslada una carga operativa al local — riesgo R-20.)* |
| **RNF-O-09** | La emisión de la factura fiscal es responsabilidad del **local**, no de Aliflow. Aliflow entrega los datos (RF-41). | Verificación de que ningún flujo del sistema invoca un servicio de facturación electrónica. |
| **RNF-O-10** | Debe existir un **procedimiento manual de contingencia** documentado para la entrega de almuerzos cuando falle la conectividad en el punto de entrega. | Existencia del procedimiento escrito y entregado a los Operadores. *(R-12 se aceptó formalmente: v1 no tiene modo offline; la contingencia es organizacional, no técnica.)* |
| **RNF-O-11** | Debe existir un **procedimiento de conciliación** entre las ventas de Aliflow y los registros del ERP de cada local, con un responsable designado por local. | Procedimiento documentado y ejecutado al menos una vez durante el piloto. *(Mitigación de R-02.)* |

#### De entrega

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-O-12** | El alcance integrado en el piloto se limita a los **dos locales confirmados**; los demás quedan como demostración de extensibilidad, no como entregable. | Declaración explícita de alcance en este documento (sección 8) y en el registro de riesgos. *(Mitigación de R-16.)* |
| **RNF-O-13** | No debe comprometerse fecha de piloto con el cliente antes de contar con las credenciales del ERP del local piloto. | Verificación de que ningún compromiso de fecha precede a la recepción de credenciales. *(Mitigación de R-01.)* |
| **RNF-O-14** | El alcance del módulo de fidelidad queda **congelado** en "una cartilla simple: N sellos → 1 premio, por local". Puntos, niveles o campañas por temporada son otro proyecto. | Declaración de alcance en sección 8; cualquier variante entra por RNF-O-04. *(Mitigación de R-17.)* |

### 6.3 Requerimientos externos

#### Legales y regulatorios

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-E-01** | Aliflow **no puede emitir comprobantes con validez tributaria**. Toda factura electrónica es emitida por el local desde su propio ERP, bajo su RUC y su firma electrónica. | Verificación de que todos los comprobantes del sistema llevan la marca de "sin validez tributaria" y de que no existe integración con el servicio de facturación electrónica. *(No es una preferencia de diseño: emitir con validez tributaria implicaría certificado de firma digital, RUC emisor, secuenciales autorizados y responsabilidad fiscal — y significaría que Aliflow le vende el almuerzo al estudiante, no el local. Cambia el modelo de negocio, no solo el software.)* |
| **RNF-E-02** | El tratamiento de datos personales de estudiantes debe ajustarse a la normativa ecuatoriana de protección de datos personales: recolectar el mínimo necesario, con finalidad declarada. | Inventario de datos personales tratados, con su finalidad, revisado contra el principio de minimización. Verificar que no se recolecta ningún dato que ningún requerimiento use. |
| **RNF-E-03** | El sistema **no debe entrar en alcance de PCI-DSS**: los datos de tarjeta se tratan exclusivamente en la pasarela, y Aliflow solo custodia tokens (RN-06). | Auditoría del esquema (RNF-P-18) y verificación de que ningún formulario propio captura número de tarjeta o código de seguridad. |
| **RNF-E-04** | **Aliflow no debe llegar a custodiar fondos de terceros en ningún flujo** (RN-14), evitando así la exposición regulatoria de esa figura. | Verificar que ningún flujo deja dinero en una cuenta controlada por Aliflow: el destino de cada recarga es la cuenta del proveedor, y el sistema no ofrece retiro, devolución en efectivo ni transferencia de saldo. *(Cerrado el 8-ago-2026 por la decisión #13: la recarga es por establecimiento.)* |
| **RNF-E-05b** | El saldo prepagado constituye una **obligación del establecimiento con el estudiante**, no de Aliflow. Esto debe ser explícito para el estudiante y estar acordado con cada local. | Verificar que la interfaz de recarga lo comunica (RF-08 criterio 6) y que el acuerdo comercial con cada local lo recoge. *(Consecuencia directa de RN-14: si un local cierra o sale de la plataforma, Aliflow no puede devolver un dinero que nunca tuvo — ver riesgo R-23.)* |

#### De interoperabilidad

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-E-05** | El sistema debe integrarse con ERP **heterogéneos y fuera de su control**, sin poder imponerles cambios. | Verificación de que la interfaz de integración solo asume capacidades que el ERP ya ofrece. |
| **RNF-E-06** | El sistema **no puede depender de webhooks del ERP**: ninguno de los ERP del alcance los ofrece. La dirección ERP → Aliflow es por consulta periódica. | Revisión de la arquitectura de sincronización: no existe ningún endpoint entrante desde un ERP. |
| **RNF-E-07** | La autenticación del Estudiante depende de un proveedor de identidad externo; una caída de ese proveedor impide el ingreso de estudiantes. | Riesgo aceptado y documentado. Verificar que el mensaje de error distingue "el proveedor de identidad no responde" de "credenciales inválidas". |
| **RNF-E-08** | La acreditación de saldo debe depender de la **confirmación de la pasarela**, no de la respuesta del navegador del estudiante. | Prueba: cerrar el navegador tras pagar y verificar que el saldo se acredita igual cuando llega la confirmación de la pasarela. |
| **RNF-E-09** | La pasarela seleccionada debe ofrecer **webhooks** y un ambiente de pruebas utilizable. | Criterio de la comparación de pasarelas (decisión #12), verificado antes de seleccionar. |
| **RNF-E-10** | La pasarela debe permitir que **cada recarga se deposite en la cuenta del establecimiento destino**, operando con credenciales de comercio propias de cada local. **Ya no se requiere soporte de pagos divididos.** | Verificación en la comparación de pasarelas: confirmar que admite múltiples cuentas de comercio operadas por una misma aplicación. *(La decisión #13 cerró R-19: al ser la recarga por establecimiento, cada pago tiene un único destinatario y el* split *deja de ser necesario. El universo de pasarelas candidatas se amplía.)* |
| **RNF-E-11b** | 🟡 Todos los establecimientos deben poder operar con la **misma pasarela**, o el sistema debe soportar más de una. | Confirmar, antes de seleccionar pasarela, que los locales confirmados pueden abrir cuenta de comercio en ella. *(Requerimiento nuevo creado por la decisión #13 — ver riesgo R-22. Si un local no puede o no quiere abrir cuenta, no puede vender por Aliflow.)* |

#### Éticos y de equidad

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-E-11** | El sistema no debe crear un canal privilegiado que perjudique al estudiante que compra en caja: el cupo de Aliflow sale de una partición acordada con el local, no de una prioridad sobre la fila física. | Verificación de que el cupo es un valor que el Proveedor asigna libremente y puede poner en cero. |
| **RNF-E-12** | El sistema no debe exponer datos de consumo de un estudiante a otros estudiantes ni a locales donde no ha comprado. | Prueba de control de acceso (RNF-P-20) sobre los endpoints de historial y cartilla. |

---

## 7. Requerimientos bloqueados por decisiones abiertas

Esta sección existe para que **nadie construya sobre arena**. Son los puntos donde no se puede escribir un criterio de aceptación porque falta una decisión del cliente.

> ✅ **Cerrado el 8-ago-2026 — decisión #13.** Negocios respondió: **la recarga se hace por establecimiento**, con el modelo de *Parqueo Positivo* como referencia. Es la salida B. Con eso **se desbloquea el esquema completo de la billetera** —era lo único que quedaba congelado del modelo de datos— y se cierran los riesgos R-18 y R-19. El costo es que **se revierte la decisión #4**: ya no hay saldo único. Las tres consecuencias nuevas están abajo.

| Bloqueo | Requerimientos afectados | Qué se necesita | Consecuencia de construir sin la respuesta |
|---|---|---|---|
| 🔴 **Reembolso de órdenes expiradas** *(ahora más difícil)* | RF-29 (criterio 3), RF-56 (criterio 2) | Qué pasa con el dinero de una orden que venció sin retirarse: ¿se devuelve al saldo del estudiante en ese local, se pierde, o se le queda al proveedor porque el almuerzo se preparó? | **La decisión #13 acotó las salidas posibles:** como Aliflow no custodia fondos (RN-14), no puede devolver dinero — a lo sumo puede reacreditar saldo en ese mismo establecimiento, y eso es una obligación del proveedor, no de Aliflow. Si la respuesta implica devolución, hace falta el mecanismo de **movimientos compensatorios**, que el modelo actual no tiene. |
| 🟡 **Saldo huérfano** *(nuevo, creado por la decisión #13)* | RF-07, RNF-E-05b | Qué pasa con el saldo que un estudiante deja en un local cuando se gradúa, o cuando el local sale de la plataforma. | Aliflow **no puede devolverlo**: nunca tuvo el dinero. Sin una política acordada con cada local, el estudiante pierde el saldo y el reclamo llega igual a Aliflow. Ver riesgo R-23. |
| 🟡 **Cuenta de comercio por establecimiento** *(nuevo, creado por la decisión #13)* | RF-08, RNF-E-10, RNF-E-11b | Confirmar que cada local puede abrir su propia cuenta de comercio en la pasarela que se elija. | Un local que no pueda o no quiera abrir cuenta **no puede vender por Aliflow**. Es una condición de alta, no un detalle técnico. Ver riesgo R-22. |
| 🔴 **Representación del canje de $0 en el ERP** | RF-37 | Verificación técnica contra la documentación de cada ERP: documento de cortesía o descuento del 100%. | Un `notifySale` con monto cero puede ser rechazado por el ERP como error. |
| 🔴 **Decisión #12 — pasarela de pagos** | RF-08, RF-11, RNF-E-08, RNF-E-09, RNF-E-10 | Comparación y selección, con los ocho criterios acordados en el acta. | No se puede maquetar ni construir el flujo de pago sin saber si es modal, ventana integrada o página externa. |
| ⬜ **Decisión #7 — modelo de cobro al proveedor** *(se volvió más restringida)* | Ninguno de v1, pero condiciona la elección de pasarela | Comisión por transacción, suscripción fija u otro. | **La decisión #13 eliminó el punto donde encajaba una comisión:** el dinero nunca pasa por Aliflow, así que no hay momento en que se pueda retener. Quedan tres formas —suscripción fija, comisión facturada a posteriori, o comisión retenida por la pasarela— y **la tercera reabre el requisito de *split*** que la #13 nos permitió abandonar. |
| 🟡 **Valores del programa de fidelidad** | RF-32 *(no bloquea)* | Cuántos sellos requiere la cartilla y en qué consiste el premio. | Ninguna: están modelados como configuración por local a propósito. Definirlos es cargar un valor en base de datos. |

---

## 8. Fuera del alcance de v1

Declarado explícitamente, con la razón. Lo que no está aquí ni en la sección 5 **no forma parte del sistema**.

| Fuera de alcance | Razón |
|---|---|
| **Modo offline del Operador** | Decisión de negocio confirmada. Riesgo R-12 aceptado formalmente, con procedimiento manual de contingencia (RNF-O-10). |
| **Aliflow como emisor de facturas electrónicas** | RNF-E-01. Cambiaría el modelo de negocio, no solo el software. |
| **Aplicaciones móviles nativas** | Una sola aplicación web responsiva cubre los cuatro roles (RNF-P-23). |
| **Lector de códigos QR o de barras** | Negocios eligió código numérico dictado de viva voz. No hay escáner en ninguna parte del sistema. |
| **Programa de fidelidad con puntos, niveles o campañas por temporada** | Alcance congelado en cartilla simple (RNF-O-14). Cualquier variante entra por control de cambios. |
| **Integración con más de dos locales en el piloto** | RNF-O-12. El modelo admite N; el piloto integra los dos confirmados. |
| **Pedidos programados para días futuros** | No solicitado. El código vale solo el día de la compra (RN-03), lo que presupone compra y consumo el mismo día. |
| **Entrega a domicilio o a un punto distinto del local** | No solicitado. La entrega es presencial en el punto de entrega del local. |
| **Reservas sin pago** | La orden solo existe después de descontar el saldo (RF-19). |
| **Recuperación de contraseña autoservicio para roles operativos** | Lo resuelve el Proveedor de cada local (RF-04) o el Super-Admin (RF-45). |
| **Saldo único gastable en cualquier local** | Revertido por la decisión #13 el 8-ago-2026. El saldo es por establecimiento (RN-13). |
| **Transferir saldo de un establecimiento a otro** | Exigiría que Aliflow mueva dinero entre cuentas de terceros, que es justo lo que el acta §3.9 prohíbe (RN-14). Ver RF-12b. |
| **Retiro del saldo en efectivo** | Mismo motivo: Aliflow no tiene el dinero, no puede devolverlo. |
| **Reembolsos y devoluciones** | 🔴 Bloqueado, no descartado. Depende de la política de órdenes expiradas — ver sección 7. |

---

## 9. Trazabilidad

### 9.1 Requerimientos ↔ casos de uso ↔ pantalla del prototipo

| RF | Caso de uso | Pantalla del prototipo | Riesgo asociado |
|---|---|---|---|
| RF-01, RF-02 | UC1, UC1a, UC1b | Estudiante 01 | — |
| RF-03 | UC6 | Proveedor 01, Operador 01, Super-Admin 01 | — |
| RF-04 | UC12 | *(sin pantalla — fuera de esta ronda)* | — |
| RF-05, RF-06 | — | *(transversal)* | R-09 |
| RF-07, RF-08, RF-09, RF-10, RF-11 | UC2, UC2a | Estudiante 05 | R-06, R-18 |
| RF-12 | UC2 | *(sin pantalla — es interno)* | R-18 |
| RF-13 | UC8 | Proveedor 03 | — |
| RF-14, RF-15 | UC3, UC3a | Estudiante 02 | — |
| RF-16, RF-17, RF-18 | UC16 | Proveedor 03 | R-20 |
| RF-19, RF-20, RF-21, RF-22 | UC4, UC4a, UC4b | Estudiante 03 | R-02 |
| RF-23 | UC17 | Estudiante 04 | — |
| RF-24 | UC11 | Estudiante 06 | — |
| RF-25, RF-26, RF-27 | UC5, UC5a, UC5b | Operador 02, Operador 03 | R-14, R-15 |
| RF-28 | UC5c | Operador 04, Operador 05 | — |
| RF-29 | UC5c | Estudiante 06 (estado Expirado) | R-13 *(cerrado)* |
| RF-30, RF-31 | UC5a, UC5c | Operador 02 | R-15 |
| RF-32 | UC14 | Proveedor 05 | R-17 |
| RF-33 | UC5d | Operador 03 | R-17 |
| RF-34 | UC13 | Estudiante 07 | R-17 |
| RF-35, RF-36, RF-37 | UC15 | Estudiante 08 | R-17 |
| RF-38 | UC9 | Proveedor 02 | — |
| RF-39 | UC17 | Proveedor 03 | — |
| RF-40 | UC10 | Proveedor 04 | R-02, R-16 |
| RF-41 | UC11 | *(sin pantalla — descarga)* | — |
| RF-42 | UC7 | *(sin pantalla — trabajo técnico)* | R-01, R-11 |
| RF-43, RF-44 | UC18, UC20 | Super-Admin 02 | — |
| RF-45 | UC19 | Super-Admin 03 | — |
| RF-46 | UC20 | Super-Admin 03 | R-16 |
| RF-47, RF-48 | UC7 | — | R-16 |
| RF-49, RF-50 | UC4c | Proveedor 04 | R-02 |
| RF-51 | UC3a | Proveedor 04 | — |
| RF-52 | — | — | **R-01** |
| RF-53 | UC7 | — | R-11 |
| RF-54, RF-55, RF-56 | — | *(transversal)* | R-09, R-15 |

### 9.2 Riesgos ↔ requerimientos que los mitigan

Solo los riesgos que se mitigan **con requerimientos del sistema**. Los que se mitigan con acciones de gestión están en `Gestion-de-Riesgos.md`.

| Riesgo | Requerimientos que lo atienden |
|---|---|
| R-01 — Sin credenciales del ERP piloto | **RF-52** (ERP simulado), RNF-O-13 |
| R-02 — Inconsistencia entre saldo, facturación e inventario | RF-49, RF-40, RNF-P-11, RNF-P-12, RNF-O-11 |
| R-03 — Poca experiencia en APIs seguras | RNF-P-22, RNF-O-05 |
| R-06 — Ambiente de pruebas de pagos limitado | RF-08 (estados de pago), RNF-E-09 |
| R-08 — Cambios en el flujo de saldo y comprobantes | RNF-O-04 |
| R-09 — Requisitos de seguridad incompletos | RF-06, RF-54, RNF-P-16 a RNF-P-22 |
| R-11 — ERP sin API pública | RF-53, RNF-P-14 |
| R-12 — Operador sin modo offline | RNF-O-10 *(riesgo aceptado)* |
| R-14 — Doble redención del código | RF-27, RNF-P-13 |
| R-15 — Código corto adivinable | RF-25 (criterio 3), RF-31, RF-55 |
| R-16 — Costo de N ERP heterogéneos | RF-46, RNF-O-06, RNF-O-12 |
| R-17 — Cartilla con reglas sin definir | ✅ **Reglas confirmadas** el 8-ago. RF-32, RF-33, RF-35, RNF-O-14 |
| R-18 — Custodia de fondos vs. saldo único | ✅ **Cerrado** por la decisión #13. RN-13, RN-14, RF-08 |
| R-19 — Pasarela sin pagos divididos | ✅ **Cerrado**: el *split* dejó de ser necesario |
| R-20 — Cupo desactualizado manualmente | RF-17, RF-18, RNF-O-08 |
| R-21 — Saldo fragmentado entre establecimientos | RF-07 (criterio 2), RF-08 (criterio 6), RF-12 (criterio 3), RF-15 |
| R-22 — Local sin cuenta de comercio en la pasarela | RNF-E-10, RNF-E-11b, RNF-O-06 |
| R-23 — Saldo huérfano | RNF-E-05b *(se transfiere por contrato — ver sección 7)* |

---

## 10. Evidencias del levantamiento de requerimientos

*(Entregable 01.d — evidencias de técnicas de levantamiento y metodologías seguidas.)*

### 10.1 Técnicas utilizadas

| Técnica | Cómo se aplicó | Evidencia en el repositorio |
|---|---|---|
| **Entrevistas / reuniones con el cliente** | Tres sesiones con el Grupo de Negocios: 25-jun, 28-jul y 30-jul de 2026. | `Acta Reunión Aliflow 3.pdf`, `ACTA DE REUNIÓN ALIFLOW 30 JULIO.pdf` |
| **Análisis de documentos** | Revisión del flujo funcional original y del marco de negocio, de donde salen las referencias `est-n`, `prov-n`, `op-n` de cada caso de uso. | `Flujos-Aliflow-Revision.html` |
| **Prototipado evolutivo** | Prototipo de alta fidelidad e interactivo con los cuatro roles compartiendo estado, usado como instrumento de validación con el cliente, no solo como entregable. | https://jesus-jb.github.io/aliflow/ · `mockups/` |
| **Investigación técnica y prueba de concepto** | Demo funcional con un ERP real en contenedores, con pruebas de concurrencia. Produjo un hallazgo que cambió el diseño. | `demo-odoo/`, `Hallazgos-Ingenieria-API-Generica.md` |
| **Registro de decisiones y control de cambios** | Documento vivo que lleva la cuenta de qué está cerrado, qué sigue abierto y qué cambió en el diseño como consecuencia. Usado como material de preparación de cada reunión. | `Decisiones-Pendientes-Negocios.md` |
| **Análisis de riesgos** | Matriz de 20 riesgos con probabilidad, impacto y estrategia, revisada tras cada reunión. Varios requerimientos de este documento nacieron de un riesgo. | `Gestion-de-Riesgos.md` |
| **Modelado UML como herramienta de descubrimiento** | Diagramar reveló vacíos que la conversación no había expuesto —orden multi-local no prevenida, ausencia de estado para orden no retirada, ausencia de auditoría—, corregidos como requerimientos. | `uml/` |

### 10.2 Hallazgos del levantamiento que cambiaron el producto

No todo salió de preguntar. Estos tres salieron de analizar lo que se respondía:

1. **Contradicción sobre el comprobante tributario.** El acta del 25-jun y el flujo funcional decían cosas opuestas sobre el mismo punto. Tomado literalmente, el acta convertía a Aliflow en el emisor fiscal de cada almuerzo —es decir, en el vendedor del almuerzo, no el local—. Se llevó a Negocios y se cerró a favor del modelo correcto (RN-09, RNF-E-01).
2. **El inventario compartido no tenía solución de sincronización.** Dos sistemas escribiendo el mismo contador sin transacción común: sincronizar más seguido achica la ventana de error, no la cierra. Se llevó como problema, y Negocios respondió con el inventario reservado, que convierte un problema de consistencia distribuida en uno de partición de recursos (RN-02, RF-16).
3. **La concurrencia no se puede delegar en el ERP.** Se intentó, empíricamente, y falló: 5 hilos comprando con 3 unidades de stock vendieron 5. El resultado se documentó como hallazgo de arquitectura y se convirtió en RN-11 y RF-21.

### 10.3 Ambigüedad detectada y resuelta: la palabra "cartilla"

Un documento de requerimientos no oficial elaborado por otro equipo del curso usa "cartilla" con un significado **distinto** al de este documento: allí es un **paquete prepago de almuerzos** (comprar 5, 10, 15 o 20 y consumirlos), aquí es una **tarjeta de sellos de fidelidad**. Dos productos diferentes con el mismo nombre, sobre la misma palabra dicha por el cliente.

Se detectó comparando ambos documentos y se llevó a Negocios como pregunta explícita. ✅ **Resuelta el 8-ago-2026: es la tarjeta de sellos.** El módulo F estaba modelando el producto correcto.

Vale registrarlo como evidencia de método: la ambigüedad no la produjo una falta de información, sino un término que **las dos partes creían entender**. Solo apareció al contrastar dos interpretaciones independientes del mismo requisito.

---

## 11. Estado de completitud de este documento

Dicho sin adornos, para que no haya sorpresas al armar el PDF final.

**Lo que este documento cubre:** los requerimientos funcionales organizados por módulo con criterios de aceptación verificables, los no funcionales clasificados según Sommerville con criterio de validación cada uno, las reglas de negocio transversales, el alcance excluido con su razón, la trazabilidad a casos de uso, pantallas y riesgos, y las evidencias del levantamiento.

**Lo que falta y no depende de Ingeniería:**

1. **Acta de conformidad firmada por el representante del cliente** (entregable 01.e), que va como apéndice. Es una dependencia externa con tiempo de respuesta que no controlamos: conviene pedirla ahora, no al cierre. **Además resuelve el respaldo documental del rol de Super-Admin**, acordado verbalmente y nunca escrito en un acta.
2. **Confirmar que los locales pueden abrir cuenta de comercio** en la pasarela que se elija (RNF-E-11b) — consecuencia nueva de la decisión #13.
3. **Política de saldo que ya no se puede gastar**: órdenes vencidas, saldo huérfano y caducidad por inactividad. Son la misma pregunta con tres disparadores.
4. **Decisión #7 — modelo de cobro al proveedor**, que ahora condiciona qué se le pide a la pasarela.

> ✅ **Resueltas el 8-ago-2026:** la decisión #13 (custodia de fondos — la recarga es por establecimiento, lo que desbloqueó el esquema completo de base de datos), las cinco reglas del programa de fidelidad, y la confirmación de los cuatro roles primarios.

**Propagación pendiente de la decisión #13.** Este documento y el registro de riesgos ya están actualizados. **Todavía describen el modelo antiguo de saldo único:** el diagrama de clases y su SVG, los mockups (Estudiante 02 y 05) y el prototipo web.

**Lo que falta y sí depende de Ingeniería:**

5. **Lista de integrantes, tabla de contenido, índice de tablas e índice de figuras** (entregable 01.a). Se generan al componer el PDF final, no en el Markdown.
6. **Capturas del prototipo y su flujo de ventanas como apéndice** (entregable 01.f). Las capturas existen en `mockups/`; falta el diagrama de flujo de navegación entre pantallas.
7. **Sprint backlogs y cronograma con diagramas *activity-on-arrow*** (entregable 01.g). `Gestion-de-Riesgos.md` cubre la parte de riesgos de ese entregable, **pero no los sprint backlogs ni el cronograma**. Es un hueco real y todavía no está empezado.
8. **Estimación de la carga concurrente esperada** en hora pico (RNF-P-10). Hoy el requerimiento existe sin cifra.

---

*Documento preparado por el Grupo de Ingeniería como entregable 01 — especificación de requerimientos del sistema de software. Los requerimientos marcados 🟡 son propuestas de Ingeniería pendientes de validación por el Grupo de Negocios; los marcados 🔴 están bloqueados por decisiones abiertas registradas en `Decisiones-Pendientes-Negocios.md`.*
