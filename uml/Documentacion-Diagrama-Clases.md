# Documentación del Diagrama de Clases — Aliflow

![Diagrama de clases de Aliflow](diagrama-clases.svg)

**Diagrama fuente:** `diagrama-clases.puml` (mismo directorio) — ver `README-diagramas.md` para regenerar el SVG tras editarlo.

Este diagrama modela la **lógica de negocio** del sistema (no las clases de infraestructura/ORM/framework), organizada en 6 paquetes.

**Convención visual (revisión 27-jul-2026):** los elementos con fondo amarillo y estereotipo `<<propuesta>>` son diseño de Ingeniería sin validar todavía con Negocios — no decisiones ya confirmadas. Antes esta distinción solo vivía en este markdown; ahora es visible directamente en el `.svg`, para que no se pueda confundir una propuesta con una decisión cerrada solo mirando la imagen.

---

## 1. Paquete "Usuarios"

**Reestructurado el 28-jul-2026 con decisiones de Negocios.** El sistema tiene **exactamente 3 roles**: Estudiante, Proveedor y Operador. El rol "Administrador" **es** el Proveedor — el gerente del local — y el super-admin de plataforma que Ingeniería había supuesto **no existe**.

Jerarquía de herencia con **`Usuario`** como clase abstracta base (id, nombreCompleto, email, fechaRegistro, activo), especializada en:

- **`Estudiante`** — mapea al actor "Estudiante".
- **`UsuarioProveedor`** (abstracta) — una persona con acceso al panel de un local específico (`# proveedor: Proveedor`). Se especializa en:
  - **`Administrador`** — mapea al actor **"Proveedor"**: administra menú, métricas, la integración con el ERP del local, y las cuentas del personal de su propio local (UC12).
  - **`Operador`** — mapea al actor "Operador": valida las compras de los estudiantes y marca la entrega física. Asociado a un `PuntoDeEntrega` específico.

**Nota de vocabulario (importante para no perderse en el diagrama):** la palabra "Proveedor" designa dos cosas distintas.

| En el lenguaje de Negocios | En el diagrama de clases | Qué es |
|---|---|---|
| Rol **"Proveedor"** (= "Administrador", el gerente) | clase `Administrador` | una **persona** con cuenta en Aliflow |
| El **local** / proveedor de alimentación (Barú, Caramel Coffee) | clase `Proveedor` | el **negocio**: el tenant, con su menú, su ERP y su personal |

Se conservó `Proveedor` como nombre de la entidad-negocio porque así se usa en el acta ("proveedores de alimentación") y en todo el resto del modelo (`SaldoProveedor`, `IntegracionERP`, `tenantId`). Renombrarla habría propagado churn a ~10 archivos sin ganar claridad real; la tabla de arriba y una nota dentro del propio diagrama resuelven la ambigüedad.

**Qué se eliminó:** la clase `Administrador` que colgaba directamente de `Usuario` (el super-admin, con `darDeAltaProveedor()` y `gestionarUsuarios()`), y las clases `Propietario`/`Cajero`, renombradas a `Administrador`/`Operador` para usar el vocabulario oficial de Negocios en vez del informal del equipo.

**Personal múltiple por local — confirmado, ya no es propuesta.** Negocios confirmó (28-jul-2026) que un local puede tener **varias** cuentas de Proveedor y varias de Operador. Las cardinalidades quedaron en `Proveedor "1" *-- "1..*" Administrador` (al menos un gerente) y `Proveedor "1" *-- "0..*" Operador`. Estas clases perdieron el estereotipo `<<propuesta>>` y el fondo amarillo.

## 2. Paquete "Proveedor y Menú"

**`Proveedor`** (el tenant/negocio — en la práctica, cada local de comida de la universidad: Barú, Caramel Coffee, etc.) agrega su personal (`UsuarioProveedor`), sus puntos de entrega físicos (`PuntoDeEntrega`) y su menú (`Plato`). `Plato.hayStock()` encapsula la validación de disponibilidad que en el flujo se menciona como "revalidación de stock justo antes de confirmar" (`est-4`).

**Control de concurrencia (agregado 27-jul-2026):** `Plato` ahora tiene un campo `version` y un método `reservarStock(cantidad)` — implementa bloqueo optimista para el riesgo ya identificado desde el flujo original ("dos estudiantes no deben poder comprar la última unidad simultáneamente"). Antes este riesgo estaba documentado en prosa pero no tenía ningún elemento correspondiente en el diagrama de clases; el detalle exacto de la transacción se completa en el diagrama de secuencia.

