> **Entregable 01 · rúbrica: Contenido de otras secciones (3 pts)**
> Parte del documento de especificación de requerimientos. Se ensambla en el PDF único con `construir-pdf.sh` — ver [`../README.md`](../README.md).

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
| ✅ | **Confirmado por Negocios** — consta en acta o en una decisión cerrada de `../../Decisiones-Pendientes-Negocios.md`. |
| 🟡 | **Propuesta de Ingeniería** — diseño razonado que Negocios todavía no validó. Equivale al estereotipo `<<propuesta>>` de los diagramas UML y al color amarillo del prototipo. |
| 🔴 | **Bloqueado** — no se puede especificar hasta que se resuelva una decisión abierta. Ver sección 7. |

Esta distinción es deliberada y se mantiene en todo el repositorio: **una propuesta de Ingeniería nunca se presenta como si fuera una decisión del cliente.**

### 1.5 Documentos de referencia

| Documento | Rol respecto de este |
|---|---|
| `ACTA DE REUNIÓN ALIFLOW 30 JULIO.pdf` | Fuente primaria más reciente. Prevalece sobre acuerdos anteriores, salvo donde se señala contradicción. |
| `Acta Reunión Aliflow 3.pdf` (25-jun-2026) | Fuente primaria original. Su sección 4 contiene un error de redacción ya identificado y acordado corregir (ver RN-09). |
| `../../Decisiones-Pendientes-Negocios.md` | Estado vivo de qué está cerrado y qué sigue abierto. **Si este documento y aquel discrepan, aquel manda.** |
| `../../Flujos-Aliflow-Revision.html` | Flujo funcional original del que se derivaron los casos de uso (referencias `est-n`, `prov-n`, `op-n`). |
| `../../uml/Documentacion-Casos-de-Uso.md` | Desarrollo narrativo de cada caso de uso citado en la columna *Origen*. |
| `../../uml/Documentacion-Diagrama-Clases.md` | Entidades y atributos nombrados en los criterios de aceptación. |
| `../../Hallazgos-Ingenieria-API-Generica.md` | Investigación que fundamenta los requerimientos de integración (RF-47 a RF-53). |
| `06-Gestion-de-Riesgos.md` | Los 23 riesgos citados en la columna *Riesgo*. |
| `Apendice-A-Prototipo.md` | Las 22 pantallas del prototipo, mapeadas a requerimientos en la sección 9. |

---

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
| **RN-11** | **El control de concurrencia vive en la base de datos de Aliflow**, no se delega en el ERP externo. Validado empíricamente. | ✅ | `../../demo-odoo/README.md` §7 |
| **RN-12** | **Un canje de premio es una orden real con un descuento del 100% identificado como "Premio"**, no una venta de $0. Conserva el precio original del plato, descuenta cupo y genera código de retiro, pero el total a pagar es $0 y no toca el saldo del estudiante. | ✅ | Confirmado por Negocios el 8-ago-2026 |
| **RN-13** | **El saldo pertenece al establecimiento, no al estudiante.** La recarga es por establecimiento y solo puede gastarse ahí. No hay saldo único ni transferencias entre locales. | ✅ | Decisión #13, resuelta el 8-ago-2026 |
| **RN-14** | **Aliflow no recibe ni custodia fondos en ningún punto.** El dinero de la recarga va de la pasarela a la cuenta del proveedor destino. Aliflow registra el movimiento, no lo posee. | ✅ | Acta 30-jul §3.9, decisión #13 |
| **RN-15** | **Al estudiante nunca se le muestra la cantidad de unidades disponibles**, solo si el plato está *Disponible* o *Agotado*. La cifra del cupo es información interna del local y sí se le muestra al Proveedor. | ✅ | Negocios, 9-ago-2026 |

---
