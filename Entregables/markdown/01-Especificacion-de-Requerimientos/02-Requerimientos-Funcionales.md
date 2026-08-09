### 5.2 Módulo B — Billetera y recarga de saldo

> El saldo pertenece al establecimiento: se recarga para un local concreto y solo puede gastarse ahí. El dinero de cada recarga se dirige a la cuenta de ese proveedor, sin que Aliflow lo reciba ni lo custodie en ningún momento.

#### RF-07 · Consultar el saldo por establecimiento
**Prioridad:** Debe · **Origen:** UC1b

El estudiante debe poder consultar su saldo **de cada establecimiento en el que haya recargado**. El saldo pertenece al establecimiento, no a la cuenta del estudiante.

**Criterios de aceptación**
1. El saldo de cada establecimiento coincide exactamente con sus recargas aprobadas menos sus compras confirmadas **en ese mismo establecimiento**.
2. La interfaz muestra siempre, de forma visible, **en qué establecimiento está** el estudiante y el saldo que le corresponde. No se presenta una cifra agregada que pueda leerse como gastable en cualquier local.
3. Si el estudiante tiene saldo en varios establecimientos, puede consultarlos todos, pero cada uno se presenta asociado a su local.

#### RF-08 · Recargar saldo en un establecimiento
**Prioridad:** Debe · **Origen:** UC2, `est-2`

El estudiante debe poder recargar saldo **para un establecimiento específico**, por un monto que elija o seleccione de valores predefinidos, a través de una pasarela de pagos. El dinero se dirige a la cuenta de ese proveedor; **Aliflow no lo recibe ni lo custodia en ningún momento**.

**Criterios de aceptación**
1. Toda recarga tiene un establecimiento destino obligatorio; no existe recarga sin local asociado.
2. El saldo se acredita **únicamente** tras una confirmación válida de la pasarela con estado aprobado, y **solo** al saldo de ese establecimiento.
3. Un pago rechazado o pendiente no acredita saldo y deja constancia de su estado.
4. La operación de acreditación es atómica: no existe estado intermedio en el que el pago esté aprobado y el saldo no reflejado.
5. Reprocesar la misma confirmación de pago **no** acredita el saldo dos veces (idempotencia por número de operación).
6. La interfaz advierte al estudiante, antes de confirmar, que el saldo recargado **solo puede usarse en ese establecimiento**.

#### RF-09 · Registrar cada recarga con sus datos mínimos
**Prioridad:** Debe

Cada recarga debe registrar como mínimo: valor, fecha y hora, número de operación, estado de la transacción, identificador de la pasarela, usuario que recargó y **establecimiento destino**, y quedar en histórico.

**Criterios de aceptación**
1. Ninguno de los siete campos puede quedar vacío en una recarga aprobada.
2. El histórico es consultable para auditoría y conciliación, y **no admite borrado** de registros.
3. El histórico permite conciliar, por establecimiento, lo recargado contra lo que su cuenta bancaria recibió.

#### RF-10 · Emitir comprobante interno de recarga
**Prioridad:** Debe · **Origen:** UC2a

Cada recarga aprobada debe generar un comprobante interno **marcado explícitamente como sin validez tributaria**.

**Criterios de aceptación**
1. El comprobante lleva de forma visible la leyenda de que no es un documento tributario.
2. No se invoca ningún servicio de facturación electrónica en el flujo de recarga.

#### RF-11 · Guardar métodos de pago tokenizados
**Prioridad:** Podría

El estudiante debería poder guardar un método de pago para recargas futuras, almacenando **solo** tipo de tarjeta, últimos cuatro dígitos y el token de la pasarela.

**Criterios de aceptación**
1. Una inspección de la base de datos no encuentra en ninguna tabla un número de tarjeta completo ni un código de seguridad.
2. Si la pasarela elegida no soporta tokenización, este requerimiento se retira del alcance (no se implementa una alternativa propia).

#### RF-12 · Impedir el gasto cruzado entre establecimientos
**Prioridad:** Debe

Una compra solo puede consumir el saldo del establecimiento donde se realiza. El sistema debe hacer imposible que el saldo de un local pague una compra en otro.