**Validado empíricamente (27-jul-2026, ver `demo-odoo/README.md` sección 7):** se probó implementar este mismo bloqueo directamente contra el ERP externo (Odoo, vía RPC) y falló bajo concurrencia real (5 hilos comprando con 3 unidades de stock vendieron las 5). Esto confirma que `Plato.version`/`reservarStock()` deben vivir en la base de datos propia de Aliflow, no delegarse al ERP — la prueba de concurrencia repetida contra un dominio local con lock real (`demo-odoo/plato_local.py`) sí se comportó correctamente.

## 3. Paquete "Wallet y Pagos"

**Reestructurado el 28-jul-2026 con la decisión de Negocios sobre la recarga:** el estudiante hace **una única recarga** y Aliflow la distribuye internamente hacia los proveedores. Ya no hay recarga separada por local.

Consecuencia en el modelo: `TarjetaVirtual` ahora **sí** tiene un campo `saldoDisponible` — una bolsa única, gastable en cualquier local, que es lo que el estudiante ve en pantalla. Antes no lo tenía, precisamente porque el saldo vivía repartido en varios `SaldoProveedor`.

**Qué pasó con `SaldoProveedor` (y dónde está el punto abierto).** La frase "Aliflow distribuye internamente a todos los proveedores disponibles" admite dos lecturas, y la diferencia no es cosmética:

| Lectura | Qué implicaría | Veredicto |
|---|---|---|
| **A — repartir al recargar**: el monto se divide entre los N locales activos en el momento de la recarga | Con 4 locales, una recarga de $20 deja $5 en cada uno: el estudiante no puede comprar un almuerzo de $6 en ninguno pese a tener $20. Y cada local nuevo obligaría a redistribuir saldo existente. | **Inviable** — Ingeniería lo descarta |
| **B — repartir al comprar** (la que se modeló): el saldo vive en una sola bolsa; al comprar se descuenta de ahí y se acredita al libro interno del local correspondiente | El estudiante ve un solo saldo; Aliflow sabe en todo momento cuánto le debe liquidar a cada local | **Es la que está en el diagrama**, marcada `<<propuesta>>` porque es interpretación de Ingeniería, no palabra de Negocios |

Bajo la lectura B, `SaldoProveedor` deja de ser "el saldo del estudiante en ese local" y pasa a ser **el libro interno de lo que Aliflow le debe a ese local** (campo renombrado de `monto` a `montoAcumulado`, y ya no tiene `descontar()`). Falta que Negocios confirme esta lectura — está registrado en `Decisiones-Pendientes-Negocios.md`, punto 4.

**Qué pasó con el patrón Strategy.** Se conserva `EstrategiaDistribucionRecarga`, pero honestamente: ya no está ahí para "no bloquear una decisión pendiente" (la decisión se tomó), sino porque la **regla** de reparto todavía puede cambiar — si Negocios define una comisión de Aliflow o una retención, eso es una implementación nueva de la interfaz y no un `if` más en el módulo de wallet. `RecargaDirectaPorProveedor` quedó **descartada** y se eliminó del diagrama; `DistribucionBajoDemanda` es la implementación vigente. Sigue siendo un ejemplo válido de **Open/Closed**, con una justificación distinta a la original.

`Pago` (con `EstadoPago`: APROBADO/PENDIENTE/RECHAZADO — tal como se encontró en la investigación previa del equipo sobre el flujo de pagos) genera una `Recarga` solo si es aprobado. `ComprobanteRecarga` es el comprobante interno sin validez tributaria ya documentado (`est-2`).

## 4. Paquete "Órdenes"

**`Orden`** agrega una o más `OrdenDetalle` (plato + cantidad + precio unitario — generalización razonable sobre el flujo, que describe la compra de un plato a la vez, pero sin costo de diseño adicional soporta más de un ítem). Tiene un `CodigoRetiro` propio (value object: valor, fechaExpiracion, usado).

