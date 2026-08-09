# Decisiones de Negocios — Aliflow

**Preparado por:** Grupo de Ingeniería
**Creado:** 27-jul-2026, para la reunión con el Grupo de Negocios
**Actualizado:** 8-ago-2026 — Negocios cerró la custodia de fondos (la recarga es **por establecimiento**), confirmó las cinco reglas de la cartilla de fidelidad y confirmó los **cuatro roles primarios**. Con eso el modelo de base de datos queda desbloqueado por completo.
**Objetivo:** llevar la cuenta de qué está decidido, qué sigue abierto, y qué cambió en el diseño como consecuencia.

Todo lo trabajado (arquitectura, casos de uso, diagramas de clases/objetos/componentes/despliegue/actividad/secuencia/estado, registro de riesgos, demo funcional) está en el repositorio: **https://github.com/Jesus-JB/aliflow**. Este documento no repite ese contenido — apunta a la sección exacta de cada documento donde está el detalle.

---

## Resumen del estado

| # | Decisión | Estado | Bloqueaba |
|---|---|---|---|
| 1 | Proveedor y sistema ERP reales | ✅ **Resuelta y corregida** | Modelo de datos |
| 2 | Alcance del rol Administrador | ✅ **Confirmada el 8-ago** — son **4 roles**: Estudiante, Operador, Proveedor y Super-Admin | Modelo de datos |
| 3 | Personal múltiple por proveedor | ✅ **Resuelta** | Modelo de datos |
| 4 | Mecanismo de recarga de saldo | 🔄 **Revertida el 8-ago** por la #13 — la recarga es por establecimiento, no hay saldo único | Lógica de wallet |
| 5 | Regla de expiración de orden no retirada | ✅ **Resuelta el 30-jul** — vence al terminar el día | Modelo de estados |
| 6 | Formato del código de retiro | ✅ **Resuelta** | Prototipo de mockups |
| 7 | Modelo de cobro de Aliflow al proveedor | ⬜ Abierta — **más restringida desde la #13** | Condiciona qué se le pide a la pasarela |
| 8 | Corrección del Acta (comprobante tributario) | ✅ **Resuelta el 30-jul** — el acta nueva confirma el modelo correcto | Documento de requerimientos |
| 9 | **Cartilla de fidelidad** | ✅ **Reglas confirmadas el 8-ago** — faltan solo dos valores de configuración | Nada |
| 10 | **Estrategia de inventario** *(nueva)* | ✅ **Resuelta el 30-jul** — inventario reservado para Aliflow | Modelo de datos y panel del proveedor |
| 11 | **Horario máximo de retiro** *(nueva)* | ✅ **Resuelta el 30-jul** — configurable por proveedor | Mockups |
| 12 | **Pasarela de pagos** *(nueva)* | ⬜ Abierta — investigación en curso | Flujo de recarga |
| 13 | **Custodia de fondos vs. saldo único** *(nueva)* | ✅ **Resuelta el 8-ago** — la recarga es **por establecimiento** | **Lógica de wallet** |

**Todas las decisiones que bloqueaban el modelo de base de datos están cerradas, incluida la billetera.** Con la respuesta a la #13, el esquema completo se puede escribir. Lo que queda abierto (#7, #12, reembolso de órdenes expiradas, saldo huérfano) no bloquea el modelo de datos.

---

## ✅ Decisiones resueltas el 30-jul-2026

### 10. Estrategia de inventario — inventario reservado para Aliflow *(nueva)*

**El problema que Negocios puso sobre la mesa:** si el local vende en caja, su ERP descuenta la unidad al instante, pero Aliflow puede tardar en enterarse. En esa ventana, un estudiante puede comprar un almuerzo que ya no existe.

Es exactamente el problema de **dos escritores sobre el mismo dato** que Ingeniería había señalado: no se arregla sincronizando más seguido, solo se achica la ventana.

**Lo que se decidió para v1:** el proveedor aparta una **cantidad fija de unidades exclusivas para Aliflow**. Si tiene 100 almuerzos, puede asignar 75 a caja y 25 a Aliflow. Ese cupo se administra de forma independiente y el proveedor lo aumenta o reduce **manualmente desde su panel**.