**Criterios de aceptación**
1. Con saldo suficiente en el local A e insuficiente en el local B, una compra en B falla por saldo insuficiente, **sin importar** el saldo total del estudiante.
2. La verificación ocurre en el backend dentro de la transacción de compra (RF-20), no solo en la interfaz.
3. El mensaje de saldo insuficiente nombra el establecimiento y ofrece recargar **en ese** establecimiento.
4. Por cada compra queda registrado de qué saldo de establecimiento se descontó (RN-10).

#### RF-12b · Transferir saldo entre establecimientos
**Prioridad:** No en v1

**No se implementa.** Mover saldo de un establecimiento a otro exigiría que un proveedor devuelva dinero y otro lo reciba, con Aliflow orquestando un movimiento de fondos entre terceros — algo que el sistema no hace en ningún flujo (RN-14). La exclusión es deliberada; ver la sección de alcance excluido.

---

### 5.3 Módulo C — Catálogo, menú e inventario reservado

#### RF-13 · Publicar y mantener el menú del local
**Prioridad:** Debe · **Origen:** UC8, `prov-3`

El Proveedor debe poder definir el menú de su local —plato, descripción, precio, disponibilidad— manualmente o sincronizándolo desde su ERP.

**Criterios de aceptación**
1. El sistema rechaza publicar un plato con precio menor o igual a cero, nombre vacío o cantidad negativa.
2. Un plato despublicado deja de aparecer en el menú del estudiante inmediatamente, sin afectar las órdenes ya creadas sobre él.

#### RF-14 · Consultar el menú del día
**Prioridad:** Debe · **Origen:** UC3, UC3a, `est-3`

El estudiante debe poder consultar el menú del día de cada local, con plato, precio y disponibilidad para Aliflow.

**Criterios de aceptación**
1. El menú muestra la disponibilidad derivada del **cupo reservado** (RN-02), no del stock del ERP.
2. La disponibilidad se presenta como **estado binario — "Disponible" o "Agotado" —, nunca como cantidad numérica.** El estudiante no ve cuántas unidades quedan (RN-15).
3. Un plato con cupo agotado se muestra explícitamente como agotado, no se oculta.
4. El menú se puede consultar aunque el ERP del local esté caído. *(Consecuencia directa del inventario reservado.)*

#### RF-15 · Elegir establecimiento y mantener el contexto visible
**Prioridad:** Debe · **Origen:** Pantalla Estudiante 02

El estudiante debe elegir un establecimiento **por defecto** antes de poder operar, y debe poder cambiarlo en cualquier momento. La aplicación debe indicar de forma permanente en qué establecimiento está, porque de eso dependen el menú, el saldo y la cartilla.

**Criterios de aceptación**
1. En el primer ingreso, el sistema exige elegir un establecimiento antes de mostrar menú o saldo.
2. La elección se recuerda entre sesiones y es modificable desde un control siempre visible en la parte superior.
3. Al cambiar de establecimiento cambian **a la vez** menú, saldo (RF-07) y cartilla (RF-34). No queda ningún dato del local anterior en pantalla.
4. Solo se listan locales activos; un local desactivado por el Super-Admin no aparece en el selector.

#### RF-16 · Administrar el cupo reservado para Aliflow
**Prioridad:** Debe · **Origen:** UC16

El Proveedor debe poder consultar, asignar, aumentar y reducir las unidades de cada plato destinadas exclusivamente a la venta por Aliflow.

**Criterios de aceptación**
1. El sistema rechaza un cupo negativo y rechaza reducir el cupo por debajo de las unidades ya vendidas.
2. Un aumento de cupo queda disponible para la compra de estudiantes sin necesidad de republicar el menú.
3. El panel muestra el cupo de Aliflow y el stock del ERP como **dos cifras distintas y rotuladas**, para que no se confundan.

#### RF-17 · Alertar sobre cupo bajo o agotado
**Prioridad:** Debería

El sistema debería alertar al Proveedor en su panel cuando el cupo de un plato baje de un umbral o se agote.

**Criterios de aceptación**
1. Con el cupo por debajo del umbral configurado, el panel muestra una alerta visible sin que el Proveedor tenga que entrar al detalle del plato.
2. La alerta es visible en el panel sin necesidad de entrar al detalle de cada plato.

#### RF-18 · Registrar las compras rechazadas por cupo agotado
**Prioridad:** Debería

El sistema debería registrar los intentos de compra rechazados por falta de cupo y exponerlos como métrica al Proveedor.