**Formato del código, cerrado el 28-jul-2026:** Negocios eligió **código numérico corto de 6 dígitos**, descartando la propuesta previa de Ingeniería (UUID firmado con expiración). La razón es operativa y es buena: el estudiante se lo dice de viva voz al Operador, que lo digita en Aliflow para marcar el retiro — un UUID de 36 caracteres es impracticable para eso. Dos consecuencias de diseño quedaron anotadas en el diagrama:

1. **La unicidad se acota.** Seis dígitos son ~10⁶ combinaciones: suficientes solo si la unicidad se exige entre los códigos **vigentes de un mismo local**, no globalmente ni de forma histórica. La generación reintenta ante colisión.
2. **El código pasa a ser adivinable.** Un UUID firmado no se puede adivinar; 6 dígitos sí. Registrado como riesgo **R-15** en `Gestion-de-Riesgos.md` con su mitigación (límite de intentos + el hecho de que el Operador ve físicamente al estudiante).

`EstadoOrden` incluye **`EXPIRADO`** además de `COMPRADO`/`ENTREGADO` — esto no estaba en el flujo original; se agrega para cubrir el vacío ya detectado de "no hay estado para una orden nunca retirada" (`Hallazgos-Ingenieria-API-Generica.md`, sección 5.3). Es una propuesta de Ingeniería, marcada ahora también dentro del propio diagrama (nota amarilla junto a `EstadoOrden`), pendiente de que Negocios defina la regla exacta (después de cuánto tiempo expira, si hay reembolso, etc. — esto último sigue fuera de alcance de v1 según el acta).

`ComprobanteCompra` es el comprobante interno sin validez tributaria (`est-4`/`prov-6`), distinto de la factura real que el proveedor emite en su propio ERP.

**Regla de un solo local por orden (corregida 27-jul-2026):** `Orden` ahora tiene una asociación directa a `Proveedor` (no solo indirecta vía `OrdenDetalle → Plato → Proveedor`), con un invariante explícito en el diagrama: todos los `OrdenDetalle` de una misma `Orden` deben pertenecer a platos del mismo proveedor. Antes de esta corrección, el modelo permitía —sin querer— una orden con platos de proveedores distintos, lo cual habría roto el resto de la arquitectura (saldo por proveedor, un solo `tenantId` por llamada a `notifySale`, un evento de sincronización por orden). `confirmarCompra()` es responsable de validar este invariante antes de crear la orden.

**Auditoría (agregada 27-jul-2026):** `RegistroAuditoria` responde al riesgo R-09 (`Gestion-de-Riesgos.md`), que pedía explícitamente registro de auditoría para compras y redenciones — antes este requisito estaba documentado como riesgo pero no tenía ninguna clase correspondiente. Registra quién ejecutó `confirmarCompra()`, `marcarEntregado()`, `invalidar()` y la acreditación interna al local.

## 5. Paquete "Fidelidad" (requisito nuevo, 28-jul-2026)

Negocios pidió una **cartilla de fidelidad**: el estudiante acumula un sello por compra y al completar la cartilla gana un premio. **Cuántos sellos y qué premio todavía están en definición**, así que todo el paquete está marcado `<<propuesta>>`.

**La decisión de diseño que evita quedarse esperando:** los dos datos que faltan (`sellosRequeridos`, `descripcionPremio`) se modelan como **campos configurables de `ProgramaFidelidad`**, no como constantes. Cuando Negocios los defina, es un valor en base de datos — no hay que rediseñar ni reprogramar nada. Lo mismo con `vigenciaCartillaDias` (si Negocios decide que la cartilla no caduca, el campo queda nulo) y con `maxSellosPorDia`.

**Cuatro decisiones de diseño que Ingeniería tomó y conviene que Negocios revise:**

1. **El programa es por local, no de la plataforma.** `ProgramaFidelidad` cuelga de `Proveedor`. La razón es económica, no técnica: el premio lo regala el local, así que es el local quien debe poder decidir si lo ofrece, cuántos sellos pide y qué da. Un local puede no tener programa. Como consecuencia, el estudiante tiene **una cartilla activa por local**, no una sola global.
2. **El sello se acredita al entregar, no al comprar.** `Sello` se crea dentro de `Orden.marcarEntregado()`, no de `confirmarCompra()`. Si se acreditara al comprar, un estudiante podría llenar la cartilla comprando almuerzos y nunca yendo a buscarlos — el local pagaría el premio sin haber vendido nada real. Además el sello así acompaña al acto físico, que es lo que el negocio quiere premiar.
3. **Un sello por orden, garantizado por el modelo.** La asociación `Sello --> Orden` es 1 a 1 con restricción de unicidad. Si la confirmación de entrega se reintenta (fallo de red, doble clic del Operador), la segunda inserción falla y no se acredita dos veces. Es el mismo principio de idempotencia que ya se usa en el outbox con `eventId`.
4. **Un sello por día como tope por defecto.** `maxSellosPorDia = 1`. Sin este límite, la cartilla premia volumen en vez de recurrencia, y se puede llenar en un solo día comprando el ítem más barato del menú varias veces. Este punto depende de lo que Negocios haya querido decir con "10 veces diarias" — ver `Decisiones-Pendientes-Negocios.md`, punto 9.

