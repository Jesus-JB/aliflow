# Entregable 04 · Modelo de la base de datos

**10 puntos de rúbrica.**

> ❌ **NO EMPEZADO.** Este archivo existe para que el hueco sea visible.
>
> **Es la pieza de más puntos sin empezar, y ya no está bloqueada por nada.** Estuvo congelada semanas porque el modelo de billetera dependía de la decisión #13 (custodia de fondos); esa decisión se cerró el 8-ago-2026 y **el esquema completo se puede escribir, billetera incluida.**

---

## Por qué ya no está bloqueado

Todas las decisiones estructurales están cerradas:

| Decisión | Qué fija en el esquema |
|---|---|
| Inventario reservado (#10) | Tabla `InventarioReservado` con cupo asignado, consumido y versión para bloqueo optimista |
| **Saldo por establecimiento (#13)** | `SaldoEstablecimiento` por (estudiante, local). **Desaparece la bolsa única** y desaparece el libro de deuda de Aliflow al local |
| Expiración del código (#5) | `CodigoRetiro` con fecha de compra, expiración y los tres estados |
| Cuatro roles (#2) | Jerarquía de `Usuario`; el Super-Admin extiende `Usuario` y no `UsuarioProveedor` porque es el único sin local |
| Reglas de fidelidad (#9) | `ProgramaFidelidad`, `Cartilla`, `Sello`, `Canje`, con sellos y premio como configuración |
| Canje como descuento (#9) | `Orden` con `descuento` y `motivoDescuento`; el total no es cero, el descuento sí es del 100% |

---

## Contra qué se escribe

| Fuente | Qué aporta |
|---|---|
| [`../uml/diagrama-clases.puml`](../../uml/diagrama-clases.puml) | Las entidades, sus atributos y sus cardinalidades. **Está al día** |
| [`../uml/Documentacion-Diagrama-Clases.md`](../02-Modelamiento-Parte-Estatica/b-Diagrama-de-Clases.md) | El porqué de cada decisión de modelado |
| [`01-Especificacion-de-Requerimientos/02-Requerimientos-Funcionales.md`](../01-Especificacion-de-Requerimientos/02-Requerimientos-Funcionales.md) | Los criterios de aceptación que el esquema tiene que poder satisfacer |

---

## Cosas que el esquema tiene que resolver y no son obvias

Vale leerlas antes de empezar, porque cada una salió de un problema real ya documentado:

1. **Aislamiento entre locales (RN-07).** Toda tabla del dominio necesita su `tenantId`, y el filtrado va en el backend, no en la interfaz.
2. **Bloqueo optimista (RN-11).** `InventarioReservado` y `Plato` llevan campo `version`. **No se delega en el ERP** — se probó contra Odoo y falló bajo concurrencia real: 5 hilos con 3 unidades vendieron 5. Ver `../../../demo-odoo/README.md` §7.
3. **Unicidad acotada del código de retiro.** Seis dígitos solo alcanzan si la unicidad se exige entre los códigos **vigentes de un mismo local**, no global ni histórica.
4. **Un sello por orden.** Restricción de unicidad sobre `(Sello, Orden)`, para que un reintento de la confirmación de entrega no acredite dos.
5. **Histórico sin borrado (RF-56).** Ningún movimiento de dinero se elimina. Una corrección es un movimiento compensatorio. **El modelo actual todavía no tiene ese mecanismo** y va a hacer falta si la política de órdenes vencidas implica devolución.
6. **Outbox.** `EventoSincronizacion` con estado, intentos e identificador para idempotencia.

---

## Qué entregar

El enunciado pide "modelo de la base de datos", sin fijar formato. Lo coherente con el resto del repositorio es un **diagrama entidad-relación en PlantUML** dentro de `../uml/`, con su `.svg` y su documentación, más el **DDL** correspondiente.