**Criterios de aceptación**
1. El panel de métricas muestra cuántas compras se perdieron por cupo agotado, por plato y por día.
2. La métrica distingue las compras rechazadas por falta de cupo de las rechazadas por saldo insuficiente.

---

### 5.4 Módulo D — Compra

#### RF-19 · Comprar un almuerzo
**Prioridad:** Debe · **Origen:** UC4, `est-4`

El estudiante debe poder comprar uno o más platos de un mismo local, descontando su saldo y el cupo reservado, y recibiendo un código de retiro.

**Criterios de aceptación**
1. La compra solo se confirma si **ambas** validaciones pasan: saldo suficiente **en ese establecimiento** (RN-13) y cupo disponible.
2. Si alguna falla, se informa el motivo concreto y **no se descuenta nada** — ni saldo ni cupo.
3. Al confirmarse: la orden queda en estado `COMPRADO`, el saldo de ese establecimiento baja exactamente por el total, el cupo baja exactamente por las unidades compradas, y se genera el código de retiro.
4. Los platos de una misma orden pertenecen al mismo local (RN-01); el sistema rechaza cualquier intento contrario.

#### RF-20 · Revalidar saldo y cupo inmediatamente antes de confirmar
**Prioridad:** Debe · **Origen:** UC4a

La validación de saldo y cupo debe repetirse dentro de la transacción de confirmación, no solo al mostrar la pantalla de compra.

**Criterios de aceptación**
1. Si el cupo se agota entre que el estudiante abre la pantalla y confirma, la compra falla con el mensaje correspondiente.
2. El tiempo transcurrido en la pantalla no afecta la corrección del resultado.

#### RF-21 · Impedir la sobreventa bajo concurrencia
**Prioridad:** Debe · **Origen:** UC4 (excepción crítica)

Dos o más compras simultáneas de la última unidad del cupo deben resultar en exactamente una compra confirmada.

**Criterios de aceptación**
1. Con cupo `N` y `M > N` compras concurrentes del mismo plato, se confirman exactamente `N` y fallan `M − N`, sin cupo negativo.
2. El mecanismo (bloqueo optimista con campo de versión) opera en la base de datos de Aliflow, **no** delegado al ERP. *(Delegar este control al ERP externo se verificó inviable: bajo concurrencia real permite sobreventa.)*
3. Existe una prueba automatizada de concurrencia que ejercita este escenario.

#### RF-22 · Emitir comprobante interno de compra
**Prioridad:** Debe · **Origen:** UC4b

Cada compra confirmada debe generar un comprobante interno marcado como sin validez tributaria.

**Criterios de aceptación**
1. El comprobante identifica local, platos, total, fecha y código de retiro.
2. Lleva visible la leyenda de que la factura fiscal la emite el local.

#### RF-23 · Mostrar la confirmación con el horario máximo de retiro
**Prioridad:** Debe · **Origen:** UC17

Al confirmarse la compra, el sistema debe mostrar el código de retiro y **hasta qué hora** puede retirarse, tomando el valor configurado por ese local.

**Criterios de aceptación**
1. La hora mostrada proviene de la configuración del local (RN-05); dos locales con horarios distintos muestran mensajes distintos.
2. No existe ninguna hora de retiro fija en el código de la aplicación.

#### RF-24 · Consultar el historial de órdenes
**Prioridad:** Debería · **Origen:** UC11, pantalla Estudiante 06

El estudiante debe poder consultar sus órdenes anteriores con su estado.

**Criterios de aceptación**
1. Se distinguen los estados `COMPRADO`, `ENTREGADO` y `EXPIRADO`.
2. Las órdenes de canje aparecen identificadas como premio, mostrando el precio original y el descuento del 100% (RN-12), no un total de $0.00 sin explicación.

---

### 5.5 Módulo E — Retiro y entrega

#### RF-25 · Validar el código de retiro
**Prioridad:** Debe · **Origen:** UC5, UC5a, `op-2`

El Operador debe poder **teclear** un código numérico de 6 dígitos para localizar la orden correspondiente en su local.

**Criterios de aceptación**
1. La interfaz de ingreso es un teclado numérico. **No existe lector de códigos de barras ni de QR en ningún punto del sistema.**
2. Solo se encuentran órdenes del local del Operador (RN-07).
3. Antes de confirmar, la pantalla muestra el nombre del estudiante y el detalle de la orden, de modo que el Operador pueda verificarlo visualmente.

