# Hallazgos de Ingeniería — API Genérica de Integración con ERPs de Proveedores

**Proyecto:** Aliflow
**Preparado por:** Grupo de Ingeniería
**Referencia:** Acta de Reunión Aliflow 3 (25-jun-2026), compromiso de investigación asignado al Grupo de Ingeniería
**Fecha de este documento:** 26-jul-2026 · **Última revisión:** 28-jul-2026 (incorpora las decisiones de Negocios — ver sección 4.3)
**Repositorio del proyecto:** https://github.com/Jesus-JB/aliflow (público)
**Objetivo:** presentar los hallazgos y recomendaciones de la investigación sobre arquitectura de integración, mecanismos de sincronización, y evaluación de ERPs candidatos (Contífico, Alpwin, Alegra, Odoo Community, ERPNext), para la siguiente reunión de equipo.

---

## 1. Resumen ejecutivo

- **🚩 Corregido el 28-jul-2026 (ver sección 4.3):** el hallazgo del 26-jul decía que Barú usaba Alpwin. **Es al revés de como lo entendimos.** Negocios aclaró que Aliflow no se integra con *un* proveedor sino con **cualquier local de comida de la universidad, cada uno con su propio ERP**: Barú usa **Contífico**, Caramel Coffee usa **Alpwin**, y así los demás. La conexión debe ser **bidireccional** en ambos sentidos: el ERP del local le informa a Aliflow su inventario y sus pedidos, y Aliflow le devuelve las órdenes y los pagos para que su inventario quede sincronizado.
- **Consecuencia doble, y conviene decir las dos:** el arranque es **más fácil** de lo que creíamos (el local piloto, Barú, usa el ERP con la mejor API de todos los que evaluamos) y el producto es **más difícil** (deja de ser una integración y pasa a ser una plataforma multi-tenant con N ERP heterogéneos conviviendo).
- **Recomendación de ERP para la fase inicial (presupuesto $0):** **Odoo Community**, self-hosted — sigue siendo la herramienta correcta para el demo técnico, ahora como banco de pruebas de la arquitectura, no como candidato a reemplazar el ERP de nadie.
- El reto técnico identificado en el acta ("API genérica que soporte múltiples ERPs sin depender de la implementación específica de cada uno") es real y se confirma con la investigación: los ERPs candidatos son heterogéneos — desde sistemas con API REST moderna hasta sistemas sin ninguna API pública.
- **Recomendación de arquitectura:** patrón Adapter (hexagonal) + modelo de datos canónico + outbox/cola de reintentos para manejo de fallos. Ver sección 3.
- **Contífico dejó de ser "el ERP que recomendamos a futuro" y pasó a ser "el ERP que el local piloto ya usa".** Toda la evaluación de la sección 2.2 sigue siendo válida, pero cambió de propósito: ya no sirve para convencer a nadie de migrar, sino para saber contra qué API vamos a programar el primer adaptador real.
- **Alegra fue evaluado a fondo y se descarta**: no soporta facturación electrónica para Ecuador (evidencia oficial, ver sección 2.3). Su API técnica es de las mejores documentadas que revisamos, pero no resuelve el problema fiscal real del proveedor ecuatoriano.
- **ERPNext se descarta** por no tener localización fiscal de Ecuador confirmada.
- **Alpwin** no tiene API pública. Ya no bloquea el piloto (Barú no lo usa), pero **sigue siendo un caso real** — lo usa Caramel Coffee — así que el `AlpwinAdapter` por archivos/BD puente sigue haciendo falta, solo que para el segundo local y no para el primero.
- Adicionalmente, se revisó el flujo funcional documentado (`Flujos-Aliflow-Revision.html`) y se detectó una **contradicción entre el Acta y el flujo** respecto al comprobante tributario, además de varios vacíos no cubiertos aún (ver sección 5).
- **Se construyó y validó en vivo un demo funcional** de la arquitectura propuesta usando Odoo Community (ver sección 4.2) — no es solo una propuesta teórica, ya se probó que el flujo menú → compra → descuento de stock → comprobante funciona técnicamente. Código en el repositorio del proyecto, carpeta `demo-odoo/`.

---

## 2. Evaluación de ERPs candidatos

### 2.1 Tabla comparativa