**Las tres alternativas que se evaluaron y por qué ganó esta:**

| Alternativa | Veredicto |
|---|---|
| **Webhooks desde el ERP** | La ideal, pero **ningún ERP del alcance los ofrece** — ni Contífico ni Alpwin. Descartada por imposibilidad técnica, no por costo. |
| **Polling cada minuto** | Sencilla de implementar, pero **no elimina el desfase**, solo lo acorta. Queda como red de seguridad, no como mecanismo primario. |
| **Inventario reservado** | ✅ **Elegida.** Elimina la sobreventa por diseño en vez de mitigarla, y **reduce la dependencia de la integración en tiempo real**. |

**Por qué esto es más importante de lo que parece:** cambia la respuesta a "¿es posible la bidireccionalidad?". En v1 Aliflow ya **no compite** con la caja por el mismo stock — es dueño de su propio cupo. El ERP deja de ser la fuente de verdad del inventario disponible en Aliflow y pasa a ser el sistema contable donde se registra la venta. Eso **desacopla el inventario del riesgo R-01**: aunque las credenciales de Contífico tarden, el módulo de compra puede funcionar.

**Impacto en el diseño:** clase `InventarioReservado` (cupo asignado, consumido y disponible) asociada a `Plato`; UC nuevo para que el Proveedor administre el cupo; el panel del proveedor muestra el cupo de Aliflow separado del stock total del ERP.

**Pendiente para la próxima reunión:** diseñar el proceso de asignación y cómo se visualiza el cupo en el panel.

---

### 11. Horario máximo de retiro — configurable por proveedor *(nueva)*

**Lo que decidió Negocios:** después de la compra se muestra una confirmación que le recuerda al estudiante **hasta qué hora puede retirar**. Ejemplo: *"¡Compra realizada con éxito! Recuerda que puedes retirar tu almuerzo hasta las 2:00 p. m."*

**El punto importante:** el horario **no puede estar fijo en el código**. Cada proveedor configura su hora máxima desde su panel, y el mensaje al estudiante se actualiza solo. Es la misma jugada que ya se hizo con `ProgramaFidelidad`: lo que el negocio no ha fijado se modela como configuración, no como constante.

**Impacto en el diseño:** atributo `horaMaximaRetiro` en `Proveedor`; pantalla nueva de confirmación post-compra; el panel del proveedor gana la configuración del horario.

---

### 5. Regla de expiración del código de retiro — **cerrada**

Estaba abierta desde el 27-jul. El acta del 30-jul la define sin ambigüedad:

- El código es **válido únicamente durante el día en que se hizo la compra**.
- Está asociado a **un pedido específico** y no sirve para retirar otro.
- Se **invalida automáticamente** cuando el Operador confirma la entrega.
- Si se presenta otro día, el sistema lo muestra como **vencido**.
- La vigencia termina, como máximo, **al terminar el mismo día de la compra**.

**Tres estados oficiales del código:** `VÁLIDO` (disponible para retirar), `UTILIZADO` (el Operador confirmó la entrega), `VENCIDO` (terminó el horario de retiro o terminó el día).

**Efecto secundario que conviene notar:** esto **refuerza la mitigación del riesgo R-15** (código corto adivinable). Una expiración de un día acota mucho la ventana de ataque y reduce el universo de códigos vigentes simultáneamente, que es justo lo que hace viable la unicidad con solo 6 dígitos.

**Lo que sigue sin definirse:** qué pasa con el **dinero** de una orden que venció sin retirarse. ¿Se reembolsa al saldo, se pierde, se le liquida igual al proveedor? El acta define la expiración del código, no la política de reembolso. Queda anotado abajo como punto abierto.

---

### 8. Comprobante tributario — **cerrada, y a favor del modelo que ya estaba construido**

El acta del 30-jul resuelve la contradicción que arrastrábamos desde el 25-jun:

- **La recarga genera solo un comprobante interno**, con fines de seguimiento, auditoría y conciliación, **sin validez tributaria**, porque recargar todavía no es comprar un alimento.
- **La factura tributaria se genera únicamente cuando el estudiante compra**, y **la emite el ERP del proveedor**, no Aliflow.
- Aliflow muestra una confirmación de compra exitosa pero **no sustituye el proceso tributario**.