**El canje toca el resto del sistema en tres lugares:**

- **`Orden.esCanje`** — el canje se aplica sobre una orden real con total $0. Tiene que ser una orden de verdad porque el plato igual sale del inventario y el estudiante igual necesita un código de retiro.
- **La wallet no se toca.** No se descuenta `TarjetaVirtual.saldoDisponible` ni se acredita `SaldoProveedor`: Aliflow no le debe nada al local por un premio que el local mismo decidió regalar.
- **El ERP sí se entera, y ahí hay un problema abierto.** Un `notifySale` con monto $0 puede parecerle un error al ERP del local. Habría que emitirlo como documento de cortesía o descuento del 100%, y eso se resuelve distinto en Contífico que en Alpwin. Está registrado como pendiente.

**Concurrencia:** el paso `COMPLETA → CANJEADA` usa el mismo mecanismo atómico y condicional que la redención del código de retiro (`UPDATE ... WHERE estado = 'COMPLETA'`). Si dos pestañas del estudiante intentan canjear a la vez, la segunda afecta 0 filas y falla sin crear la orden.

## 6. Paquete "Integración con ERP externo"

Materializa directamente la arquitectura ya diseñada en `Hallazgos-Ingenieria-API-Generica.md` (sección 3):

- **`IInventoryProvider`** (interfaz/puerto) — el core de Aliflow (representado aquí por la dependencia `Orden ..> IInventoryProvider`) solo conoce esta abstracción, nunca un ERP concreto.
- **`ContificoAdapter`**, **`AlpwinAdapter`**, **`OdooAdapter`** — adaptadores concretos (patrón **Adapter**). `AlpwinAdapter` lleva una nota explícita: al no tener API pública, su implementación real sería por archivos/BD puente, no llamadas síncronas.
- **`ProviderAdapterFactory`** — patrón **Factory Method**: dado un `Proveedor`, lee su `IntegracionERP.tipoERP` y devuelve la implementación concreta correspondiente. Nadie más en el sistema necesita un `switch`/`if` sobre el tipo de ERP.

**Actualizado el 28-jul-2026 — este paquete dejó de ser una previsión y pasó a ser un requisito duro.** Negocios aclaró que Aliflow debe poder conectarse al ERP de **cualquier** local de la universidad, y que cada uno tiene el suyo: Barú usa **Contífico**, Caramel Coffee usa **Alpwin**, y así sucesivamente. Tres consecuencias sobre el modelo:

1. **Varios adaptadores conviven en producción**, no uno. Antes se asumía un único ERP objetivo y la factory era casi decorativa; ahora es la pieza que hace funcionar el multi-tenant real. El diseño no cambió — es exactamente lo que el patrón Adapter + Factory estaba pensado para soportar — pero pasó de "buena práctica defensiva" a "sin esto el producto no existe".
2. **La interfaz es bidireccional** y eso ahora está explícito. `getMenu()`/`getStock()` traen el inventario del local hacia Aliflow; `updateStock()`/`notifySale()` y el nuevo **`notifyPayment()`** devuelven al ERP las órdenes y los pagos, para que su inventario y su contabilidad queden sincronizados. Se agregó `TipoEvento.NOTIFICAR_PAGO` al outbox por la misma razón.
3. **`TipoERP` cambió de contenido y de rol.** Ahora es `CONTIFICO | ALPWIN | ODOO | OTRO`, con Contífico primero por ser el del local piloto. El valor `OTRO` es deliberado: agregar un local con un ERP desconocido debe ser un valor de enum más una clase adaptadora, sin tocar el core.
- **`EventoSincronizacion`** + **`SincronizacionWorker`** — implementan el patrón **Outbox** ya diseñado: cada venta genera un evento (`TipoEvento.NOTIFICAR_VENTA`), que el worker procesa con reintentos (`EstadoEvento`: PENDIENTE/PROCESADO/FALLIDO), evitando la "venta huérfana" ya identificada como riesgo (R-02 en `Gestion-de-Riesgos.md`).