| ERP | Costo real | API pública | Facturación SRI Ecuador | Esfuerzo operativo |
|---|---|---|---|---|
| **Alpwin** (Syscompsa) | No determinado — requiere contacto directo | ❌ No documentada públicamente | Sí es su función core, pero sin API para automatizar | Alto — integración manual/archivos/BD puente |
| **Contífico** | Debe negociarse como cliente; sin plan de entrada gratuito ni sandbox público | ✅ REST documentada (`api.contifico.com`), sin webhooks | ✅ Sí — es su especialidad, mercado ecuatoriano | Bajo (SaaS) |
| **Alegra** | ~$5 USD/mes en países soportados; trial 15 días | ✅ REST muy bien documentada (`developer.alegra.com`), con webhooks parciales (CRUD, no stock) | ❌ **No soportado** — ver 2.3 | Muy bajo (SaaS), pero irrelevante por lo anterior |
| **Odoo Community** | $0 licencia (LGPLv3) + ~$5-10 USD/mes de VPS | ✅ 3 protocolos (XML-RPC, JSON-RPC, REST) | ✅ Sí — módulo oficial `l10n_ec` (firma XAdES, ambientes prueba/producción SRI) | Medio-alto — self-hosted, requiere configuración y mantenimiento |
| **ERPNext (Frappe)** | $0 licencia + ~$5 USD/mes (Frappe Cloud) | ✅ REST documentada | ❌ No confirmada para Ecuador | Bajo (cloud) |

### 2.2 Contífico — detalle técnico confirmado

- Base URL: `https://api.contifico.com/sistema/api/v1/`
- Formato REST/JSON. Autenticación por API Key en header `AUTHORIZATION: SECRETKEY`, entregada por soporte al darse de alta como cliente.
- Endpoints relevantes: `GET/POST /producto/`, `GET /producto/{id}/stock/`, `GET/POST /movimiento-inventario/`, `POST /documento/` (factura electrónica).
- **No hay evidencia de webhooks** — modelo de consulta/push desde Aliflow hacia Contífico, no de notificación inversa.
- No se encontraron rate limits ni costos públicos — probablemente se negocian directamente con soporte.

### 2.3 Alegra — por qué se descarta (evidencia)

La investigación inicial (basada en resultados de búsqueda) sugería soporte para Ecuador. Una verificación más profunda contra **fuentes oficiales primarias** revirtió esa conclusión:

- El centro de ayuda oficial de Alegra (`ayuda.alegra.com/int`) lista explícitamente los países soportados: Colombia, México, República Dominicana, Costa Rica, España, Panamá, Perú, Argentina, Venezuela. **Ecuador no aparece.**
- `alegra.com/ecuador/` devuelve **404**, mientras países sí soportados tienen landing page propia confirmada (ej. `alegra.com/costarica/facturacion/`).
- Búsqueda restringida al dominio oficial (`site:alegra.com ecuador`) no arroja páginas de producto para Ecuador.
- Control de calidad: se confirmó que Colombia/Costa Rica/México sí aparecen sin ambigüedad en las mismas fuentes, descartando que la ausencia de Ecuador sea un fallo de búsqueda.
- Las afirmaciones previas de "soporte SRI Ecuador" venían de resúmenes automáticos de búsqueda sin fuente real y de un sitio de reseñas de terceros internamente inconsistente — no de documentación oficial de Alegra.

**Lección para el equipo:** para decisiones de este peso, verificar siempre contra la fuente primaria oficial (centro de ayuda, landing page del producto), no contra resúmenes generados o reseñas de terceros.

Técnicamente, la API de Alegra sí es la mejor documentada que se revisó (Basic Auth simple, rate limit de 150 req/min, endpoints claros de `items`, `inventory-adjustments`, `invoices`, `contacts`, `credit-notes`) — queda como referencia de "buena práctica de API" aunque no se use para Ecuador.

### 2.4 Odoo Community — detalle técnico confirmado

- Community Edition es gratis y open-source (LGPLv3); incluye Inventario y Facturación con el mismo motor contable que Enterprise (se pierde automatización avanzada, no la funcionalidad núcleo).
- **Localización Ecuador oficial (`l10n_ec`)**: plan de cuentas NEC, validación RUC/cédula, generación y firma XML (XAdES-BES), integración SOAP con el SRI (ambientes prueba y producción), módulo de Punto de Venta, guía de remisión electrónica, reporte ATS. Confirmado en la documentación oficial de Odoo 19.0.
- API: XML-RPC (máxima compatibilidad histórica), JSON-RPC, y REST (desde Odoo 17/19, OpenAPI-compliant). Auth vía base de datos + usuario + contraseña o API key.
- Costo real de "gratis": sin costo de licencia, pero requiere un VPS (~$5-10 USD/mes) y esfuerzo de configuración/mantenimiento (certificados SRI, actualizaciones, backups).

