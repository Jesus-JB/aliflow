# Prototipo de interfaz (mockups) — Aliflow

**Preparado por:** Grupo de Ingeniería
**Creado:** 28-jul-2026
**Actualizado:** 9-ago-2026 — saldo por establecimiento, canje como descuento del 100%, cuatro roles confirmados y menú sin cantidades
**Entregable:** 01.f — prototipo de interfaz
**Objetivo:** mostrar cómo se ven las decisiones ya cerradas con Negocios, y dejar visualmente marcado lo que sigue abierto.

**Prototipo interactivo:** **https://jesus-jb.github.io/aliflow/** — se abre en el navegador, sin instalar nada
**Archivo fuente en Figma:** https://www.figma.com/design/nIaVLcvVdibWfoBqWmJ4Tt
**Exportaciones (PNG a 2x):** carpeta [`../../mockups/`](../../mockups/)
**Código del prototipo:** carpeta [`mockups/prototipo-web/`](../../mockups/prototipo-web/)

Este documento no repite los casos de uso ni el modelo de datos — apunta al caso de uso exacto que cada pantalla representa. El detalle está en [`../../uml/Documentacion-Casos-de-Uso.md`](../../uml/Documentacion-Casos-de-Uso.md) y el estado de las decisiones en [`../../Decisiones-Pendientes-Negocios.md`](../../Decisiones-Pendientes-Negocios.md).

---

## Alcance

**22 pantallas, 4 roles.** Formato móvil 390×844.

| Rol | Pantallas | Exportación |
|---|---|---|
| Estudiante | 9 | [`mockups/01-estudiante.png`](../../mockups/01-estudiante.png) |
| Proveedor | 5 | [`mockups/02-proveedor.png`](../../mockups/02-proveedor.png) |
| Operador | 5 | [`mockups/03-operador.png`](../../mockups/03-operador.png) |
| **Super-Admin** *(nuevo 30-jul)* | 3 | [`mockups/04-super-admin.png`](../../mockups/04-super-admin.png) |
| Sistema de diseño | — | [`mockups/00-design-system.png`](../../mockups/00-design-system.png) |

---

## Convención visual

Se usa la **misma convención que los diagramas UML**: el color amarillo con la etiqueta **"Pendiente de Negocios"** marca lo que Ingeniería propuso pero Negocios todavía no validó. Es el equivalente al estereotipo `<<propuesta>>` de `diagrama-clases.puml`.

**Importante:** el amarillo aparece **solo** donde hay una decisión genuinamente abierta. Todo lo que Negocios cerró el 28-jul-2026 se dibuja como definitivo, sin marca.

---

## Pantallas por rol

### Estudiante

| # | Pantalla | Caso de uso | Qué decisión refleja |
|---|---|---|---|
| 01 | Login institucional | UC1, UC1a | Solo Google OAuth con dominio `@uees.edu.ec` |
| **01b** | **Elegir establecimiento** *(nueva)* | **UC1b**, RF-15 | Selección **obligatoria** antes de operar, con el saldo de cada local a la vista. Patrón que aportó el cliente: la app de Parqueo Positivo |
| 02 | Menú del día | UC3, UC3a | **Saldo del establecimiento activo**, rotulado con su nombre · disponibilidad como **Disponible / Agotado**, sin cantidad (RN-15) |
| 03 | Detalle y confirmación de compra | UC4, UC4a | Revalidación del saldo **de ese local** y del cupo antes de descontar |
| 04 | **Compra confirmada y código** | UC5 | **6 dígitos, sin QR**, se dicta de viva voz · confirmación de compra con el **horario máximo de retiro** del local · estado `Válido` |
| 05 | Recargar saldo | UC2, UC2a | **Recarga por establecimiento**: el dinero va directo a la cuenta de ese local y Aliflow no lo custodia |
| 06 | Historial de órdenes | UC11 | Estados Comprado / Entregado / Expirado; el canje aparece como **descuento del 100%**, no como venta de $0 |
| 07 | Mi cartilla de fidelidad | UC13 | Una cartilla **por local**; progreso de sellos |
| 08 | Canjear premio | UC15 | El canje es una **orden real con descuento del 100%** rotulado como premio: se ve el precio del plato, el descuento y el total en $0 |

### Proveedor

| # | Pantalla | Caso de uso | Qué decisión refleja |
|---|---|---|---|
| 01 | Login operativo | UC6 | **Credenciales propias del rol**, no OAuth institucional |
| 02 | Panel de métricas | UC9 | Vendidos, ingresos, pendientes de entrega, platos más vendidos |
| 03 | **Menú y cupo de Aliflow** | UC8, **UC16**, **UC17** | **Cupo reservado** por plato frente al stock del ERP · **hora máxima de retiro** configurable |
| 04 | Estado de sincronización ERP | UC10 | **Cola Outbox** con un evento fallido reintentándose; lectura por **polling** |
| 05 | Configurar programa de fidelidad | UC14 | Sellos y premio como **configuración por local**, no constantes del sistema |

### Operador

| # | Pantalla | Caso de uso | Qué decisión refleja |
|---|---|---|---|
| 01 | Login operador | UC6 | Credenciales de rol + punto de entrega asignado |
| 02 | **Validar código de retiro** | UC5a | El Operador **teclea** el código en un teclado numérico. **No se escanea nada** |
| 03 | Entrega confirmada | UC5b, UC5d | Estado a Entregado, código invalidado, y **sello acreditado en la cartilla** |
| 04 | Código inválido o ya usado | UC5c | Uso único del código; se nombran los otros casos de fallo |
| 05 | **Código vencido** *(nuevo)* | UC5c | Tercer estado del código: valía **solo el día de la compra**. Caso distinto de "inválido" y de "ya usado" |

