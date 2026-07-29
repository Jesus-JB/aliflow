# Decisiones de Negocios — Aliflow

**Preparado por:** Grupo de Ingeniería
**Creado:** 27-jul-2026, para la reunión con el Grupo de Negocios
**Actualizado:** 28-jul-2026 — Negocios resolvió 5 de las 8 decisiones abiertas y agregó un requisito nuevo (cartilla de fidelidad, punto 9)
**Objetivo:** llevar la cuenta de qué está decidido, qué sigue abierto, y qué cambió en el diseño como consecuencia.

Todo lo trabajado (arquitectura, casos de uso, diagramas de clases/objetos/componentes/despliegue/actividad/secuencia/estado, registro de riesgos, demo funcional) está en el repositorio: **https://github.com/Jesus-JB/aliflow**. Este documento no repite ese contenido — apunta a la sección exacta de cada documento donde está el detalle.

---

## Resumen del estado

| # | Decisión | Estado | Bloqueaba |
|---|---|---|---|
| 1 | Proveedor y sistema ERP reales | ✅ **Resuelta y corregida** | Modelo de datos |
| 2 | Alcance del rol Administrador | ✅ **Resuelta** | Modelo de datos |
| 3 | Personal múltiple por proveedor | ✅ **Resuelta** | Modelo de datos |
| 4 | Mecanismo de recarga de saldo | ✅ **Resuelta**, con un punto fino por confirmar | Lógica de wallet |
| 5 | Regla de expiración de orden no retirada | ⬜ Abierta | Nada crítico |
| 6 | Formato del código de retiro | ✅ **Resuelta** | Prototipo de mockups |
| 7 | Modelo de cobro de Aliflow al proveedor | ⬜ Abierta | Nada crítico |
| 8 | Corrección del Acta (comprobante tributario) | ⬜ Abierta — pendiente de explicación, ver abajo | Documento de requerimientos |
| 9 | **Cartilla de fidelidad** *(requisito nuevo)* | 🆕 **Modelada**, faltan las reglas | Nada — se modeló como configuración |