### 2.5 Alpwin — detalle confirmado

- Es un sistema de contabilidad/facturación de **Syscompsa S.A.**, aparentemente un ERP contable genérico para pymes, no un POS especializado en alimentos.
- No se encontró documentación pública de API, portal de desarrolladores, ni referencias de integración REST/webhooks.
- Mecanismos de integración esperables: exportación/importación de archivos (CSV/Excel), acceso directo a su base de datos, o conector a medida negociado con Syscompsa.
- **Recomendación (actualizada 28-jul-2026)**: hay un local real que lo usa (Caramel Coffee), así que el adaptador sí hace falta — pero **después** del piloto con Barú/Contífico, no antes. Muy probablemente será basado en archivos, no en llamadas API síncronas.

---

## 3. Arquitectura recomendada para la API genérica

### 3.1 Patrón Adapter + Arquitectura Hexagonal

El núcleo de Aliflow no debe conocer nada de Odoo, Contífico o Alpwin directamente. Se define un **puerto** (interfaz) en el dominio:

```
interface IInventoryProvider {
  // ERP -> Aliflow
  getMenu(tenantId): MenuItem[]
  getStock(tenantId, itemId): int
  getSyncStatus(tenantId): SyncStatus
  // Aliflow -> ERP
  updateStock(tenantId, itemId, delta): Result
  notifySale(tenantId, orderId, items): Result
  notifyPayment(tenantId, orderId, pago): Result
}
```

Cada ERP tiene un **adaptador concreto** (`OdooAdapter`, `ContificoAdapter`, `AlpwinAdapter`) que traduce esta interfaz a las llamadas y formatos propios de cada sistema. Un `ProviderAdapterFactory` resuelve en runtime qué adaptador instanciar según el `tenantId`. Esto aplica directamente el principio de Inversión de Dependencias (SOLID) que exige la rúbrica del proyecto.

### 3.2 Modelo de datos canónico

Definir un esquema intermedio propio de Aliflow (`CanonicalProduct`, `CanonicalStockEvent`, `CanonicalInvoiceRef`) con solo los campos que el negocio necesita. Cada adaptador mapea su formato nativo → canónico y viceversa, evitando que un cambio de esquema en un ERP externo rompa el modelo de datos interno.

### 3.3 Estrategias de sincronización

> **⚠️ Reescrita el 30-jul-2026.** Negocios resolvió el desfase de inventario **por diseño en vez de por sincronización**. Ver abajo, "Inventario reservado".

| Estrategia | Cuándo usarla | Trade-off |
|---|---|---|
| **Inventario reservado** *(v1 — mecanismo primario)* | **Siempre**, para decidir si Aliflow puede vender | El proveedor debe administrar el cupo manualmente. A cambio, **elimina la sobreventa por diseño** |
| Push en tiempo real | ERPs con API síncrona (Odoo, Contífico) | Requiere manejo de fallos de red inmediato. Sigue siendo el mecanismo para **registrar la venta** en el ERP |
| Polling periódico | ERPs sin webhooks — Contífico y Alpwin | Ya **no sostiene la disponibilidad**: baja a alimentar el espejo informativo del stock y a conciliar |
| Batch/reconciliación | Red de seguridad diaria | Detecta divergencias entre el cupo consumido en Aliflow y lo registrado en el ERP |

#### Inventario reservado — la decisión que cambia el problema

**El problema, planteado por Negocios el 30-jul:** si el local vende en caja, su ERP descuenta al instante, pero Aliflow puede tardar en enterarse. En esa ventana un estudiante compra un almuerzo que ya no existe.

Es el problema de **dos escritores sobre el mismo dato**. Sincronizar más seguido solo achica la ventana; no la cierra. Las tres alternativas que se evaluaron:

| Alternativa | Veredicto |
|---|---|
| Webhooks desde el ERP | La ideal, pero **ningún ERP del alcance los ofrece**. Descartada por imposibilidad técnica |
| Polling cada minuto | Sencilla, pero **no elimina el desfase**. Queda como red de seguridad |
| **Inventario reservado** | ✅ **Elegida para v1** |

**Cómo funciona:** el proveedor aparta un cupo exclusivo para Aliflow — de 100 almuerzos, 75 a caja y 25 a Aliflow — y lo administra manualmente desde su panel. Aliflow valida la compra contra **su propio cupo**, no contra el stock del ERP.