#### RF-26 · Confirmar la entrega
**Prioridad:** Debe · **Origen:** UC5b, `op-3`

Al confirmar, el sistema debe cambiar la orden a `ENTREGADO`, invalidar el código y registrar marca de tiempo y Operador.

**Criterios de aceptación**
1. Tras confirmar, la orden está en `ENTREGADO` y el código en `UTILIZADO`.
2. Quedan registrados el Operador que confirmó y el instante exacto (RN-10).

#### RF-27 · Impedir la doble redención del código
**Prioridad:** Debe

Dos intentos de validar el mismo código —incluso desde puntos de entrega distintos y casi simultáneos— deben resultar en exactamente una entrega.

**Criterios de aceptación**
1. La invalidación es una actualización atómica y condicional; si afecta cero filas, se informa error y **no** se completa una segunda entrega.
2. Existe una prueba automatizada que ejercita dos redenciones concurrentes del mismo código.

#### RF-28 · Distinguir los tres casos de fallo de un código
**Prioridad:** Debe · **Origen:** UC5c, pantallas Operador 04 y 05

El sistema debe distinguir y comunicar de forma diferenciada: código **inexistente**, código **ya utilizado** y código **vencido**.

**Criterios de aceptación**
1. Los tres casos producen mensajes distintos; "ya utilizado" indica además la hora de la entrega previa.
2. Un código de una compra de un día anterior se reporta como **vencido**, no como inexistente.

#### RF-29 · Expirar automáticamente las órdenes no retiradas
**Prioridad:** Debe

Al terminar el día de la compra, toda orden en `COMPRADO` debe pasar a `EXPIRADO` y su código a `VENCIDO`.

**Criterios de aceptación**
1. Al día siguiente, ninguna orden del día anterior permanece en `COMPRADO`.
2. La transición queda registrada en auditoría.

#### RF-30 · Buscar una orden sin código
**Prioridad:** Debería · **Origen:** UC5a

El Operador debería poder localizar una orden por nombre o identificador institucional del estudiante cuando este no tenga su código.

**Criterios de aceptación**
1. La búsqueda se limita a órdenes vigentes del local del Operador.
2. La entrega por esta vía queda marcada en auditoría como búsqueda manual, distinguible de la validación por código.

#### RF-31 · Limitar los intentos fallidos de validación
**Prioridad:** Debería

El sistema debería limitar los intentos fallidos de validación por sesión de Operador y por ventana de tiempo, y registrar cada fallo.

**Criterios de aceptación**
1. Superado el umbral, la validación se bloquea temporalmente y el hecho queda en auditoría.
2. *(Justificación: con 6 dígitos el espacio de búsqueda es 10⁶ y en la práctica mucho menor, porque solo son válidos los pocos códigos vigentes de ese local en ese momento.)*

---

### 5.6 Módulo F — Cartilla de fidelidad

> La cartilla de fidelidad es una **tarjeta de sellos**: el estudiante acumula un sello por entrega y al completarla obtiene un premio. Es por local, con un tope de un sello por día, y el premio se cobra como descuento del 100% identificado como tal.
>
> Cuántos sellos requiere la cartilla y en qué consiste el premio son **configuración de cada local** (RF-32), no constantes del sistema.

#### RF-32 · Configurar el programa de fidelidad del local
**Prioridad:** Debería · **Origen:** UC14

El Proveedor debe poder activar o desactivar el programa de fidelidad de su local y definir sellos requeridos, premio, tope de sellos por día y caducidad de la cartilla.

**Criterios de aceptación**
1. El sistema rechaza un número de sellos requeridos menor o igual a cero.
2. Un local sin programa activo no acredita sellos y no muestra cartilla a sus compradores.
3. Ninguno de estos valores existe como constante en el código (RN-05).
4. El tope de sellos por día viene con valor **1** por defecto (RN-08).

#### RF-33 · Acreditar el sello al confirmar la entrega
**Prioridad:** Debería · **Origen:** UC5d

Al confirmarse una entrega en un local con programa activo, el sistema debe acreditar un sello a la cartilla vigente del estudiante en ese local.