**Las tres decisiones que bloqueaban el modelo de base de datos (#1, #2, #3) están cerradas. Ingeniería puede empezar el esquema de base de datos.**

---

## ✅ Decisiones resueltas el 28-jul-2026

### 1. El proveedor y su ERP — respuesta que corrige el hallazgo anterior

**Lo que respondió Negocios:** Aliflow no se conecta a *un* proveedor. Debe poder conectarse al ERP de **cualquier local de comida de la universidad**, y cada uno usa un sistema distinto: **Barú usa Contífico**, **Caramel Coffee usa Alpwin**, y así los demás. La conexión debe ser **bidireccional**: el ERP del local le informa a Aliflow su inventario disponible del día y los pedidos, y Aliflow le devuelve las órdenes realizadas y los pagos, para mantener el inventario sincronizado.

**Esto corrige un error de Ingeniería, no solo agrega información.** El documento de hallazgos del 26-jul afirmaba que Barú usaba Alpwin — venía de una fuente indirecta (una conversación previa del equipo), y ese mismo documento advertía que no estaba confirmado en acta. La advertencia era correcta: el dato estaba invertido.

**Qué mejora y qué empeora** — conviene decir las dos cosas:

| | Antes (lo que Ingeniería creía) | Ahora (lo real) |
|---|---|---|
| ERP del local piloto | Alpwin — **sin API pública** | **Contífico — API REST documentada** |
| Riesgo dominante | Que el piloto fuera técnicamente inviable | Conseguir credenciales: un problema de gestión, no de ingeniería |
| Alcance del producto | Una integración con un proveedor | **Una plataforma multi-tenant** con N ERP conviviendo |
| Costo de operación | Un juego de credenciales, un ERP | N credenciales, N ERP, N formatos de error, N soportes |

En resumen: **el arranque se destrabó y el producto creció**. El riesgo que más pesaba en el proyecto (integrar con un sistema sin API) dejó de bloquear el piloto. A cambio, sostener varios ERP a la vez tiene un costo operativo real que quedó registrado como riesgo nuevo (R-16).

**Un punto técnico que Negocios debería conocer antes de prometerle "tiempo real" a un local:** la dirección *Aliflow → ERP* es fácil (una llamada a su API). La dirección *ERP → Aliflow* es la difícil, porque **Contífico no tiene webhooks** y **Alpwin no tiene ni API**. Ninguno de los dos puede avisarle a Aliflow por iniciativa propia. En la práctica, esa mitad de la bidireccionalidad se implementa con **polling** de Aliflow contra el ERP cada X minutos, lo que deja una ventana en la que el inventario mostrado puede estar desactualizado. Es un límite del ERP del local, no de Aliflow.

**Impacto en el diseño (ya aplicado):**
- `Hallazgos-Ingenieria-API-Generica.md` sección 4.3 — reescrita completa, con la ruta de implementación ajustada.
- `uml/diagrama-clases.puml` — `TipoERP` reordenado con `CONTIFICO` primero y valor `OTRO`; método `notifyPayment()` agregado a `IInventoryProvider`; `TipoEvento.NOTIFICAR_PAGO` agregado al outbox.
- `uml/objeto-integracion-erp.puml` — ahora muestra los dos locales reales a la vez: Barú/Contífico sincronizando bien, Caramel Coffee/Alpwin fallando tras 3 reintentos.
- `uml/diagrama-componentes.puml` y `uml/diagrama-despliegue.puml` — flechas bidireccionales y los dos ERP externos.
- `Gestion-de-Riesgos.md` — R-01 sube a impacto Catastrófico y vuelve a ser el riesgo dominante; R-11 baja a Moderado; se agrega R-16.

---

### 2. Alcance del rol Administrador — el rol no existe

**Lo que respondió Negocios:** solo hay **3 roles**: Estudiante, Proveedor y Operador. El "Administrador" **es** el Proveedor — el gerente del local. El Operador valida las compras de los estudiantes y marca la entrega física del almuerzo.

Ingeniería había propuesto un super-admin de plataforma con tres funciones (alta de proveedores, métricas globales, gestión de usuarios), marcado en amarillo en los diagramas precisamente porque no tenía base en ningún acta. La suposición era incorrecta y se eliminó.

**Impacto en el diseño (ya aplicado):**
- `uml/casos-de-uso.puml` — eliminado el actor Administrador. **UC13 y UC14 eliminados.** UC12 redefinido como "Gestionar usuarios del local" y reasignado al Proveedor. *(Los números UC13/UC14 se reutilizaron después para la cartilla de fidelidad — punto 9 — y no tienen relación con los anteriores.)*
- `uml/diagrama-clases.puml` — eliminada la clase `Administrador` de plataforma. `Propietario` → `Administrador` (la persona gerente) y `Cajero` → `Operador`, para usar el vocabulario oficial de Negocios.
- `uml/diagrama-componentes.puml` — "Módulo de Administración" → "Módulo de Usuarios del Local".

**Consecuencia que quedó abierta:** si ningún rol del sistema da de alta un local nuevo, ese paso es **manual y fuera del alcance de v1** — lo haría el equipo de Aliflow directamente, junto con la configuración de la integración (UC7). Es la propuesta de Ingeniería; si Negocios prefiere otra cosa, hay que decidirlo (ver "Puntos abiertos", más abajo).

**Nota de vocabulario, porque "Proveedor" ahora significa dos cosas:**

| En el lenguaje de Negocios | En el diagrama de clases | Qué es |
|---|---|---|
| Rol **"Proveedor"** (= el gerente) | clase `Administrador` | una **persona** con cuenta en Aliflow |
| El **local** (Barú, Caramel Coffee) | clase `Proveedor` | el **negocio**: tenant, con su menú, su ERP y su personal |

---

### 3. Personal múltiple por proveedor — confirmado

**Lo que respondió Negocios:** sí, un local puede tener varios Proveedores (varios administradores) y varios Operadores.

Esto confirma la jerarquía que Ingeniería había propuesto. Dejó de estar marcada como propuesta.

**Impacto en el diseño (ya aplicado):** `uml/diagrama-clases.puml` — cardinalidades `Proveedor "1" *-- "1..*" Administrador` y `Proveedor "1" *-- "0..*" Operador`; la jerarquía `UsuarioProveedor` perdió el estereotipo `<<propuesta>>` y el fondo amarillo. Se agregó UC12 para que un Proveedor pueda dar de alta al personal de su propio local.

---

### 4. Mecanismo de recarga — recarga única (con un punto fino que Ingeniería resolvió por interpretación)

**Lo que respondió Negocios:** el estudiante hace una única recarga que Aliflow distribuye internamente a todos los proveedores disponibles.

**El punto fino.** "Distribuir a todos los proveedores" admite dos lecturas y la diferencia no es cosmética:

| Lectura | Qué implicaría | Veredicto de Ingeniería |
|---|---|---|
| **A — repartir al recargar**: el monto se divide entre los locales activos en el momento de la recarga | Con 4 locales, una recarga de $20 deja $5 en cada uno: el estudiante **no puede comprar un almuerzo de $6 en ninguna parte** pese a tener $20. Y cada local nuevo obligaría a redistribuir saldo existente. | **Inviable** |
| **B — repartir al comprar**: el saldo vive en una sola bolsa; al comprar se descuenta de ahí y se acredita al libro interno del local correspondiente | El estudiante ve un solo saldo y lo gasta donde quiera; Aliflow sabe en todo momento cuánto le debe liquidar a cada local | **La que se implementó** |

Ingeniería avanzó con la lectura B porque la A no funciona operativamente, pero **es una interpretación, no algo que Negocios haya dicho**. Está marcada en amarillo en el diagrama de clases. **Lo que hace falta confirmar es solo esto: ¿es correcto que el estudiante vea un único saldo utilizable en cualquier local, y que Aliflow lleve internamente la cuenta de lo que le debe a cada uno?** Si la respuesta es sí, no hay nada más que decidir aquí.

**Impacto en el diseño (ya aplicado):**
- `uml/diagrama-clases.puml` — `TarjetaVirtual` ahora tiene `saldoDisponible` (la bolsa única). `SaldoProveedor` pasó de ser "el saldo del estudiante en ese local" a ser "lo que Aliflow le debe a ese local" (`montoAcumulado`). Se eliminó la implementación `RecargaDirectaPorProveedor`; queda `DistribucionBajoDemanda`.
- `uml/actividad-recarga-saldo.puml`, `uml/secuencia-recarga-saldo.puml` — el paso de distribución salió de la recarga.
- `uml/actividad-compra-almuerzo.puml`, `uml/secuencia-compra-almuerzo.puml` — la acreditación al local entró en la compra.
- `uml/objeto-billetera-orden.puml` — el snapshot muestra a una estudiante con $8.50 en la bolsa común y dos libros internos ($3.50 a Barú, $2.00 a Caramel Coffee).

**Nota:** este cambio contradice el marco de negocio del 13-jul-2026, que decía "el saldo es independiente por proveedor". La decisión del 28-jul lo reemplaza. Vale la pena que quede registrado en acta para que no reaparezca como contradicción en el documento de requerimientos.

---

### 6. Formato del código de retiro — numérico corto

**Lo que respondió Negocios:** código numérico corto, para que el estudiante lo presente al Operador y este lo ingrese en Aliflow para marcar el retiro.

Ingeniería había propuesto un UUID firmado con expiración. La decisión de Negocios lo descarta por una razón operativa correcta: un UUID de 36 caracteres es impracticable para dictar de viva voz. **Se implementa como 6 dígitos**, con expiración y un solo uso.

**Dos consecuencias técnicas que trae el formato corto:**

1. **La unicidad tiene que acotarse.** Seis dígitos son ~1 millón de combinaciones: alcanzan de sobra si se exige unicidad solo entre los códigos **vigentes de un mismo local**, pero no si se pretende que sean únicos históricamente. El sistema reintenta la generación si hay colisión. Sin este matiz, el esquema se rompe en pocos meses de operación.
2. **El código pasa a ser adivinable.** Un UUID no se puede adivinar; 6 dígitos sí. Quedó registrado como riesgo **R-15**, con mitigación: límite de intentos fallidos por Operador, expiración corta (horario de almuerzo, no todo el día), y —la más fuerte— que el panel muestre el **nombre del estudiante** antes de confirmar la entrega, ya que el Operador lo tiene físicamente enfrente.

**Esto desbloquea el prototipo de mockups (entregable 01.f).**

**Impacto en el diseño (ya aplicado):** `uml/diagrama-clases.puml`, `uml/estado-codigo-retiro.puml`, `uml/secuencia-compra-almuerzo.puml`, `uml/actividad-compra-almuerzo.puml`, `uml/objeto-billetera-orden.puml`, y `Gestion-de-Riesgos.md` (R-15).

---

## ⬜ Puntos que siguen abiertos

### 5. Regla de expiración de una orden no retirada

**Por qué importa:** define si hace falta algún proceso de reembolso o solo un registro histórico.
**Estado:** Ingeniería propuso un mecanismo concreto — la orden expira cuando vence el código de retiro sin usarse.
**Necesitamos que Negocios confirme:** ¿está bien esa regla? ¿Debería haber reembolso o notificación al proveedor?
**Detalle:** `uml/Documentacion-Diagramas-Estado.md`, sección 1.

### 7. Modelo de cobro de Aliflow al proveedor

**Por qué importa:** si se decide una comisión o suscripción, hace falta una tabla de facturación de Aliflow hacia el local (distinta de la del local hacia el estudiante).
**Estado:** sin propuesta — es una decisión de modelo de negocio, no algo que Ingeniería deba proponer.
**Necesitamos que Negocios decida:** ¿comisión por transacción, suscripción fija, u otro esquema?
**Nota nueva (28-jul):** con la decisión #4, Aliflow ya lleva internamente cuánto le debe a cada local. Si el cobro fuera una comisión por transacción, se descontaría exactamente en ese punto — el modelo ya tiene el lugar donde encajarlo.

### 8. Corrección del Acta original (comprobante tributario) — *"¿a qué se refiere?"*

Negocios preguntó qué significa este punto. Explicación completa:

**El problema es que dos documentos del proyecto dicen cosas opuestas sobre lo mismo, y ambos son del 25-jun-2026:**

- **El Acta de reunión** (sección 4) dice que la compra del almuerzo genera un *"comprobante **válido tributariamente**"*.
- **El flujo funcional** (paso `prov-6`, "Re-emisión de comprobante tributario") dice lo contrario: que *"Aliflow emite un comprobante de compra **sin validez tributaria**"* y que **el proveedor re-emite la factura real en su propio sistema**.

**Por qué la diferencia importa y no es un tecnicismo.** Emitir un comprobante con validez tributaria en Ecuador significa emitir una factura electrónica autorizada por el SRI: requiere un certificado de firma digital, un RUC emisor, secuenciales autorizados y responsabilidad fiscal sobre lo emitido. Si el Acta se toma literalmente, **Aliflow sería el emisor fiscal de cada almuerzo**, lo que implicaría que Aliflow le está vendiendo el almuerzo al estudiante, no el local. Eso cambia el modelo de negocio entero, no solo el software.

**Cuál es el modelo correcto.** El del flujo, y ya está confirmado por el marco de negocio del 13-jul-2026: Aliflow emite un **comprobante interno** (una constancia de que el estudiante pagó y tiene derecho a retirar su almuerzo, sin valor fiscal), y **el local emite la factura real en su propio ERP** — que es justamente para lo que existe la integración. Todo el diseño está construido así: las clases `ComprobanteCompra` y `ComprobanteRecarga` tienen el campo `sinValidezTributaria = true`, y el caso de uso UC11 existe únicamente para darle al local los datos que necesita para re-emitir.

**Qué necesitamos de Negocios.** Nada complicado: solo **corregir la redacción de la sección 4 del Acta** para que diga "comprobante de compra sin validez tributaria; el proveedor re-emite la factura fiscal en su sistema". No cambia nada de lo ya decidido ni de lo ya construido — evita que quede una contradicción entre dos documentos oficiales del proyecto cuando se redacte la especificación de requerimientos final.

**Detalle:** `Hallazgos-Ingenieria-API-Generica.md`, sección 5.1.

### 9. Cartilla de fidelidad — requisito nuevo, ya modelado

**Lo que pidió Negocios:** una cartilla de fidelidad — por cada compra el estudiante acumula un sello, y al completarla gana un premio. **Cuántos sellos hacen falta y cuál es el premio siguen en definición.**

**Cómo se resolvió el no saber esos dos datos:** no se esperó a tenerlos. Se modelaron como **configuración por local** (`ProgramaFidelidad.sellosRequeridos` y `descripcionPremio`), no como constantes del sistema. Cuando Negocios los defina, es un valor que se carga en base de datos desde el panel del Proveedor (UC14) — no hay que rediseñar ni reprogramar nada. Lo mismo con la caducidad de la cartilla y con el tope de sellos por día.

**Lo que Ingeniería sí tuvo que decidir para poder modelarlo.** Estas cuatro no las dijo Negocios; son propuestas y conviene revisarlas:

| Decisión | Qué se asumió | Por qué |
|---|---|---|
| **¿La cartilla es por local o global?** | **Por local.** Un estudiante tiene una cartilla activa en Barú y otra en Caramel Coffee, independientes. | El premio lo regala el local, no Aliflow. Sería injusto que las compras en Barú llenen una cartilla que Caramel Coffee tiene que pagar. También permite que un local no ofrezca programa. |
| **¿El sello se gana al comprar o al retirar?** | **Al retirar** (`marcarEntregado`). | Si se ganara al comprar, se puede llenar la cartilla comprando almuerzos y no yendo nunca a buscarlos: el local pagaría un premio por ventas que no ocurrieron físicamente. |
| **¿Cuántos sellos se pueden ganar en un día?** | **Uno** (configurable). | Sin tope, la cartilla premia volumen en vez de recurrencia y se llena en un solo día comprando el ítem más barato del menú varias veces. |
| **¿Cómo se cobra el premio?** | Como una **orden real con total $0** (`esCanje = true`): descuenta stock, genera código de retiro, pero no toca el saldo del estudiante ni lo que Aliflow le debe al local. | El plato igual sale del inventario y el estudiante igual tiene que retirarlo. Y Aliflow no le debe nada al local por un premio que el local decidió regalar. |

**La pregunta concreta que necesitamos que Negocios responda.** En la descripción se dijo *"si lo hace durante 10 veces diarias por ejemplo"*, y eso admite dos lecturas muy distintas:

| Lectura | Qué significaría | Comentario de Ingeniería |
|---|---|---|
| **A — 10 compras en un mismo día** | El estudiante debe comprar 10 almuerzos el mismo día para completar la cartilla | No parece realista: nadie almuerza 10 veces. Y si se cuenta cualquier ítem (café, snack), premia gasto, no lealtad. |
| **B — 10 compras, una por día, a lo largo de 10 días** | Cartilla de sellos clásica: vuelve 10 veces y el 11° te lo regalamos | **Es la que se implementó**, con tope de 1 sello por día. Es el mecanismo estándar de fidelidad y es el que tiene sentido para un almuerzo. |

Si la intención era A, o algo intermedio (varios sellos por día pero con monto mínimo), avísanos: es cambiar el valor de `maxSellosPorDia`, no rediseñar.

**Un punto técnico que hay que verificar antes de construirlo:** el canje genera una venta de **$0** en el ERP del local. Un `notifySale` con monto cero puede parecerle un error al ERP y rechazarlo. Habría que emitirlo como documento de cortesía o descuento del 100%, y eso se resuelve distinto en Contífico que en Alpwin. Es una verificación pendiente contra la documentación de Contífico.

**Impacto en el diseño (ya aplicado):**
- `uml/diagrama-clases.puml` — paquete nuevo **"Fidelidad"**: `ProgramaFidelidad`, `Cartilla`, `Sello`, `Canje`, `EstadoCartilla`; campo `Orden.esCanje`.
- `uml/estado-cartilla.puml` *(diagrama nuevo)* — ciclo de vida `EN_CURSO → COMPLETA → CANJEADA`, con `EXPIRADA`.
- `uml/casos-de-uso.puml` — UC13 (consultar cartilla), UC14 (configurar el programa), UC15 (canjear premio) y el sub-flujo "Acreditar sello" dentro de UC5.
- `uml/actividad-retiro-entrega.puml` y `uml/secuencia-retiro-entrega.puml` — la acreditación del sello, después de confirmar la entrega.
- `uml/diagrama-componentes.puml` — "Módulo de Fidelidad" aparte del de Órdenes.
- `Gestion-de-Riesgos.md` — riesgo **R-17**.

**Riesgo que conviene nombrar:** un requisito nuevo entrando después de cerrar el diseño es exactamente lo que R-08 advertía. Se absorbió sin rehacer nada, pero **el alcance del módulo debería congelarse en "una cartilla simple: N sellos → 1 premio, por local"**. Si más adelante aparecen puntos, niveles o campañas por temporada, eso es otro proyecto — y en un taller con fecha de entrega, conviene decirlo ahora y no después.

### Nuevo — ¿quién da de alta un local nuevo?

Surgió como consecuencia de la decisión #2: al no existir un super-admin de plataforma, ningún rol del sistema puede registrar un local nuevo en Aliflow.
**Propuesta de Ingeniería:** dejarlo fuera de alcance de v1 — lo hace el equipo de Aliflow manualmente, junto con la configuración de la integración con el ERP de ese local (UC7), que de todas formas requiere trabajo técnico.
**Necesitamos que Negocios confirme** que eso es aceptable, o defina otra cosa.

---

## 🟢 Ya resueltas por Ingeniería — solo pendiente de "luz verde"

Estas no requieren debate, solo que Negocios las revise y apruebe o señale si algo no cuadra:

- **Ruta de implementación (actualizada 28-jul):** Fase 0 = demo con Odoo Community (ya construido y probado, sirve como banco de pruebas de la arquitectura). Fase 1 = `ContificoAdapter` para Barú, el piloto real. Fase 2 = `AlpwinAdapter` para Caramel Coffee. Fase 3 = un adaptador por cada local nuevo. Detalle: `Hallazgos-Ingenieria-API-Generica.md`, sección 4.3.
- **Un solo local por orden**: una compra nunca mezcla platos de distintos locales. Detalle: `uml/Documentacion-Diagrama-Clases.md`.
- **Control de concurrencia** (doble compra de última unidad, doble redención de código): resuelto con bloqueo optimista, y validado empíricamente en el demo. Detalle: `uml/Documentacion-Diagramas-Secuencia.md` y `demo-odoo/README.md` sección 7.
- **Registro de auditoría** para compras y entregas: modelado (`RegistroAuditoria`).
- **Modo offline del Operador**: fuera de alcance de v1 (riesgo R-12 aceptado formalmente).

---

## Próximo paso de Ingeniería

Con #1, #2 y #3 cerradas, **empieza el modelo de base de datos**. Lo único que puede volver a moverlo es la confirmación del punto fino de #4 (un solo saldo visible vs. otra cosa), y esa confirmación es una pregunta de sí o no.

En paralelo, la acción más urgente **no es técnica**: hay que pedirle a Barú que solicite las credenciales de API de Contífico. Es el único riesgo del proyecto con impacto catastrófico que Ingeniería no puede mitigar trabajando más (R-01).