**Por qué es la decisión correcta desde el punto de vista de ingeniería:** convierte un problema de consistencia distribuida (dos sistemas escribiendo el mismo contador, sin transacción común) en un problema de **partición de recursos**, que es trivial. Aliflow deja de competir con la caja: es dueño de su cupo y nadie más lo toca.

**Consecuencia sobre R-01, que conviene notar.** El inventario deja de depender de la integración con el ERP. Aunque las credenciales de Contífico no lleguen, el módulo de compra puede funcionar contra el cupo reservado. **R-01 deja de bloquear la capacidad de vender** y pasa a bloquear solo el registro contable de la venta y la emisión de la factura, que es un problema serio pero distinto.

**Lo que queda pendiente de diseño** (tarea acordada para la próxima reunión): el proceso de asignación del cupo y cómo se visualiza en el panel del proveedor.

### 3.4 Manejo de fallos

- **Outbox pattern**: cada venta genera un evento `StockUpdateRequested` en la misma transacción que la orden; un worker lo consume y llama al adaptador correspondiente, con reintentos y backoff exponencial.
- **Idempotencia**: cada evento lleva un `eventId` único para evitar dobles descuentos si se reintenta.
- **Tabla de reconciliación**: eventos `pending`/`failed` visibles para el proveedor en su panel ("última sincronización exitosa"), evitando la "venta huérfana" ya identificada como riesgo en el flujo funcional.

### 3.5 Multi-tenant

Cada local tiene su propio conjunto de credenciales de ERP, almacenadas cifradas en una tabla `provider_integration_config` separada del dominio — nunca hardcodeadas por adaptador.

**Actualizado 28-jul-2026:** esta sección era la más "por si acaso" de todo el diseño y resultó ser la más importante. Con la aclaración de Negocios (cada local usa un ERP distinto, sección 4.3), el multi-tenant deja de ser una previsión y pasa a ser el modo normal de operación: en producción habrá varios adaptadores activos al mismo tiempo, resueltos por `tenantId` en cada llamada.

### 3.6 Mapeo a entregables UML del proyecto

- **Diagrama de componentes:** `Aliflow Core` → `Integration Layer` (expone `IInventoryProvider`) → `ContificoAdapter` / `AlpwinAdapter` / `OdooAdapter` → `Retry Worker` / `Reconciliation Store`.
- **Diagrama de despliegue:** nodo backend de Aliflow, nodo/worker de sincronización, y nodos externos representando los servidores de cada ERP (fuera de control de Aliflow, conexión HTTPS).
- **Diagrama de clases:** la interfaz `IInventoryProvider` + implementaciones concretas es un ejemplo directo de Dependency Inversion y Open/Closed (SOLID), relevante para el rubro de diagramas de clases de la rúbrica.

---

## 4. Ruta de implementación sugerida

> **Reescrita el 28-jul-2026.** La versión original de esta ruta ("empezar con Odoo, migrar a Contífico cuando haya presupuesto") partía de una premisa que Negocios corrigió: que había que **elegir** un ERP para el proveedor. No hay que elegir ninguno — cada local ya tiene el suyo y Aliflow se adapta. La ruta vigente está en la sección 4.3, "Ruta ajustada". Se resume aquí:

1. **Fase 0 — demo técnico, $0 (ya hecho):** Odoo Community self-hosted + `OdooAdapter` como primera implementación real de `IInventoryProvider`. Banco de pruebas de la arquitectura, no candidato a reemplazar el ERP de nadie.
2. **Fase 1 — piloto real: `ContificoAdapter`** para Barú. Primer adaptador de producción; bloqueado solo por las credenciales.
3. **Fase 2 — segundo local: `AlpwinAdapter`** para Caramel Coffee, por archivos/BD puente si Syscompsa no ofrece nada mejor.
4. **Fase 3 — escalar:** cada local nuevo = un valor de `TipoERP` + una clase adaptadora.

### 4.1 Por qué Contífico es una buena noticia (evaluación previa, reinterpretada el 28-jul-2026)

> **Nota de contexto:** esta sección se escribió el 26-jul para argumentar por qué el equipo *recomendaba* migrar a Contífico. Esa recomendación ya no aplica —el local piloto ya lo usa, no hay nada que recomendar—, pero el análisis sigue siendo útil, porque explica por qué que Barú use Contífico es la mejor carta que podía tocarnos.

Odoo Community resuelve el problema técnico y de costo *ahora*, pero no es la recomendación final del equipo para cuando el proyecto ya sea un producto real en manos del cliente:

- **Es un ERP dedicado al mercado ecuatoriano**, no una plataforma genérica internacional adaptada con un módulo de localización. Contífico se construyó pensando en el SRI y la normativa local desde el inicio — Odoo depende de que la comunidad/Odoo S.A. mantenga actualizado el módulo `l10n_ec` cada vez que el SRI cambie sus reglas, lo cual es un riesgo de mantenimiento a mediano plazo.
- **Es SaaS con soporte comercial real.** Si algo falla en producción (por ejemplo, un cambio del SRI que rompe la firma de documentos), hay un proveedor local a quien reclamar y que da soporte en español, con conocimiento del mercado. Con Odoo Community self-hosted, el equipo de Aliflow es responsable de mantener el servidor, aplicar actualizaciones, y renovar certificados — sin red de soporte comercial detrás.
- **Menor esfuerzo operativo a escala.** Una vez que el proveedor factura en volumen real, no tener que administrar un servidor (parches de seguridad, backups, escalado) es una ventaja frente al modelo self-hosted de Odoo.
- **Ya validamos que su API REST es real, simple y suficiente** (sección 2.2) para lo que Aliflow necesita — no hay ganancia técnica en quedarse con Odoo una vez que el presupuesto deja de ser la restricción.

En resumen (reinterpretado): el ERP que el local piloto ya usa resulta ser el que el equipo habría recomendado de todas formas. Eso elimina de golpe la conversación incómoda de "pedirle al cliente que cambie de sistema" para el piloto — conversación que sigue viva, pero solo para los locales que lleguen con un ERP sin API.

### 4.2 Demo técnico construido y validado (26-jul-2026)

Se construyó y se corrió en vivo un demo funcional que implementa el patrón de arquitectura descrito en la sección 3, usando **Odoo Community** como primer ERP real detrás del contrato `IInventoryProvider`. Código disponible en `demo-odoo/` del repositorio del proyecto.

**Componentes:**
- `docker-compose.yml` — levanta Odoo 17 Community + PostgreSQL localmente.
- `odoo_adapter.py` — clase `OdooAdapter`, implementación concreta de `IInventoryProvider` (`get_menu`, `get_stock`, `update_stock`, `notify_sale`) contra la API externa de Odoo.
- `demo.py` — corre el flujo completo simulando los pasos del documento de flujos: `est-3` (consulta de menú) → `est-4` (compra) → `est-5` (descuento de stock) → `prov-6` (comprobante/factura).

**Resultado de la corrida real:** producto creado en Odoo, menú consultado con stock correcto, compra simulada de 1 unidad (stock 20 → 19), y factura (`account.move`) creada exitosamente en Odoo — de punta a punta, sin intervención manual salvo la creación inicial de la base de datos (paso obligatorio de Odoo, no automatizable por API).

**Dos hallazgos técnicos reales que surgieron al construirlo** (quedan documentados porque son evidencia de investigación aplicada, no solo teoría):

1. **Hubo que usar JSON-RPC en vez de XML-RPC.** El método `stock.quant.action_apply_inventory` (necesario para ajustar el stock) no retorna ningún valor, y el protocolo XML-RPC no puede transmitir `None` — lanza el error `"cannot marshal None unless allow_none is enabled"` aunque la operación sí se aplique correctamente en el servidor. JSON-RPC (mismo backend, mismo endpoint que usa el propio cliente web de Odoo) no tiene esa limitación.
2. **Odoo omite la clave `result` en la respuesta JSON** cuando el método invocado no retorna nada — la respuesta cruda es literalmente `{"jsonrpc": "2.0", "id": 0}`, sin `result` ni `error`. Hay que tratar la ausencia de esa clave como éxito implícito, no como fallo.

**Pendiente aceptado a propósito para esta etapa:** la factura queda en estado borrador, sin autorización real ante el SRI (requeriría subir un certificado `.p12` real de una empresa existente) — no era necesario para demostrar que la arquitectura e integración funcionan técnicamente.

### 4.3 Corregido (28-jul-2026): Aliflow es multi-tenant y multi-ERP — y Barú usa Contífico, no Alpwin

**Qué decía este documento el 26-jul-2026:** que el proveedor real del proyecto era Barú y que su sistema era Alpwin, y que por lo tanto el adaptador urgente era `AlpwinAdapter`.

**Qué aclaró Negocios el 28-jul-2026:** las dos mitades de esa afirmación estaban mal.