**Criterios de aceptación**
1. El sello se acredita en la confirmación de entrega, **nunca** en la confirmación de compra. *(Si se acreditara al comprar, el estudiante podría llenar la cartilla sin retirar nunca el almuerzo y el local pagaría un premio por ventas que no ocurrieron físicamente.)*
2. Un reintento de la confirmación de entrega —fallo de red, doble clic— **no** acredita dos sellos. La relación sello–orden es uno a uno con restricción de unicidad.
3. Con el tope diario alcanzado, una segunda entrega del mismo día no acredita sello adicional.
4. Una orden de canje (RN-12) no acredita sello.

#### RF-34 · Consultar la cartilla
**Prioridad:** Debería · **Origen:** UC13

El estudiante debe poder ver **una cartilla por local** en el que haya comprado, con sellos acumulados sobre requeridos, premio y caducidad si aplica.

**Criterios de aceptación**
1. Las cartillas de distintos locales son independientes: un sello en Barú no avanza la cartilla de Caramel Coffee.
2. Una cartilla completa se destaca como premio disponible.
3. La cartilla mostrada corresponde al establecimiento activo (RF-15 criterio 3).

#### RF-35 · Canjear el premio como descuento del 100%
**Prioridad:** Podría · **Origen:** UC15

Con una cartilla completa, el estudiante debe poder canjear el premio. El canje genera una **orden real con el precio normal del plato y un descuento del 100% identificado como "Premio"**, de modo que el total a pagar sea $0 sin perder el rastro de cuánto costó.

**Criterios de aceptación**
1. La orden conserva el **precio original** del plato; el descuento se registra como línea o campo propio, con su motivo ("Premio de fidelidad") visible.
2. El canje descuenta cupo y genera código de retiro como cualquier compra, pero **no** descuenta saldo del estudiante.
3. La cartilla pasa a canjeada mediante una actualización atómica y condicional; un doble canje concurrente falla en el segundo intento **sin crear la orden**.
4. La orden de canje se distingue visualmente en el historial del estudiante y en el panel del Operador.

#### RF-36 · Expirar cartillas vencidas
**Prioridad:** Podría · **Origen:** `../../uml/estado-cartilla.puml`

Si el local configuró caducidad, las cartillas incompletas deben expirar al cumplirse el plazo.

**Criterios de aceptación**
1. Si el local no configuró caducidad, ninguna cartilla expira.
2. Una cartilla ya completa no expira antes de poder canjearse.

#### RF-37 · Representar el canje en el ERP del local
**Prioridad:** Podría

El sistema debe notificar el canje al ERP del local como una venta con **descuento del 100%** y su motivo, no como una venta de importe cero.

**Criterios de aceptación**
1. El documento enviado al ERP lleva el importe original del plato y un descuento del 100% con concepto identificable.
2. La contabilidad del local puede distinguir un premio de fidelidad de una venta normal y de una anulación.
3. El documento se adapta a lo que admita cada ERP en su línea de venta.

---

### 5.7 Módulo G — Panel del Proveedor

#### RF-38 · Consultar métricas del local
**Prioridad:** Debería · **Origen:** UC9, `prov-5`

El Proveedor debe poder ver almuerzos vendidos por día y semana, ingresos, platos más vendidos y órdenes pendientes de entrega.

**Criterios de aceptación**
1. Las métricas se calculan sobre el histórico de órdenes de Aliflow y solo incluyen el local del Proveedor (RN-07).
2. Las órdenes de canje se cuentan en unidades entregadas pero no suman ingresos.
3. El panel muestra **cuánto costaron los premios de fidelidad** en el período, sumando los descuentos del 100% aplicados (RN-12). *(Es el dato que permite al local saber si su programa de fidelidad le conviene; con el canje modelado como venta de $0 este número no existía.)*

#### RF-39 · Configurar el horario máximo de retiro
**Prioridad:** Debe · **Origen:** UC17

El Proveedor debe poder definir la hora máxima de retiro de su local.

**Criterios de aceptación**
1. El valor guardado se refleja de inmediato en el mensaje de confirmación de compra del estudiante (RF-23) y en el cálculo de expiración del código.
2. El horario aplica solo a ese local.

#### RF-40 · Consultar el estado de sincronización con el ERP
**Prioridad:** Debería · **Origen:** UC10, `prov-4`

El Proveedor debe poder ver la última comunicación exitosa con su ERP y los eventos pendientes o fallidos.