---

## Principios SOLID aplicados

| Principio | Dónde se aplica |
|---|---|
| **S — Responsabilidad única** | `Orden` gestiona su propio estado y ciclo de vida; la traducción a cada ERP vive exclusivamente en su adaptador; `SincronizacionWorker` solo orquesta reintentos, no lógica de negocio de la venta. |
| **O — Abierto/cerrado** | Agregar un ERP nuevo = una clase `NuevoErpAdapter` nueva, cero cambios al core (`IInventoryProvider` ya definido). Igual con `EstrategiaDistribucionRecarga`: una nueva regla de negocio de recarga es una clase nueva, no un `if` más. |
| **L — Sustitución de Liskov** | Cualquier `IInventoryProvider` (Contífico/Alpwin/Odoo) es intercambiable sin que el código que lo usa (`SincronizacionWorker`, `Orden`) se entere de la diferencia. Con varios locales activos a la vez, esto se ejercita de verdad en producción, no solo en teoría. |
| **I — Segregación de interfaces** | `IInventoryProvider` se mantiene deliberadamente pequeña (6 métodos, todos relacionados a inventario/venta/pago) — no se mezcla con responsabilidades de facturación fiscal, que quedan fuera de esta interfaz. |
| **D — Inversión de dependencias** | `ProviderAdapterFactory` y `SincronizacionWorker` dependen de la abstracción `IInventoryProvider`, nunca de `OdooAdapter`/`ContificoAdapter`/`AlpwinAdapter` directamente. |

## Patrones de diseño usados (y por qué, no solo "porque sí")

- **Adapter** — resuelve directamente el reto técnico central del proyecto (integrar con ERPs heterogéneos sin acoplarse a ninguno).
- **Factory Method** (`ProviderAdapterFactory`) — evita que la lógica de "qué adaptador usar" se disperse por el código; centraliza la decisión en un solo lugar.
- **Strategy** (`EstrategiaDistribucionRecarga`) — originalmente servía para no bloquear el diseño mientras Negocios decidía el mecanismo de recarga. Tomada esa decisión (28-jul-2026), se conserva porque la **regla de reparto** interno (comisiones, retenciones) sigue siendo un punto de variación real del negocio.
- **Outbox** (arquitectural, no GoF clásico) — ya validado técnicamente en el demo con Odoo Community (`Hallazgos-Ingenieria-API-Generica.md`, sección 4.2).

No se forzaron patrones adicionales (ej. Singleton, Observer) donde no había un problema real que resolver — evitar ese "mal olor" de sobre-ingeniería fue una decisión deliberada.

## Malos olores evitados

- **God class**: no existe una clase "Sistema" o "AliflowService" que concentre toda la lógica — cada responsabilidad vive en la clase del dominio que le corresponde.
- **Primitive obsession**: `CodigoRetiro` y los comprobantes son objetos propios (con su propia validación) en vez de campos sueltos tipo `String codigo` regados por otras clases.
- **Acoplamiento a implementación externa**: ninguna clase de dominio (`Orden`, `Plato`, `Proveedor`) importa o conoce un SDK específico de Odoo/Contífico — todo pasa por `IInventoryProvider`.

## Supuestos y pendientes de este diagrama (a validar con el equipo/Negocios)

Todos marcados con `<<propuesta>>` y fondo amarillo directamente en el diagrama. Con las decisiones del 28-jul-2026, la lista **bajó de 5 supuestos a 3**:

1. `SaldoProveedor` como libro interno acreditado **al momento de la compra** — es la interpretación de Ingeniería de "Aliflow distribuye internamente" (lectura B de la tabla en la sección 3). Falta que Negocios la confirme.
2. `EstadoOrden.EXPIRADO` es una adición de Ingeniería para cubrir el vacío de "orden nunca retirada" — falta que Negocios defina la regla de expiración exacta.
3. `Usuario.autenticar()` no distingue aún el mecanismo (OAuth institucional para Estudiante vs. credenciales propias para Proveedor y Operador) a nivel de firma — se resuelve en `uml/actividad-autenticacion.puml`.
4. **Todo el paquete "Fidelidad"** — es un requisito real de Negocios, pero su modelado completo (programa por local, sello en la entrega, tope diario, canje como orden de $0) es diseño de Ingeniería sobre una descripción todavía incompleta. Ver sección 5.