1. **No hay "el proveedor" en singular.** Aliflow debe poder conectarse al sistema de **cualquier local de comida de la universidad** — Barú, Caramel Coffee, y los que se agreguen después. Cada uno es un negocio distinto, con su propio ERP.
2. **La asignación de ERP estaba invertida.** **Barú usa Contífico. Caramel Coffee usa Alpwin.** El hallazgo del 26-jul venía de una fuente indirecta (una conversación previa del equipo, no un acta) y este documento ya lo advertía; la corrección confirma que esa advertencia estaba justificada.
3. **La conexión es bidireccional, y eso es un requisito, no un detalle.** El ERP del local le informa a Aliflow qué inventario tiene disponible ese día y qué pedidos entran por sus otros canales; Aliflow le devuelve las órdenes que se hicieron y los pagos que se cobraron, para que su inventario y su contabilidad queden sincronizados. Sin las dos direcciones, el inventario diverge.

#### Qué mejora y qué empeora

Conviene no vender esto solo como buena noticia:

| | Antes (lo que creíamos) | Ahora (lo real) |
|---|---|---|
| **ERP del local piloto** | Alpwin — sin API pública, integración por archivos en el mejor caso | **Contífico** — API REST documentada, la mejor evaluada junto con Alegra |
| **Riesgo dominante** | R-11: el piloto podía ser técnicamente inviable | R-01: conseguir credenciales de Contífico — un problema de gestión, no de ingeniería |
| **Alcance del producto** | Una integración, con un tenant | **Una plataforma multi-tenant** con N ERP heterogéneos conviviendo |
| **Costo de operación** | Un conjunto de credenciales, un ERP que monitorear | N conjuntos de credenciales, N ERP, N formatos de error, N interlocutores de soporte |
| **Valor de la arquitectura Adapter** | Defensiva ("por si acaso el proveedor cambia de sistema") | **Estructural** — sin ella el producto directamente no funciona |

En resumen: **el arranque se destrabó y el producto creció.** El trabajo de la sección 3 (Adapter + modelo canónico + outbox) no cambia ni una línea — que era exactamente su propósito — pero pasó de ser una buena práctica a ser el núcleo del sistema.

#### Sobre la bidireccionalidad: un punto técnico que hay que decir ahora

Negocios pidió que la conexión sea "bilateral", y eso tiene una implicación que no es obvia. Que Aliflow le escriba al ERP es fácil (es una llamada REST). Que el **ERP le avise a Aliflow** cuando cambia algo es lo difícil, porque:

- **Contífico no tiene webhooks** (confirmado en la sección 2.2). No puede notificar a Aliflow por iniciativa propia.
- **Alpwin no tiene ni API.**

Por lo tanto, "bidireccional" en la práctica se implementa así, y conviene que Negocios lo sepa antes de prometerle tiempo real a un local:

| Dirección | Mecanismo real | Latencia |
|---|---|---|
| Aliflow → ERP (órdenes, pagos, descuento de stock) | Push directo vía adaptador, con outbox y reintentos | Segundos |
| ERP → Aliflow (inventario del día, pedidos de otros canales) | **Polling** de Aliflow contra el ERP, en intervalo configurable | Minutos — es la "ventana de vendido antes de confirmar" ya registrada como riesgo |
| ERP → Aliflow, cuando el ERP sí soporte webhooks | Endpoint entrante en Aliflow (queda diseñado, sin uso en v1) | Segundos |

La ventana de polling es la razón por la que el bloqueo optimista de stock **debe vivir en la base de datos de Aliflow** y no delegarse al ERP — cosa que además ya se comprobó empíricamente (`demo-odoo/README.md`, sección 7).

#### Ruta ajustada

1. **Fase 0 (ahora, $0):** demo con Odoo Community, ya construido y validado (sección 4.2). Sirve como banco de pruebas de la arquitectura y del outbox, no como ERP candidato para nadie.
2. **Fase 1 (piloto real): `ContificoAdapter`.** Es el primer adaptador de producción. Bloqueante: conseguir credenciales de API de Contífico a través de Barú (riesgo R-01).
3. **Fase 2 (segundo local): `AlpwinAdapter`.** Contactar a Syscompsa para descartar una vía de integración no pública antes de comprometerse con archivos/BD puente. Ya no bloquea el arranque, pero sigue pendiente.
4. **Fase 3 (escalar):** cada local nuevo = un valor de `TipoERP` + una clase adaptadora. Si un local llega con un ERP sin API y sin alternativa, ahí sí corresponde plantearle a **ese local** —no al proyecto entero— la conversación de migrar de sistema.

## 5. Revisión del flujo funcional (`Flujos-Aliflow-Revision.html`)