**Criterios de aceptación**
1. Se muestran los eventos en cola con su estado y el número de reintentos.
2. Un evento fallido es identificable junto con la orden a la que corresponde, para permitir conciliación manual.

#### RF-41 · Consultar el detalle de una venta para re-emitir la factura
**Prioridad:** Debe · **Origen:** UC11, `prov-6`

El Proveedor debe poder consultar y descargar el detalle de una venta (monto, platos, estudiante, fecha y hora) para emitir su factura fiscal en su propio ERP.

**Criterios de aceptación**
1. El detalle contiene todos los datos necesarios para emitir la factura sin volver a preguntar nada.
2. Aliflow **no** emite ni intenta emitir ningún documento fiscal en este flujo.

#### RF-42 · Configurar la integración con el ERP del local
**Prioridad:** Debe · **Origen:** UC7, `prov-2`

Debe existir una forma de registrar, por local, el tipo de ERP, sus credenciales y el mapeo de sus productos al modelo canónico de Aliflow.

**Criterios de aceptación**
1. Cambiar de ERP en un local no requiere modificar el núcleo de la aplicación, solo su configuración y el adaptador correspondiente.
2. Las credenciales del ERP se almacenan cifradas y no son legibles desde ninguna interfaz.
3. Existe una prueba de humo bidireccional que confirma que Aliflow puede leer del ERP y escribirle.

---

### 5.8 Módulo H — Super-Admin de Aliflow

> El Super-Admin es un administrador **del lado de Aliflow**, no de ningún local. Es el único rol con visibilidad sobre todos los establecimientos.

#### RF-43 · Dar de alta un local
**Prioridad:** Debe · **Origen:** UC18

El Super-Admin debe poder registrar un local nuevo con sus datos, crear su vista de proveedor y su primera cuenta de Proveedor, y configurar su integración con el ERP.

**Criterios de aceptación**
1. Al terminar el alta, el local puede publicar menú y vender sin ninguna intervención manual sobre la base de datos.
2. La primera cuenta de Proveedor creada puede a su vez crear el resto del personal del local (RF-04).

#### RF-44 · Activar y desactivar locales
**Prioridad:** Debería · **Origen:** UC20

El Super-Admin debe poder activar o desactivar un local.

**Criterios de aceptación**
1. Un local desactivado deja de aparecer en el selector del estudiante (RF-15).
2. Desactivar un local **no** elimina sus órdenes históricas ni impide entregar las órdenes ya compradas.

#### RF-45 · Brindar soporte con visibilidad transversal
**Prioridad:** Debería · **Origen:** UC19

El Super-Admin debe poder consultar el estado de cualquier local: órdenes, sincronización con su ERP, cupo reservado e incidencias.

**Criterios de aceptación**
1. Es el único rol que puede ver información de más de un local.
2. Cada acceso a datos de un local queda registrado en auditoría con el identificador del Super-Admin (RN-10).

#### RF-46 · Monitorear el estado de todas las integraciones
**Prioridad:** Debería · **Origen:** UC20

El Super-Admin debería contar con una vista consolidada del estado de sincronización de **todos** los locales.

**Criterios de aceptación**
1. La vista permite identificar en una pantalla qué locales tienen eventos fallidos acumulándose.
2. La vista es transversal a todos los establecimientos, a diferencia del panel por local del Proveedor (RF-40).

---

### 5.9 Módulo I — Integración con ERP externos

#### RF-47 · Exponer una interfaz única de integración
**Prioridad:** Debe · **Origen:** UC7, `../../Hallazgos-Ingenieria-API-Generica.md` §3

El núcleo del sistema debe comunicarse con cualquier ERP a través de una única interfaz abstracta, sin conocer nunca la implementación concreta.

**Criterios de aceptación**
1. Ninguna clase de dominio importa un SDK ni un cliente HTTP específico de un ERP.
2. La interfaz es bidireccional: lectura de menú y stock; escritura de ventas y pagos.
3. No existe ningún condicional sobre el tipo de ERP fuera de la fábrica de adaptadores.

#### RF-48 · Seleccionar el adaptador según el local
**Prioridad:** Debe · **Origen:** `ProviderAdapterFactory`

El sistema debe resolver automáticamente qué adaptador usar a partir del tipo de ERP configurado en el local.