### Super-Admin de Aliflow

> ✅ Rol **confirmado por Negocios el 8-ago-2026**. El sistema tiene cuatro roles primarios.

| # | Pantalla | Caso de uso | Qué decisión refleja |
|---|---|---|---|
| 01 | Login Super-Admin | UC6 | Acceso solo para el equipo de Aliflow, no de ningún local |
| 02 | Locales | **UC18**, UC20 | **Dar de alta un local** y crear su vista de proveedor — cierra el punto abierto del 28-jul |
| 03 | Soporte | **UC19** | Vista transversal de todos los locales: incidencias de sincronización y órdenes vencidas |

---

## Lo que el prototipo deja marcado como abierto

Cada marca amarilla corresponde a una decisión que **sigue abierta**:

| Dónde aparece | Decisión | Qué falta |
|---|---|---|
| Estudiante 05 — Recargar saldo | **#12** Pasarela de pagos | Cuál se elige, y confirmar que cada local pueda abrir su propia cuenta de comercio (riesgo R-22) |
| Estudiante 07 / Proveedor 05 | **#9** Cartilla | Cuántos sellos y qué premio — los dos únicos valores que quedan; por eso se modelaron como configuración |
| Proveedor 02 — Panel de métricas | **#7** Modelo de cobro | No se muestra comisión ni cobro porque no está definido, y la decisión #13 lo volvió más restringido |
| Operador 05 — Código vencido | *(sin número)* | El acta fijó **cuándo** vence el código, pero no qué pasa con el **dinero** de esa orden |

**Marcas que se retiraron el 9-ago-2026**, porque sus decisiones quedaron cerradas:

| Dónde estaba | Por qué se retiró |
|---|---|
| Estudiante 05 — "acreditar al comprar es interpretación de Ingeniería (#4)" | La decisión #4 fue **revertida** por la #13: no hay saldo único ni distribución interna que interpretar |
| Estudiante 08 — "cómo se representa una venta de $0 en el ERP" | Resuelto: **descuento del 100%**, no venta de importe cero. Queda solo verificarlo contra la documentación de cada ERP, que es trabajo técnico y no una decisión de Negocios |
| Super-Admin 02 — "el rol se acordó verbalmente" | El rol quedó **confirmado** el 8-ago-2026 |

**Marca que se retiró el 30-jul:** la pantalla del código de retiro ya no lleva el aviso de expiración pendiente. El acta cerró la regla — el código vale solo el día de la compra — así que esa pantalla pasó a dibujarse como definitiva.

---

## Sistema de diseño

A diferencia del prototipo anterior, las pantallas **no** son frames sueltos: se componen a partir de un sistema de diseño real en el mismo archivo.

- **Identidad derivada del logo** (verde `#74AB68`, azul `#7AB7D3`). El verde del logo **no** se usa en botones con texto blanco porque da 2.6:1 de contraste; las acciones usan un verde más profundo. Y el color de "éxito" pasó a teal, porque con una marca verde un badge verde deja de leerse como estado. Detalle en [`../../mockups/marca/`](../../mockups/marca/).
- **2 colecciones de variables:** `Aliflow · Color` (24 variables) y `Aliflow · Scale` (12: espaciado y radios). Cambiar un valor recolorea todas las pantallas ligadas — así se aplicó el cambio de marca completo.
- **10 estilos de texto** sobre la familia Inter, incluido uno específico para el código de 6 dígitos.
- **10 componentes**, varios con variantes: `StatusBar`, `Button` (4), `Badge` (6 estados), `AppBar`, `TabBar` (4), `TabBarProveedor` (4), `Sello` (lleno/vacío), `Tecla`, `InputField`, `PlatoCard`.

Consecuencia práctica: si Negocios cambia un valor (por ejemplo el color de un estado, o el número de sellos), se cambia en un solo lugar.

---

## Limitaciones conocidas

Conviene decirlas antes de que las pregunten:

- **Los PNG de esta carpeta son estáticos.** Para ver los flujos funcionando está el [prototipo interactivo](https://jesus-jb.github.io/aliflow/), donde los cuatro roles comparten estado: el Estudiante compra contra el cupo reservado, se genera un código real, el Operador lo teclea y la orden se entrega.
- **El prototipo interactivo no tiene backend.** Todo el estado vive en memoria del navegador y se pierde al recargar. No hay base de datos, ni ERP, ni pagos reales.
- **Los datos son de ejemplo** (nombres de platos, montos, órdenes). No provienen del demo con Odoo ni de Contífico.
- **Las fotos de platos son marcadores de posición**, no imágenes reales.
- **No hay pantallas para UC7** (configurar la integración ERP) ni **UC12** (gestionar usuarios del local). UC7 es trabajo técnico conjunto con Ingeniería, no una pantalla de autoservicio; UC12 quedó fuera de esta ronda.
- **No hay pantallas de pasarela de pagos.** El acta abrió ese frente como investigación (comparar pasarelas, tokenización, webhooks), no como diseño. No se puede maquetar un flujo de pago sin saber si será modal, ventana integrada o página externa.
- **El archivo fuente vive en drafts de un equipo de Figma que no es institucional.** Las exportaciones de esta carpeta son la copia de referencia del repositorio.