> **Nota sobre los identificadores (`est-2`, `prov-6`, `op-5`, etc.):** son los IDs internos que la herramienta HTML `Flujos-Aliflow-Revision.html` le asigna a cada paso, para poder engancharle comentarios ahí mismo. El patrón es `{rol}-{número}`: `est-` = pasos del rol Estudiante, `prov-` = Proveedor, `op-` = Operador, numerados en el orden en que aparecen en esa pestaña. Se usan aquí solo como referencia rápida a un paso específico de ese documento; cada uno se acompaña de su título completo.

### 5.1 Contradicción entre el Acta y el flujo documentado

El Acta (sección 4, 25-jun-2026) indica: *"Compra del almuerzo... Generación de comprobante **válido tributariamente**."*

El flujo del rol Proveedor (paso `prov-6` — "Re-emisión de comprobante tributario", con fecha de la misma reunión) indica lo contrario: *"Aliflow emite un comprobante de compra... **sin validez tributaria**... el proveedor re-emite la factura válida en su propio sistema."*

**Recomendación:** aclarar y corregir el texto del acta antes de que quede plasmado así en el documento de especificación de requerimientos — el modelo correcto y ya confirmado es el de **re-emisión por parte del proveedor**, no emisión fiscal directa de Aliflow.

### 5.2 Decisiones de alto impacto — cerradas por Negocios el 28-jul-2026

Las tres estaban abiertas y bloqueaban trabajo. Las tres se resolvieron:

1. **Saldo por proveedor vs. saldo único** (paso `est-2` — "Recarga de tarjeta virtual"). **Resuelto el 8-ago-2026: la recarga es por establecimiento.** El estudiante recarga *para un local* y ese saldo solo se gasta ahí; el dinero va directo a la cuenta de ese proveedor y Aliflow no custodia fondos. *(Este punto pasó por dos respuestas opuestas: el 28-jul se decidió saldo único con distribución interna, y el 8-ago se revirtió. El costo del saldo único fragmentado quedó registrado como riesgo R-21.)* Ver `Entregables/markdown/02-Modelamiento-Parte-Estatica/b-Diagrama-de-Clases.md`, sección 3.
2. **Modelo de cobro de Aliflow al proveedor** (paso `prov-5`). **Sigue abierto** — es la única de las tres que no se resolvió. No bloquea el MVP técnico.
3. **Formato del código de retiro** (pasos `est-6` y `op-2`). **Resuelto: código numérico corto.** Negocios descartó la propuesta de Ingeniería (UUID firmado) por una razón operativa correcta: el estudiante le dice el código al Operador de viva voz y este lo digita. Se implementa como 6 dígitos, únicos entre los códigos vigentes del mismo local, con expiración y un solo uso. Desbloquea el prototipo de mockups (entregable 01.f). El costo de la decisión es que el código pasa a ser adivinable por fuerza bruta, lo que se registró como riesgo R-15.

### 5.3 Vacíos detectados, no flageados aún en el flujo

1. **Estado de "no retiro"/expiración de orden**: el flujo solo contempla los estados "Comprado" y "Entregado" — no hay manejo de una orden que nunca se retira. Esto deja el diagrama de estados (exigido por la rúbrica) con solo dos estados reales.
2. **Roles múltiples por proveedor**: el paso `prov-1` — "Autenticación y acceso" — menciona "el proveedor o personal autorizado", implicando varios usuarios por tenant, sin que el flujo modele permisos diferenciados.
3. **Múltiples operadores/puntos de entrega por proveedor**: no está definido si una orden queda amarrada a un punto físico específico.
4. **Notificaciones al estudiante**: no hay paso sobre avisos de confirmación de compra o fallos de sincronización — si está fuera de alcance de v1, debería decirse explícitamente (como se hizo con devoluciones).
5. **Riesgo de "sin modo offline" del operador** (paso `op-5` — "Manejo de excepciones" —, ya confirmado como decisión de negocio): es un punto único de falla real y debería quedar registrado explícitamente en el registro de riesgos formal del proyecto (entregable 01.g), no solo como callout en el flujo.

---

## 6. Pendientes — estado al 28-jul-2026

### Cerrado