Es exactamente el modelo que el diseño ya implementaba (`sinValidezTributaria = true`, UC11 para que el local re-emita). No hay nada que rehacer: se confirma lo construido y se cierra el punto.

**Campos mínimos que ahora exige el acta para cada recarga:** valor recargado, fecha y hora, número de operación, estado de la transacción, identificador de la pasarela, usuario que recargó, y registro histórico para auditoría.

**Impacto en el diseño:** la clase `Recarga` gana `numeroOperacion`, `estadoTransaccion` e `idPasarela`.

---

### 2 (revertida). Sí existe un Super-Admin de Aliflow

**Contexto:** el 28-jul Negocios dijo que solo había 3 roles y que no existía un super-admin de plataforma. Ingeniería eliminó el actor y los casos de uso asociados. **El 30-jul esa decisión se revirtió:** sí hace falta un cuarto rol.

**Qué es:** un administrador **del lado de Aliflow**, no del lado del local. Se encarga de:

- Dar **soporte** cuando algo falla en cualquier organización.
- **Dar de alta locales nuevos** y crear su vista de proveedor.
- Configurar lo necesario para que un proveedor nuevo entre a operar (incluida su integración con el ERP).
- Administrar la plataforma en general.

**Esto cierra de paso una consecuencia que llevaba abierta desde el 28-jul:** *"si ningún rol del sistema da de alta un local nuevo, ese paso es manual y fuera de alcance"*. Ya no es manual ni está fuera de alcance — **lo hace el Super-Admin**.

**Nota de honestidad sobre este vaivén:** este rol existió como propuesta de Ingeniería, se eliminó por indicación de Negocios el 28-jul, y volvió el 30-jul. Los casos de uso originales (alta de proveedores, métricas globales, gestión de usuarios) eran esencialmente correctos. Vale la pena registrarlo porque el mismo patrón —eliminar algo por una indicación y reponerlo dos días después— tiene un costo real de rehacer diagramas, y es la clase de cosa que el riesgo R-08 advierte.

**No está en el acta.** Se acordó verbalmente en la reunión del 30-jul y el acta no lo recoge. **Conviene que se agregue al acta** para que quede constancia, igual que se pidió con el comprobante tributario.

**Impacto en el diseño:** actor `Super-Admin` en casos de uso; clase `SuperAdmin` fuera de la jerarquía `UsuarioProveedor` (no pertenece a ningún local); UC nuevos de alta de organizaciones y soporte; módulo de administración de plataforma en el diagrama de componentes.

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