**Cerrados por Negocios el 28-jul-2026** (ya no son supuestos): la jerarquía de personal por local, el alcance del rol Administrador (que resultó ser el Proveedor mismo), el mecanismo de recarga, y el formato del código de retiro.

## Cambios aplicados en la revisión del 28-jul-2026 (decisiones de Negocios)

Negocios resolvió cinco de las decisiones que bloqueaban el modelo. Impacto sobre este diagrama:

| # | Decisión de Negocios | Cambio en el diagrama |
|---|---|---|
| 1 | Aliflow se conecta al ERP de **cualquier** local; cada uno usa el suyo (Barú → Contífico, Caramel Coffee → Alpwin) y la conexión es bidireccional | `TipoERP` reordenado y con `OTRO`; `notifyPayment()` agregado a `IInventoryProvider`; `TipoEvento.NOTIFICAR_PAGO` agregado al outbox |
| 2 | Solo 3 roles; "Administrador" = "Proveedor" = gerente del local | Eliminada la clase `Administrador` de plataforma; `Propietario`→`Administrador`, `Cajero`→`Operador`; `marcarEntregado(operador)` |
| 3 | Un local puede tener varios Proveedores y varios Operadores | Cardinalidades `1..*` / `0..*`; la jerarquía `UsuarioProveedor` deja de ser `<<propuesta>>` |
| 4 | Recarga única distribuida internamente | `TarjetaVirtual.saldoDisponible` agregado; `SaldoProveedor` pasa a libro interno (`montoAcumulado`); `RecargaDirectaPorProveedor` eliminada, `DistribucionBajoDemanda` vigente |
| 6 | Código de retiro numérico corto | `CodigoRetiro.valor` documentado como 6 dígitos; nota de unicidad acotada por local; riesgo R-15 |
| 9 | **Cartilla de fidelidad** (requisito nuevo) | Paquete "Fidelidad" completo: `ProgramaFidelidad`, `Cartilla`, `Sello`, `Canje`, `EstadoCartilla`; campo `Orden.esCanje`; riesgo R-17 |

**Lo que estas decisiones mejoraron y lo que complicaron**, dicho sin adornos:

- **Mejor:** el local piloto pasó de ser el caso imposible (Alpwin, sin API) al caso fácil (Contífico, API REST documentada). El riesgo que más pesaba en el proyecto (R-11) dejó de bloquear el arranque.
- **Más difícil:** el sistema ya no es "Aliflow + un proveedor", sino una plataforma multi-tenant con N ERP heterogéneos conviviendo. Eso encarece pruebas, credenciales, monitoreo y soporte — y hace que la capa de integración deje de ser opcional.
- **Sin resolver:** cuándo ocurre exactamente la distribución interna del saldo (ver sección 3), y quién da de alta un local nuevo ahora que no existe un super-admin (ver `uml/Documentacion-Casos-de-Uso.md`, UC12).

## Correcciones aplicadas en esta revisión (27-jul-2026)

A partir de una autoevaluación crítica del diseño hasta este punto, se corrigieron 3 inconsistencias reales y se cerraron 2 vacíos:

1. **Inconsistencia — orden multi-proveedor no prevenida**: corregida con la asociación directa `Orden → Proveedor` + invariante explícito (ver sección 4 arriba).
2. **Inconsistencia — sin distinción visual entre confirmado y propuesto**: corregida con la convención `<<propuesta>>` + leyenda de colores, aplicada en este diagrama y en `casos-de-uso.puml`/`diagrama-componentes.puml`.
3. **Vacío — sin control de concurrencia modelado**: corregido con `Plato.version` + `reservarStock()` (bloqueo optimista).
4. **Vacío — sin clase de auditoría pese a que R-09 la pedía explícitamente**: corregido con `RegistroAuditoria`.
5. **Riesgo R-01 desactualizado** tras el hallazgo de Alpwin: corregido en `Gestion-de-Riesgos.md`, no en este diagrama directamente.
