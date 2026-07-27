# Documentación de Diagramas de Objetos — Aliflow

Dos instantáneas (snapshots) de instancias concretas, cada una ilustrando un aspecto medular del diseño que el diagrama de clases (`diagrama-clases.puml`) por sí solo no deja tan claro.

---

## 1. Billetera y orden de un estudiante

![Diagrama de objetos: billetera y orden](objeto-billetera-orden.svg)

**Fuente:** `objeto-billetera-orden.puml`

**Qué ilustra:** a Ana Torres (`Estudiante`) le corresponde una única `TarjetaVirtual`, pero su saldo con Barú vive en un objeto `SaldoProveedor` separado ($8.50) — si Ana comprara también en otro proveedor, tendría **otro** `SaldoProveedor` independiente, en cero hasta que recargue ahí. Esto vuelve concreta la decisión de negocio ya confirmada (saldo independiente por tenant, `Hallazgos-Ingenieria-API-Generica.md` sección 5.2) que en el diagrama de clases solo se ve como una cardinalidad `1 -- 0..*`.

La orden (`ORD-2026-000482`) está en estado `COMPRADO`, con su `CodigoRetiro` propio todavía sin usar — la instantánea representa el momento justo después de la compra y antes del retiro físico del almuerzo.

## 2. Integración con el ERP de un proveedor real (Barú / Alpwin)

![Diagrama de objetos: integración ERP](objeto-integracion-erp.svg)

**Fuente:** `objeto-integracion-erp.puml`

**Qué ilustra:** el caso real más importante que investigó Ingeniería (`Hallazgos-Ingenieria-API-Generica.md`, sección 4.3): Barú tiene su `IntegracionERP` configurada con `tipoERP = ALPWIN`, un sistema sin API pública conocida. La `ProviderAdapterFactory` de todas formas produce un `AlpwinAdapter` (mismo contrato `IInventoryProvider` que usarían `OdooAdapter`/`ContificoAdapter`), y el `SincronizacionWorker` lo invoca — pero en este snapshot, el intento de notificar una venta (`evento1`) ya **agotó 3 reintentos y quedó en estado FALLIDO**.

Esta instantánea no es un caso de error hipotético: es exactamente el escenario que el patrón Outbox (`Hallazgos-Ingenieria-API-Generica.md` sección 3.4) fue diseñado para manejar sin perder la venta — el evento fallido queda visible para reconciliación manual (caso de uso UC10, `uml/Documentacion-Casos-de-Uso.md`) en vez de desaparecer silenciosamente.

---

*Ambos diagramas usan datos de ejemplo — no corresponden a transacciones reales.*
