# Prototipo de interfaz (mockups) — Aliflow

**Preparado por:** Grupo de Ingeniería
**Creado:** 28-jul-2026
**Actualizado:** 30-jul-2026 — alineado con el acta de reunión: inventario reservado, horario de retiro configurable, tres estados del código y el cuarto rol
**Entregable:** 01.f — prototipo de interfaz
**Objetivo:** mostrar cómo se ven las decisiones ya cerradas con Negocios, y dejar visualmente marcado lo que sigue abierto.

**Prototipo interactivo:** **https://jesus-jb.github.io/aliflow/** — se abre en el navegador, sin instalar nada
**Archivo fuente en Figma:** https://www.figma.com/design/nIaVLcvVdibWfoBqWmJ4Tt
**Exportaciones (PNG @2x):** carpeta [`mockups/`](mockups/)
**Código del prototipo:** carpeta [`mockups/prototipo-web/`](mockups/prototipo-web/)

Este documento no repite los casos de uso ni el modelo de datos — apunta al caso de uso exacto que cada pantalla representa. El detalle está en [`uml/Documentacion-Casos-de-Uso.md`](uml/Documentacion-Casos-de-Uso.md) y el estado de las decisiones en [`Decisiones-Pendientes-Negocios.md`](Decisiones-Pendientes-Negocios.md).

---

## Alcance

**21 pantallas, 4 roles.** Formato móvil 390×844.

| Rol | Pantallas | Exportación |
|---|---|---|
| Estudiante | 8 | [`mockups/01-estudiante.png`](mockups/01-estudiante.png) |
| Proveedor | 5 | [`mockups/02-proveedor.png`](mockups/02-proveedor.png) |
| Operador | 5 | [`mockups/03-operador.png`](mockups/03-operador.png) |
| **Super-Admin** *(nuevo 30-jul)* | 3 | [`mockups/04-super-admin.png`](mockups/04-super-admin.png) |
| Sistema de diseño | — | [`mockups/00-design-system.png`](mockups/00-design-system.png) |

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
| 02 | Menú del día | UC3, UC3a | **Saldo único** rotulado explícitamente "único para todos los locales"; selector de local |
| 03 | Detalle y confirmación de compra | UC4, UC4a | Revalidación de saldo y stock antes de descontar |
| 04 | **Compra confirmada y código** | UC5 | **6 dígitos, sin QR**, se dicta de viva voz · confirmación de compra con el **horario máximo de retiro** del local · estado `Válido` |
| 05 | Recargar saldo | UC2, UC2a | **Recarga única** a un solo saldo |
| 06 | Historial de órdenes | UC11 | Estados Comprado / Entregado / Expirado; incluye una orden de canje de $0.00 |
| 07 | Mi cartilla de fidelidad | UC13 | Una cartilla **por local**; progreso de sellos |
| 08 | Canjear premio | UC15 | El canje es una **orden real de $0.00**, no descuenta saldo pero sí inventario |

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

### Super-Admin de Aliflow *(rol nuevo, 30-jul-2026)*

> ⚠️ Acordado verbalmente en la reunión; **no consta en el acta**. Conviene incorporarlo formalmente.

| # | Pantalla | Caso de uso | Qué decisión refleja |
|---|---|---|---|
| 01 | Login Super-Admin | UC6 | Acceso solo para el equipo de Aliflow, no de ningún local |
| 02 | Locales | **UC18**, UC20 | **Dar de alta un local** y crear su vista de proveedor — cierra el punto abierto del 28-jul |
| 03 | Soporte | **UC19** | Vista transversal de todos los locales: incidencias de sincronización y órdenes vencidas |

---

## Lo que el prototipo deja marcado como abierto

> ⚠️ **Desactualizado desde el 8-ago-2026.** Negocios respondió tres cosas que estas pantallas todavía no reflejan, y una de ellas cambia el flujo principal:
>
> | Qué respondió Negocios | Qué hay que rehacer |
> |---|---|
> | **La recarga es por establecimiento** — no hay saldo único (decisión #13) | Estudiante 02 (el saldo está rotulado "único para todos los locales", que ya es falso), Estudiante 05 (recarga), y un paso nuevo de selección de establecimiento por defecto con indicador de contexto permanente |
> | **El premio se cobra como descuento del 100%** con nota identificable, no como venta de $0 | Estudiante 08 (canje) y Estudiante 06 (historial): deben mostrar precio original + descuento "Premio", no `$0.00` |
> | **Los cuatro roles están confirmados**, Super-Admin incluido | Quitar la marca amarilla de Super-Admin 02 |
>
> Las marcas amarillas de la tabla de abajo que correspondan a decisiones ya cerradas **siguen dibujadas en los PNG** porque las exportaciones no se han regenerado. Hasta que se rehagan, la tabla de abajo describe el estado del 30-jul, no el actual.

Cada marca amarilla corresponde a una decisión abierta del documento de decisiones:

| Dónde aparece | Decisión | Qué falta |
|---|---|---|
| Estudiante 05 — Recargar saldo | **#4** (punto fino) | Confirmar que acreditar el saldo por local **al momento de la compra** es la interpretación correcta |
| Estudiante 07 / Proveedor 05 | **#9** Cartilla | Cuántos sellos y qué premio — por eso se modelaron como configuración |
| Proveedor 02 — Panel de métricas | **#7** Modelo de cobro | No se muestra comisión ni cobro porque no está definido |
| Estudiante 08 — Canjear premio | **#9** (derivada) | Cómo representar una venta de $0 en el ERP del local |
| Operador 05 — Código vencido | *(sin número)* | El acta fijó **cuándo** vence el código, pero no qué pasa con el **dinero** de esa orden |
| Super-Admin 02 — Locales | *(sin número)* | El rol se acordó verbalmente y **no consta en el acta** |

**Marca que se retiró el 30-jul:** la pantalla del código de retiro ya no lleva el aviso de expiración pendiente. El acta cerró la regla — el código vale solo el día de la compra — así que esa pantalla pasó a dibujarse como definitiva.

---

## Sistema de diseño

A diferencia del prototipo anterior, las pantallas **no** son frames sueltos: se componen a partir de un sistema de diseño real en el mismo archivo.

- **Identidad derivada del logo** (verde `#74AB68`, azul `#7AB7D3`). El verde del logo **no** se usa en botones con texto blanco porque da 2.6:1 de contraste; las acciones usan un verde más profundo. Y el color de "éxito" pasó a teal, porque con una marca verde un badge verde deja de leerse como estado. Detalle en [`mockups/marca/`](mockups/marca/).
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
- **El flujo de recarga no refleja aún la decisión #13** (custodia de fondos vs. saldo único), porque es una contradicción sin resolver entre el acta y la decisión #4.
- **El archivo fuente vive en drafts de un equipo de Figma que no es institucional.** Las exportaciones de esta carpeta son la copia de referencia del repositorio.