**Criterios de aceptación**
1. Agregar un ERP nuevo requiere una clase adaptadora nueva y un valor de configuración, **cero cambios** en el núcleo.
2. Varios adaptadores distintos operan simultáneamente en producción sin interferir entre sí.

#### RF-49 · Notificar cada venta al ERP del local mediante cola de eventos
**Prioridad:** Debe · **Origen:** UC4c, patrón Outbox

Cada compra confirmada debe encolar un evento de notificación al ERP; el envío nunca debe ser síncrono dentro de la transacción de compra.

**Criterios de aceptación**
1. Si el ERP está caído, la compra se confirma igual y el evento queda pendiente con reintentos. **No existe la venta huérfana** (cobrada al estudiante y desconocida por el local).
2. Reprocesar un evento ya procesado no duplica la venta en el ERP (idempotencia por identificador de evento).
3. Un evento que agota sus reintentos queda en estado fallido, visible en RF-40, nunca descartado en silencio.

#### RF-50 · Notificar los pagos al ERP
**Prioridad:** Debería · **Origen:** `TipoEvento.NOTIFICAR_PAGO`

El sistema debe poder devolver al ERP del local la información de pago asociada a la venta, para que su contabilidad quede cuadrada.

**Criterios de aceptación**
1. El evento de pago sigue el mismo mecanismo de cola y reintentos que el de venta.

#### RF-51 · Sincronizar el catálogo desde el ERP por consulta periódica
**Prioridad:** Debería · **Origen:** UC3a, `../../Hallazgos-Ingenieria-API-Generica.md` §3

El sistema debe poder obtener menú y stock del ERP de cada local mediante consulta periódica.

**Criterios de aceptación**
1. La sincronización usa **consulta periódica (polling)**, porque **ningún ERP del alcance ofrece webhooks**.
2. El stock traído del ERP se guarda como dato **informativo** y **no** condiciona la venta (RN-02).
3. Un fallo de sincronización no interrumpe la operación de venta de Aliflow.

#### RF-52 · Operar contra un ERP simulado
**Prioridad:** Debe

El sistema debe poder operar completamente contra un **ERP simulado**, sin credenciales de ningún ERP real.

**Criterios de aceptación**
1. Todo el flujo —menú, compra, notificación de venta, reintentos— se ejecuta de extremo a extremo contra el simulador.
2. Cambiar del simulador a un ERP real es cambio de configuración, no de código del núcleo.
3. El simulador permite construir y demostrar cualquier adaptador sin depender de credenciales de un ERP real.

#### RF-53 · Integrar un ERP sin API mediante vía alternativa
**Prioridad:** Podría

Para un local cuyo ERP no expone API —el caso de Alpwin—, el sistema debería integrarse por archivos o base de datos puente, aceptando sincronización por lotes.

**Criterios de aceptación**
1. La ausencia de API en un local **no** degrada la operación de los demás locales.
2. *(Nota: esta vía no está confirmada; depende de la respuesta del proveedor de ese ERP. Ya no bloquea el piloto, porque el local piloto usa un ERP con API REST documentada.)*

---

### 5.10 Módulo J — Auditoría

#### RF-54 · Registrar en auditoría las operaciones sensibles
**Prioridad:** Debe

El sistema debe registrar quién ejecutó cada operación que mueve dinero o cambia el estado de una orden: confirmación de compra, confirmación de entrega, invalidación de código, acreditación al local, y accesos transversales del Super-Admin.

**Criterios de aceptación**
1. Cada registro contiene actor, rol, acción, entidad afectada y marca de tiempo.
2. Los registros de auditoría **no** son editables ni eliminables desde ninguna interfaz del sistema.

#### RF-55 · Registrar los intentos de validación fallidos
**Prioridad:** Debería

Cada intento fallido de validar un código de retiro debe quedar registrado con el Operador y el instante.

**Criterios de aceptación**
1. Es posible detectar en el registro una secuencia de fallos que sugiera un intento de adivinación por fuerza bruta.

#### RF-56 · Conservar el histórico sin borrado
**Prioridad:** Debe

Recargas, órdenes y movimientos de saldo deben conservarse en histórico para auditoría y conciliación.

**Criterios de aceptación**
1. No existe ninguna operación del sistema que elimine físicamente un movimiento de dinero.
2. Una corrección se representa como **movimiento compensatorio**, nunca modificando o borrando el original.

---