- [x] Investigar y comparar ERPs candidatos (Contífico, Alpwin, Alegra, Odoo Community, ERPNext).
- [x] Construir y validar un demo técnico de la arquitectura propuesta (Odoo Community, ver sección 4.2).
- [x] Publicar el proyecto en un repositorio público (https://github.com/Jesus-JB/aliflow).
- [x] **Confirmar cuál es el ERP real del proveedor** — resuelto y **corregido** el 28-jul-2026: no hay un solo proveedor; Barú usa Contífico y Caramel Coffee usa Alpwin (sección 4.3).
- [x] **Decidir modelo de saldo** — recarga única distribuida internamente (sección 5.2).
- [x] **Confirmar el formato del código de retiro** — numérico corto de 6 dígitos (sección 5.2).
- [x] **Definir el alcance del rol "Administrador"** — no existe como rol aparte: es el Proveedor, el gerente del local. Solo hay 3 roles.
- [x] **Definir si un proveedor puede tener varios usuarios** — sí, varias cuentas de Proveedor y varias de Operador por local.
- [x] Registrar formalmente el riesgo de "sin modo offline" en el documento de gestión de riesgos (R-12).

### Cerrado el 30-jul-2026

- [x] **Estrategia de inventario** — inventario reservado exclusivo para Aliflow, administrado manualmente por el proveedor (sección 3.3). Resuelve el desfase por diseño en vez de por sincronización.
- [x] **Regla de expiración del código de retiro** — vale únicamente el día de la compra; estados `VÁLIDO` / `UTILIZADO` / `VENCIDO`.
- [x] **Comprobante tributario** — confirmado el modelo que este documento defendía en la sección 5.1: comprobante interno sin validez tributaria en la recarga, y factura emitida por el ERP del local en la compra.
- [x] **Horario máximo de retiro** — configurable por proveedor, no constante del sistema.
- [x] **Quién da de alta un local nuevo** — el Super-Admin de Aliflow, rol repuesto el 30-jul.

### Abierto

- [ ] 🔴 **Custodia de fondos vs. saldo único.** El acta dice que el dinero llega directo a la cuenta de cada proveedor y que Aliflow no custodia fondos; la decisión #4 dice que hay un saldo único gastable en cualquier local. **No encajan**: al recargar todavía no se sabe en qué local se va a comprar. Condiciona qué pasarelas son candidatas (se necesitaría capacidad de *split payments*). Detalle en `Decisiones-Pendientes-Negocios.md`, punto 13.
- [ ] **Comparar pasarelas de pago disponibles en Ecuador**: tokenización, webhooks de confirmación, reembolsos, pagos duplicados, depósito directo a cada proveedor, costos y tiempos de liquidación.
- [ ] **Prioritario:** conseguir credenciales de API de Contífico a través de Barú (riesgo R-01). *Nota del 30-jul: el inventario reservado le quitó a este riesgo el poder de bloquear la venta; ahora bloquea el registro contable y la factura.*
- [ ] **Definir la política de reembolso** de una orden vencida. El acta define cuándo vence el código, no qué pasa con el dinero.
- [ ] Contactar a Syscompsa (fabricante de Alpwin) para verificar si existe algún mecanismo de integración no público, antes de comprometerse con un adaptador por archivos/BD puente para Caramel Coffee (riesgo R-11, ya no bloqueante).
- [ ] Validar con Negocios la corrección de la sección 4 del acta (comprobante tributario, sección 5.1).
- [ ] Confirmar la interpretación de Ingeniería sobre *cuándo* se distribuye internamente el saldo (sección 5.2, punto 1).
- [ ] Definir quién da de alta un local nuevo, ahora que no existe un rol de super-admin en el sistema (propuesta de Ingeniería: fuera de alcance de v1, lo hace el equipo manualmente).
- [ ] Decidir el modelo de cobro de Aliflow al proveedor (comisión/suscripción).
- [ ] Definir la regla de expiración/no-show para órdenes no retiradas.
- [ ] Formalizar el registro de riesgos con el equipo (`Entregables/markdown/01-Especificacion-de-Requerimientos/06-Gestion-de-Riesgos.md`, 15 riesgos).
- [ ] (Opcional, no bloqueante) Verificar oficialmente el precio de Contífico — se encontró una referencia no oficial de terceros (Lite $9/mes, Pyme $30/mes, Anual $91/año) que contradice nuestra afirmación previa de "sin costos públicos". Nota: Contífico ahora opera como **"Siigo Contífico"** tras una fusión — su portal de clientes está en `contifico.portaldeclientes.siigo.ec`. **Subió de prioridad**: ya no es un dato para una decisión futura, es el ERP del local piloto.

---

*Documento preparado por el Grupo de Ingeniería a partir de investigación técnica (documentación oficial de Contífico, Alegra, Odoo, y fuentes oficiales de soporte por país) y revisión del flujo funcional vigente.*