> **⚠️ Actualizado el 30-jul-2026 — esto ya no es el problema que era.** Negocios resolvió el desfase de inventario por diseño y no por sincronización: con el **inventario reservado** (decisión #10), Aliflow es dueño de su propio cupo y deja de competir con la caja por el mismo stock. El polling baja de "mecanismo con el que se sostiene la bidireccionalidad" a **red de seguridad de conciliación**. La bidireccionalidad sigue existiendo para *registrar la venta* en el ERP, que es lo que de verdad hace falta para la factura.

**Impacto en el diseño (ya aplicado):**
- `Hallazgos-Ingenieria-API-Generica.md` sección 4.3 — reescrita completa, con la ruta de implementación ajustada.
- `uml/diagrama-clases.puml` — `TipoERP` reordenado con `CONTIFICO` primero y valor `OTRO`; método `notifyPayment()` agregado a `IInventoryProvider`; `TipoEvento.NOTIFICAR_PAGO` agregado al outbox.
- `uml/objeto-integracion-erp.puml` — ahora muestra los dos locales reales a la vez: Barú/Contífico sincronizando bien, Caramel Coffee/Alpwin fallando tras 3 reintentos.
- `uml/diagrama-componentes.puml` y `uml/diagrama-despliegue.puml` — flechas bidireccionales y los dos ERP externos.
- `Gestion-de-Riesgos.md` — R-01 sube a impacto Catastrófico y vuelve a ser el riesgo dominante; R-11 baja a Moderado; se agrega R-16.

---

### 2. Alcance del rol Administrador — el rol no existe

> **🔄 REVERTIDA EL 30-JUL-2026.** Lo que sigue describe la decisión del 28-jul y el trabajo que se hizo por ella. **Sigue siendo válido para el rol "Administrador del local"** (que efectivamente no existe aparte del Proveedor), pero **ya no es válido para el super-admin de plataforma**, que sí va a existir. Ver el punto "2 (revertida)" en las decisiones del 30-jul.

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

### 13. Custodia de fondos vs. saldo único — ✅ **CERRADA el 8-ago-2026**

> **Respuesta de Negocios: la recarga se hará por establecimiento.** Referencia aportada por el cliente: el proceso de recarga de la aplicación **Parqueo Positivo** — el usuario debe seleccionar un servicio por defecto antes de operar, un indicador permanente le recuerda en cuál está, y el saldo mostrado pertenece a ese servicio.
>
> **Es la salida B** de las tres analizadas. Qué implica:
>
> - **Se revierte la decisión #4.** No hay saldo único. El estudiante tiene un saldo por establecimiento y solo puede gastarlo ahí.
> - **Se cumple el acta §3.9 sin contradicción:** el dinero de cada recarga va directo a la cuenta del proveedor destino, y Aliflow no custodia fondos en ningún punto.
> - **Se desbloquea el esquema completo de la base de datos** — la billetera era lo único que quedaba congelado.
> - **Se cierran los riesgos R-18 y R-19.** El *split payments* deja de ser necesario, así que la comparación de pasarelas (#12) ya no tiene criterio eliminatorio y el universo de candidatas se amplía.
>
> **Lo que cuesta, dicho sin adornos.** Ingeniería había recomendado la salida A; la B se había descartado el 28-jul justamente por esto. El costo es la **fragmentación del saldo**: un estudiante con $6 en Barú y $4 en Caramel Coffee no puede comprar un almuerzo de $7 en ninguno, teniendo $10. Es tolerable porque el estudiante *elige* dónde pone su dinero —no es un reparto automático como la lectura A que se descartó—, pero va a ocurrir, y quien lo paga es el estudiante. Registrado como **riesgo R-21**, con cuatro mitigaciones de interfaz. Si la métrica de compras perdidas por saldo insuficiente resulta alta, es evidencia concreta para volver a abrir la conversación.
>
> **Tres puntos nuevos que esta respuesta abre** (ninguno bloquea el esquema; ver abajo, en los puntos que siguen abiertos):
> 1. Cada local necesita su **propia cuenta de comercio** en la pasarela — es una condición de alta, no un detalle técnico (R-22).
> 2. Qué pasa con el **saldo huérfano** del estudiante que se gradúa o del local que sale de la plataforma. Aliflow no puede devolverlo porque nunca lo tuvo (R-23).
> 3. El **reembolso de órdenes expiradas** se vuelve más difícil por la misma razón: Aliflow no puede devolver dinero, a lo sumo reacreditar saldo en ese local, y eso es obligación del proveedor.
>
> Impacto ya aplicado en `Especificacion-de-Requerimientos.md` (RN-13, RN-14, RF-07, RF-08, RF-09, RF-12, RF-12b, RF-15, RF-19, RNF-E-04, RNF-E-05b, RNF-E-10, RNF-E-11b, RNF-P-19) y en `Gestion-de-Riesgos.md`. **Pendiente de aplicar:** diagrama de clases, mockups y prototipo web.

Se conserva abajo el análisis original que llevó a la decisión.

**Este era el punto más importante de esta lista, y no era un vacío: eran dos cosas ya decididas que no encajaban.**

- **Decisión #4 (28-jul):** el estudiante hace **una sola recarga** a un **saldo único** que puede gastar en cualquier local; Aliflow distribuye internamente.
- **Acta §3.9 (30-jul):** *"el dinero llegará directamente a la cuenta de cada proveedor. AliFlow no actuará como custodio de los fondos de los estudiantes ni recibirá directamente el dinero generado por las recargas."*

**Por qué no encajan.** Si el estudiante recarga $20 a un saldo único, **en el momento de la recarga todavía no se sabe en qué local va a comprar**. Entonces, ¿a la cuenta de qué proveedor entra ese dinero? Solo hay tres salidas y ninguna es gratis:

| Salida | Qué implica | Costo |
|---|---|---|
| **A — La pasarela retiene y liquida al comprar** | El dinero queda en la pasarela y se libera al proveedor recién cuando el estudiante compra | Exige una pasarela con capacidad de **marketplace / split payments**. Reduce mucho el universo de pasarelas candidatas y encarece la comisión |
| **B — El estudiante elige local al recargar** | El dinero entra directo a ese proveedor | **Rompe el saldo único** y devuelve el modelo al "saldo por proveedor" que se descartó el 28-jul |
| **C — Aliflow custodia los fondos** | Modelo clásico de billetera | **Contradice el acta del 30-jul**, y además implica responsabilidad regulatoria sobre dinero de terceros |

**Necesitamos que Negocios decida cuál de las tres.** Es la única decisión abierta que puede obligar a rehacer el modelo de wallet, y condiciona directamente la elección de pasarela (punto #12): si la respuesta es **A**, la capacidad de split deja de ser deseable y pasa a ser **requisito eliminatorio** en la comparación de pasarelas.

**Recomendación de Ingeniería:** la **A**, porque es la única que preserva la experiencia de saldo único sin poner a Aliflow a custodiar dinero. Pero hay que confirmar que exista una pasarela en Ecuador que lo soporte **antes** de comprometerse.

---

### 12. Pasarela de pagos — investigación abierta *(nueva)*

> **Actualizado el 8-ago-2026 tras cerrarse la #13.** La respuesta cambia esta investigación en dos sentidos, y para mejor:
>
> - **El *split payments* deja de ser criterio eliminatorio.** Al ser la recarga por establecimiento, cada pago tiene un único destinatario. Se cae el riesgo R-19 y el universo de pasarelas candidatas se amplía en lugar de reducirse.
> - **Aparece un criterio nuevo, y es duro:** la pasarela tiene que permitir que la aplicación opere con **una cuenta de comercio por establecimiento**, depositando cada recarga en la cuenta del local destino. El punto 5 de la lista de abajo pasa de "verificar si permiten" a **requisito**. Y antes de elegir hay que confirmar que los dos locales confirmados **pueden abrir cuenta ahí** (riesgo R-22) — si no coinciden en una misma pasarela, habría que soportar más de una.

El acta define **qué hay que averiguar**, no cuál se elige. Tareas acordadas:

1. **Comparar varias pasarelas disponibles en Ecuador** (costos, comisiones y tiempos de liquidación).
2. Confirmar si permiten **tokenizar y guardar métodos de pago** — Aliflow guardaría solo tipo de tarjeta, últimos cuatro dígitos y el token; **nunca el número completo ni el código de seguridad**.
3. Revisar cómo gestionan **reembolsos, pagos duplicados y transacciones pendientes**.
4. Confirmar que tengan **webhooks**, para acreditar el saldo solo tras una confirmación válida del pago (aprobada / rechazada / pendiente).
5. Verificar si permiten **depositar directamente en la cuenta de cada proveedor** — ligado a la decisión #13.
6. Definir la **experiencia de pago**: modal, ventana integrada, mininavegador o página externa. Si es externa, hay que definir cómo vuelve el estudiante a Aliflow y cómo se recupera el resultado.
7. Identificar **qué comprobante entrega la pasarela** por la recarga, dejando claro que **no reemplaza la factura tributaria** de la compra.
8. Confirmar los **métodos disponibles en Ecuador**: crédito, débito, transferencia y otros locales.

**Nota de Ingeniería:** el punto 4 es una buena noticia arquitectónica. La pasarela **sí** tiene webhooks, a diferencia de los ERP. O sea que el flujo de recarga puede ser reactivo de verdad, no por polling — es el único punto del sistema donde la integración externa nos avisa a nosotros.

---

### Reembolso de órdenes vencidas — *lo que la decisión #5 dejó abierto*

**Por qué importa:** el acta del 30-jul definió **cuándo vence un código** (al terminar el día), pero no **qué pasa con el dinero** de esa orden.
**Necesitamos que Negocios decida:** ¿el saldo se devuelve al estudiante, se pierde, o se le queda al proveedor porque el almuerzo se preparó?
**Nota:** si la respuesta implica devolución, hace falta el mecanismo de **movimientos compensatorios** (nunca borrar el movimiento original, generar uno inverso). Hoy el modelo no lo tiene.
**Actualizado el 8-ago:** la decisión #13 acota las salidas posibles. Como Aliflow **no custodia fondos**, no puede devolver dinero: a lo sumo puede **reacreditar saldo en ese mismo establecimiento**, y eso es una obligación del proveedor, no de Aliflow. La opción "se le devuelve al estudiante en efectivo" queda descartada por construcción. Conviene resolver esta pregunta junto con la del saldo huérfano, porque son la misma pregunta con dos disparadores distintos.

### 🆕 Saldo huérfano — *lo que la decisión #13 abrió* (8-ago-2026)

**Por qué importa:** un estudiante se gradúa, o un local sale de la plataforma, y queda saldo sin consumir. **Aliflow no puede devolverlo porque nunca tuvo el dinero** — es una obligación del establecimiento con el estudiante. Pero el reclamo va a llegar a Aliflow igual, porque es la cara visible.
**Necesitamos que Negocios decida:** ¿el saldo caduca tras un plazo? ¿El local lo devuelve? ¿Qué se le dice al estudiante cuando un local se desactiva?
**Nota de Ingeniería:** esto se resuelve principalmente **por contrato con cada local**, no por software. Lo que sí tiene que hacer el software es avisar al estudiante antes de que su saldo quede inaccesible. Riesgo **R-23**.

### 🆕 Cuenta de comercio por establecimiento — *lo que la decisión #13 abrió* (8-ago-2026)

**Por qué importa:** que el dinero vaya directo a la cuenta de cada proveedor significa que **cada local necesita su propia cuenta de comercio** en la pasarela. Un local que no pueda abrirla —requisitos bancarios, RUC, volumen mínimo— o que no quiera asumir su comisión **no puede vender por Aliflow**, aunque su ERP esté integrado y su menú publicado.
**Necesitamos confirmar con los dos locales:** que pueden abrir cuenta, y preferiblemente en la misma pasarela.
**Nota de Ingeniería:** es un requisito de admisión a la plataforma, no un detalle técnico. Debe entrar en la lista de verificación de alta de local. Riesgo **R-22**.

### 7. Modelo de cobro de Aliflow al proveedor

**Por qué importa:** si se decide una comisión o suscripción, hace falta una tabla de facturación de Aliflow hacia el local (distinta de la del local hacia el estudiante).
**Estado:** sin propuesta — es una decisión de modelo de negocio, no algo que Ingeniería deba proponer.
**Necesitamos que Negocios decida:** ¿comisión por transacción, suscripción fija, u otro esquema?
**Nota del 28-jul — ya no vale.** Decía que, con la decisión #4, Aliflow llevaba internamente cuánto le debía a cada local y que una comisión por transacción se descontaría exactamente en ese punto. **La decisión #13 eliminó ese punto:** el dinero va de la pasarela a la cuenta del proveedor sin pasar por Aliflow, así que **no hay ningún momento en el que Aliflow tenga el dinero para retener una comisión.**

**Nota nueva (8-ago) — esta decisión pasó de "no bloquea nada" a "quedó restringida".** Solo quedan tres formas de cobrarle al local, y ninguna es la obvia:

| Esquema | Cómo funcionaría | Costo |
|---|---|---|
| **Suscripción fija** | Aliflow le factura al local un monto periódico, al margen de las transacciones | La más simple con este modelo. No requiere tocar el flujo de dinero |
| **Comisión facturada a posteriori** | Aliflow calcula la comisión sobre las ventas del período y se la factura al local | Aliflow queda expuesto a que el local no pague. Cobranza, no retención |
| **Comisión retenida por la pasarela** | La pasarela separa la comisión de Aliflow antes de depositar al local | Vuelve a exigir capacidad de *split* — justo lo que la decisión #13 nos permitió dejar de exigir |

**Necesitamos que Negocios decida:** ¿comisión por transacción, suscripción fija, u otro esquema? Si la respuesta es comisión y se quiere retener automáticamente, hay que reabrir el requisito de *split* en la pasarela (RNF-E-10) **antes** de elegirla.

### 8. Corrección del Acta original (comprobante tributario) — ✅ **CERRADA el 30-jul-2026**

> **Resuelta.** El acta del 30-jul (§2.1 y §2.2) confirma el modelo que este análisis defendía: la recarga genera un comprobante interno **sin validez tributaria**, y la factura la emite **el ERP del proveedor** cuando el estudiante compra. Se deja la explicación completa abajo porque documenta *por qué* era importante y sirve de respaldo si el punto reaparece.

Negocios preguntó qué significa este punto. Explicación completa:

**El problema es que dos documentos del proyecto dicen cosas opuestas sobre lo mismo, y ambos son del 25-jun-2026:**

- **El Acta de reunión** (sección 4) dice que la compra del almuerzo genera un *"comprobante **válido tributariamente**"*.
- **El flujo funcional** (paso `prov-6`, "Re-emisión de comprobante tributario") dice lo contrario: que *"Aliflow emite un comprobante de compra **sin validez tributaria**"* y que **el proveedor re-emite la factura real en su propio sistema**.

**Por qué la diferencia importa y no es un tecnicismo.** Emitir un comprobante con validez tributaria en Ecuador significa emitir una factura electrónica autorizada por el SRI: requiere un certificado de firma digital, un RUC emisor, secuenciales autorizados y responsabilidad fiscal sobre lo emitido. Si el Acta se toma literalmente, **Aliflow sería el emisor fiscal de cada almuerzo**, lo que implicaría que Aliflow le está vendiendo el almuerzo al estudiante, no el local. Eso cambia el modelo de negocio entero, no solo el software.

**Cuál es el modelo correcto.** El del flujo, y ya está confirmado por el marco de negocio del 13-jul-2026: Aliflow emite un **comprobante interno** (una constancia de que el estudiante pagó y tiene derecho a retirar su almuerzo, sin valor fiscal), y **el local emite la factura real en su propio ERP** — que es justamente para lo que existe la integración. Todo el diseño está construido así: las clases `ComprobanteCompra` y `ComprobanteRecarga` tienen el campo `sinValidezTributaria = true`, y el caso de uso UC11 existe únicamente para darle al local los datos que necesita para re-emitir.

**Qué necesitamos de Negocios.** Nada complicado: solo **corregir la redacción de la sección 4 del Acta** para que diga "comprobante de compra sin validez tributaria; el proveedor re-emite la factura fiscal en su sistema". No cambia nada de lo ya decidido ni de lo ya construido — evita que quede una contradicción entre dos documentos oficiales del proyecto cuando se redacte la especificación de requerimientos final.

**Detalle:** `Hallazgos-Ingenieria-API-Generica.md`, sección 5.1.

### 9. Cartilla de fidelidad — ✅ **CERRADA el 8-ago-2026**

> **Negocios confirmó las cinco decisiones que Ingeniería había tomado**, y las cinco a favor de lo propuesto:
>
> 1. **"Cartilla" es tarjeta de sellos de fidelidad**, no paquete prepago de almuerzos. Cierra la ambigüedad más peligrosa que tenía el proyecto.
> 2. **Tope de 1 sello por día.** Era la lectura B de "10 veces diarias": vuelve 10 días, no compra 10 veces hoy.
> 3. **El sello se acredita al retirar**, no al comprar.
> 4. **La cartilla es por local**, no global.
> 5. **El premio se cobra como descuento del 100%** con una nota que identifica su origen ("Premio"), **no** como una venta de $0.
>
> **La quinta respuesta mejoró la propuesta de Ingeniería, y conviene decirlo.** Habíamos modelado el canje como orden de total $0. Negocios pidió descuento del 100% con motivo, que es mejor por dos razones que no habíamos visto: (a) conserva el precio original, así que el local puede ver **cuánto le costaron los premios** —una métrica que con $0 simplemente no existía—, y (b) le entrega al ERP un documento que entiende mucho mejor que una venta de importe cero. **De paso cierra el punto técnico que estaba abierto** sobre cómo representar el canje: ya no hay que elegir entre documento de cortesía y descuento, la respuesta es descuento. Solo queda verificar contra la documentación de cada ERP que admite descuento del 100% en línea de venta.
>
> **Lo único que sigue sin definirse son dos valores:** cuántos sellos requiere la cartilla y en qué consiste el premio. No bloquean nada — están modelados como configuración por local a propósito.

Se conserva abajo el análisis original.

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

### ¿Quién da de alta un local nuevo? — ✅ **CERRADA el 30-jul-2026**

> **Resuelta por el Super-Admin.** Este punto existía solo porque el 28-jul se había eliminado el rol de plataforma. Al reponerse el 30-jul, el alta de un local nuevo **entra al alcance de v1** y deja de ser un paso manual: la hace el Super-Admin de Aliflow, junto con la creación de la vista del proveedor y la configuración de su integración con el ERP (UC7).

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

*Actualizado el 8-ago-2026.*

**Hecho el 8-ago:** se escribió la **[especificación de requerimientos](Especificacion-de-Requerimientos.md)** (entregable 01) — 56 requerimientos funcionales con criterios de aceptación y 52 no funcionales clasificados según Sommerville, cada uno con su criterio de validación. Su sección 7 lista exactamente qué requerimientos quedan bloqueados por cada decisión abierta de este documento, y su sección 11 declara qué falta del entregable. **Dos huecos que aparecieron al escribirla:**

- **Sprint backlogs y cronograma con diagramas *activity-on-arrow*** — son parte del entregable 01.g junto con los riesgos. `Gestion-de-Riesgos.md` cubre los riesgos; los sprint backlogs y el cronograma **no están empezados**.
- **Acta de conformidad firmada por el representante del cliente** (entregable 01.e), que va como apéndice del documento. Es una dependencia externa: conviene pedirla ya, no al cierre.

**Hecho el 8-ago:** Negocios cerró la **decisión #13** — la recarga es por establecimiento. **Con eso el modelo de base de datos queda desbloqueado por completo, billetera incluida.** Aplicado ya en la especificación de requerimientos y en el registro de riesgos; **falta propagarlo** al diagrama de clases (y su SVG), a los mockups y al prototipo web, donde el saldo todavía se muestra como único.

**Sigue pendiente: el modelo de base de datos.** Las decisiones estructurales están cerradas, y el inventario reservado (#10) le agrega la única tabla estructural que faltaba. Lo único que puede volver a moverlo es la **decisión #13** (custodia de fondos vs. saldo único): según cuál de las tres salidas elija Negocios, la billetera cambia. Todo lo demás del esquema se puede escribir ya.

**En paralelo, cinco acciones que no son técnicas y que no dependen de Ingeniería:**

1. **Pedirle a Barú las credenciales de API de Contífico** (R-01). Sigue siendo el riesgo de mayor impacto, aunque el inventario reservado le quitó parte del poder de bloqueo: ahora afecta al registro contable de la venta, no a la capacidad de vender.
2. **Resolver la decisión #13**, porque condiciona qué pasarelas son siquiera candidatas.
3. **Agregar al acta el rol de Super-Admin**, que se acordó en la reunión del 30-jul pero no quedó escrito.
4. **Confirmar qué significa "cartilla".** En este proyecto se modeló como tarjeta de sellos de fidelidad. Otro equipo del curso la entendió como paquete prepago de almuerzos. Son productos distintos con el mismo nombre: si Negocios dijo la palabra y cada equipo entendió una cosa, uno de los dos modeló el requisito equivocado. Afecta a todo el módulo de fidelidad (RF-32 a RF-37).
5. **Pedir el acta de conformidad firmada** por el representante del cliente (entregable 01.e). Tiempo de respuesta de un tercero, igual que las credenciales — no conviene dejarlo para el cierre.

**Lo que Ingeniería sí puede hacer sin esperar a nadie:** construir el `ContificoAdapter` contra la documentación y probarlo con un **ERP simulado**, para que el día que lleguen las credenciales solo haya que enchufarlo.
