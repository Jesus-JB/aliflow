# Gestión de Riesgos — Aliflow

**Proyecto:** Aliflow — Sistema web para venta online de almuerzos en la UEES
*(el nombre original del proyecto decía "en Barú UEES"; Negocios aclaró el 28-jul-2026 que Aliflow sirve a cualquier local de comida de la universidad — Barú, Caramel Coffee, etc. — no solo a Barú)*
**Entregable de referencia:** 01.g de la especificación de proyecto final ("Se debe documentar la gestión de riesgos, sprint backlogs y el cronograma para el proyecto.")
**Fecha:** 26-jul-2026 · **Última revisión:** 8-ago-2026 (cierre de la decisión de custodia de fondos y confirmación de las reglas de fidelidad)
**Origen:** matriz elaborada previamente por el equipo, recuperada y formalizada aquí junto con la investigación de arquitectura de integración (`Hallazgos-Ingenieria-API-Generica.md`).

Clasificación de tipos de riesgo: Tecnológico, Humano, Organizacional, Herramientas, Requerimientos, Estimación.

Escalas usadas: **Probabilidad** (Muy Baja / Baja / Media / Alta / Muy Alta), **Impacto** (Mínimo / Leve / Moderado / Grave / Catastrófico), **Estrategia** (Evitar / Transferir / Mitigar / Aceptar).

## Matriz de riesgos

| ID | Nombre | Tipo | Probabilidad | Impacto | Estrategia |
|---|---|---|---|---|---|
| R-01 | No contar con acceso real a la API de Contífico — **el ERP del local piloto** *(riesgo dominante desde el 28-jul-2026)* | Tecnológico | Media | **Catastrófico** | Evitar |
| R-02 | Inconsistencia entre saldo, facturación e inventario | Tecnológico | Media | Grave | Transferir |
| R-03 | Baja experiencia del equipo creando APIs seguras | Humano | Media | Moderado | Mitigar |
| R-04 | Disponibilidad limitada de los integrantes | Humano | Media | Leve | Mitigar |
| R-05 | Falta de validación operativa con Barú | Organizacional | Media | Grave | Transferir |
| R-06 | Limitaciones del ambiente de pruebas de pagos | Herramientas | Media | Moderado | Mitigar |
| R-07 | Fallas o incompatibilidades en herramientas de desarrollo | Herramientas | Baja | Leve | Aceptar |
| R-08 | Cambios en el flujo de saldo y comprobantes | Requerimientos | Alta | Grave | Evitar |
| R-09 | Requisitos de seguridad incompletos | Requerimientos | Media | Moderado | Mitigar |
| R-10 | Subestimación del esfuerzo de integración y pruebas | Estimación | Media | Moderado | Mitigar |
| R-11 | Alpwin (sistema de **Caramel Coffee**, no de Barú) no tiene API pública documentada | Tecnológico | Alta | **Moderado** | Mitigar |
| R-15 | *(nuevo, 28-jul-2026)* Código de retiro numérico de 6 dígitos: adivinable por fuerza bruta | Tecnológico | Baja | Moderado | Mitigar |
| R-16 | *(nuevo, 28-jul-2026)* Costo operativo de sostener N ERP heterogéneos a la vez (credenciales, formatos de error, soporte, pruebas) | Estimación | Alta | Grave | Mitigar |
| R-17 | *(28-jul-2026)* Cartilla de fidelidad con reglas sin definir | Requerimientos | ~~Alta~~ **Baja** | Moderado | Mitigar — *reglas confirmadas el 8-ago-2026* |
| R-18 | *(30-jul-2026)* Contradicción entre custodia de fondos y saldo único | Requerimientos | — | — | ✅ **CERRADO el 8-ago-2026** |
| R-19 | *(30-jul-2026)* Ninguna pasarela ecuatoriana soporta *split payments* | Tecnológico | — | — | ✅ **CERRADO el 8-ago-2026** — el *split* dejó de ser necesario |
| R-20 | *(nuevo, 30-jul-2026)* El inventario reservado depende de que el proveedor lo mantenga al día manualmente: si no repone el cupo, Aliflow aparece agotado aunque el local tenga comida | Organizacional | **Alta** | Moderado | Mitigar |
| R-21 | *(nuevo, 8-ago-2026)* **Saldo fragmentado entre establecimientos** — el estudiante puede tener dinero repartido en varios locales y no poder comprar en ninguno | Requerimientos | **Alta** | Moderado | Mitigar |
| R-22 | *(nuevo, 8-ago-2026)* **Un local no puede o no quiere abrir cuenta de comercio** en la pasarela elegida — sin ella no puede recibir recargas ni vender por Aliflow | Organizacional | Media | **Grave** | Mitigar |
| R-23 | *(nuevo, 8-ago-2026)* **Saldo huérfano** — el estudiante se gradúa o el local sale de la plataforma y queda saldo sin usar que Aliflow no puede devolver porque nunca tuvo el dinero | Organizacional | Media | Moderado | Transferir |

> **Actualizado 30-jul-2026 — el inventario reservado desactivó parte de R-01.** La reunión resolvió el desfase de inventario apartando un cupo exclusivo para Aliflow, en vez de perseguir la sincronización en tiempo real. Consecuencias:
>
> - **R-01 sigue siendo el de mayor impacto, pero ya no bloquea la venta.** Sin credenciales de Contífico, Aliflow igual puede vender contra su cupo reservado; lo que se pierde es el **registro contable de la venta y la factura**. Grave, pero ya no es "el piloto no arranca".
> - **R-02 (inconsistencia entre saldo, facturación e inventario) baja de facto**, porque el inventario deja de ser un dato compartido entre dos sistemas que escriben a la vez.
> - **R-13 queda cerrado:** el acta define la regla de expiración que faltaba (el código vale solo el día de la compra).
> - **Se agregan tres riesgos:** R-18, R-19 y R-20, todos derivados de las decisiones del 30-jul.
>
> **R-18 merece atención especial** porque no es un vacío sino una contradicción entre dos decisiones ya tomadas, y es el único riesgo abierto capaz de obligar a rehacer el modelo de billetera.

> **Actualizado 28-jul-2026 — el ranking de riesgos se dio vuelta.** El 27-jul se había degradado R-01 y promovido R-11, sobre la base de que Barú usaba Alpwin. Negocios corrigió ese dato (`Hallazgos-Ingenieria-API-Generica.md` sección 4.3): **Barú usa Contífico; Alpwin lo usa Caramel Coffee**. Consecuencias sobre la matriz:
>
> - **R-01 vuelve a ser el riesgo dominante** y su impacto sube de Grave a **Catastrófico**: si Barú no consigue credenciales de API de Contífico, el piloto no arranca. Ya no es "un riesgo de fase futura".
> - **R-11 baja de Grave a Moderado.** Alpwin sigue sin API, pero afecta al segundo local, no al primero — degrada el alcance del piloto, no lo bloquea.
> - **Se agregan dos riesgos** que las decisiones del 28-jul introdujeron: R-15 (el código de retiro corto es adivinable) y R-16 (el costo real de sostener varios ERP a la vez).
>
> Vale la pena decirlo explícitamente: **el proyecto está mejor que ayer**, porque el riesgo que podía hacerlo inviable (integrar con un ERP sin API en el piloto) desapareció. Lo que queda es un riesgo de gestión, no de ingeniería.

## Descripción y plan de acción por riesgo

### R-01 — No contar con acceso real a la API de Contífico (riesgo dominante)
**Descripción:** Barú, el local piloto, usa Contífico. Su API REST existe y está documentada, pero la API Key la entrega el soporte de Contífico únicamente al titular de la cuenta — es decir, **depende de que Barú la solicite y nos la comparta**. Si eso no ocurre, no hay adaptador de producción posible y el piloto se queda en el demo con Odoo. Es el único riesgo del proyecto cuyo impacto es catastrófico y que **no se puede mitigar con trabajo de Ingeniería**.
**Acción:** (1) Pedir formalmente las credenciales por escrito ya, no cuando el adaptador esté listo — el tiempo de respuesta de un tercero es la variable que no controlamos. (2) Escribir el `ContificoAdapter` contra la documentación y probarlo con un mock local mientras tanto, para que el día que lleguen las credenciales solo haya que conectarlo. (3) No comprometer fecha de piloto con el cliente hasta tenerlas.

### R-02 — Inconsistencia entre saldo, facturación e inventario
**Descripción:** Una compra podría descontar saldo en Aliflow, pero fallar al registrar la factura o el descuento de inventario en el sistema externo.
**Acción:** Delegar la emisión contable final al ERP/proveedor autorizado y registrar en Aliflow estados de sincronización. Implementar bitácora, reintentos, estados PENDIENTE/FACTURADO/ERROR y procedimiento de conciliación con el responsable de Barú. (Ver patrón outbox en `Hallazgos-Ingenieria-API-Generica.md` sección 3.4 — ya validado técnicamente en el demo con Odoo.)

### R-03 — Baja experiencia del equipo creando APIs seguras
**Descripción:** El equipo ha consumido APIs, pero tiene poca experiencia construyendo endpoints propios con autenticación, roles, validaciones y manejo seguro de datos.
**Acción:** Dividir responsabilidades, revisar buenas prácticas OWASP, usar un framework documentado, hacer revisiones de código entre integrantes y priorizar endpoints críticos: autenticación, wallet, órdenes y validación de códigos.

### R-04 — Disponibilidad limitada de los integrantes
**Descripción:** Las cargas académicas y horarios del grupo pueden retrasar el desarrollo de módulos clave como pagos, wallet, panel de Operador e integración externa.
**Acción:** Planificar sprints cortos, asignar responsables por módulo, usar tablero Kanban, definir fechas de entrega internas y mantener reuniones breves de seguimiento dos veces por semana.

### R-05 — Falta de validación operativa con Barú
**Descripción:** El flujo real de preparación, retiro, comprobantes y control de almuerzos podría diferir de lo asumido por el equipo durante el diseño.
**Acción:** Solicitar validación del flujo a un representante de Barú/UEES y dejar documentadas las reglas del proceso. Las decisiones operativas finales deben ser aprobadas por el dueño del proceso antes de cerrar el alcance.

### R-06 — Limitaciones del ambiente de pruebas de pagos
**Descripción:** La pasarela de pagos seleccionada puede no disponer de sandbox completo, webhooks o documentación suficiente para simular recargas de saldo.
**Acción:** Usar un modo de pago simulado para el prototipo, registrar pagos con estados APROBADO/PENDIENTE/RECHAZADO y diseñar la capa de pagos para reemplazar el simulador por una pasarela real cuando exista acceso.

### R-07 — Fallas o incompatibilidades en herramientas de desarrollo
**Descripción:** Problemas con hosting, base de datos, librerías, repositorio o entorno local pueden afectar la integración y las pruebas del proyecto.
**Acción:** Aceptar el riesgo por su impacto bajo, manteniendo respaldos del repositorio, archivo README de instalación, variables de entorno documentadas y una alternativa local con base de datos de desarrollo.

### R-08 — Cambios en el flujo de saldo y comprobantes
**Descripción:** Podrían cambiar las reglas sobre la recarga de saldo, comprobante no contable y emisión de comprobante válido únicamente al consumir el almuerzo.
**Acción:** Congelar el alcance funcional aprobado para el taller: recarga con comprobante interno y compra con comprobante válido en el ERP. Cualquier cambio debe pasar por control de cambios y reestimación. **Nota 28-jul-2026:** este riesgo se materializó parcialmente — Negocios cambió el modelo de saldo (de independiente por proveedor a recarga única distribuida). El cambio se absorbió sin rehacer el diseño gracias al patrón Strategy ya previsto, lo que valida la mitigación; la probabilidad Alta con la que estaba calificado resultó acertada.

### R-09 — Requisitos de seguridad incompletos
**Descripción:** No definir correctamente roles, permisos, protección de tokens, validación de códigos de retiro y auditoría puede abrir fallas de seguridad.
**Acción:** Definir los **4 roles confirmados por Negocios** (Estudiante, Operador, Proveedor y Super-Admin de Aliflow — confirmados el 8-ago-2026; el 28-jul se había indicado que el Super-Admin no existía y la decisión se revirtió); usar autenticación con tokens, contraseñas cifradas, validaciones en backend, expiración de códigos de retiro y registro de auditoría para compras y redenciones. **Ya modelado (27-jul-2026):** clase `RegistroAuditoria` agregada al diagrama de clases (`uml/diagrama-clases.puml`, paquete "Órdenes"), registrando quién ejecuta las operaciones que cambian dinero o estado de una orden.

### R-10 — Subestimación del esfuerzo de integración y pruebas
**Descripción:** El equipo puede subestimar el trabajo necesario para probar wallet, órdenes, inventario simulado, facturación, errores y seguridad.
**Acción:** Construir primero un MVP con registro, saldo, compra y código de retiro; luego agregar Mock ERP/adaptador real, reportes y validaciones. Reservar tiempo específico para pruebas de integración y corrección de errores.

### R-11 — Alpwin (sistema de Caramel Coffee) no tiene API pública documentada
**Descripción:** Alpwin no tiene documentación pública de API (`Hallazgos-Ingenieria-API-Generica.md` secciones 2.5 y 4.3). **Corregido el 28-jul-2026:** el local que lo usa es Caramel Coffee, no Barú. El riesgo sigue siendo real pero cambió de severidad — degrada el alcance de la plataforma (un local que no se puede integrar en tiempo real) en vez de bloquear el piloto.
**Acción:** Contactar a Syscompsa para descartar o confirmar una vía de integración no pública, **después** de tener el `ContificoAdapter` andando. Si no hay vía, construir el adaptador por archivos/BD puente y aceptar sincronización por lotes para ese local. La conversación de "migrar de sistema" corresponde plantearla a ese local específico, no al proyecto entero.

### R-17 — Cartilla de fidelidad con reglas sin definir
**Descripción:** Negocios pidió una cartilla de fidelidad (28-jul-2026) pero **cuántos sellos hacen falta y cuál es el premio siguen en definición**. Hay dos problemas distintos escondidos ahí:
1. **De alcance:** un requisito nuevo entrando después de que el diseño estaba cerrado. Si además llega con reglas que cambian (puntos en vez de sellos, premios escalonados, campañas por temporada), el módulo se convierte en un pozo sin fondo dentro de un proyecto de taller con fecha de entrega.
2. **De negocio:** según cómo se defina "una compra", el local puede terminar regalando premios por ventas que no ocurrieron. Si el sello se acredita al comprar, un estudiante llena la cartilla sin retirar nunca el almuerzo. Si no hay tope diario, la llena en un día comprando el ítem más barato varias veces.

> ✅ **Actualizado el 8-ago-2026 — las cinco reglas quedaron confirmadas por Negocios**, y las cinco a favor de lo que Ingeniería había propuesto: "cartilla" es tarjeta de sellos (no paquete prepago), el sello se acredita al retirar, el tope es de 1 sello por día, la cartilla es por local, y el premio se cobra como **descuento del 100% con nota identificable**, no como venta de $0. La probabilidad baja de Alta a **Baja**: lo único que queda sin definir son dos valores de configuración (cuántos sellos y qué premio), que por diseño no obligan a rediseñar nada.
>
> **La respuesta del premio mejoró el modelo.** Ingeniería había propuesto una orden de $0; Negocios pidió descuento del 100% con motivo. Es mejor: conserva el precio original, así que el local puede ver **cuánto le costaron los premios** (métrica que con $0 no existía), y le da al ERP un documento que entiende mejor que una venta de importe cero. De paso cierra el punto técnico que estaba abierto sobre cómo representar el canje.

**Acción:** (1) Modelar los dos datos faltantes como **configuración** (`sellosRequeridos`, `descripcionPremio`) y no como constantes, para que definirlos sea un valor en base de datos y no un cambio de diseño — **ya aplicado**. (2) Acreditar el sello en `marcarEntregado()`, no en `confirmarCompra()`, y hacer `Sello → Orden` único — **ya aplicado**, cierra el agujero de llenar la cartilla sin retirar. (3) Tope `maxSellosPorDia = 1` por defecto — **ya aplicado**, pendiente de confirmar con Negocios. (4) **Congelar el alcance del módulo a una cartilla simple** (N sellos → 1 premio, por local): cualquier variante más rica (puntos, niveles, campañas) va a control de cambios con reestimación, igual que R-08.

### R-15 — El código de retiro numérico corto es adivinable
**Descripción:** Negocios eligió un código de retiro **numérico de 6 dígitos** (28-jul-2026) en vez del UUID firmado que había propuesto Ingeniería. La decisión es correcta operativamente —el estudiante lo dicta de viva voz y el Operador lo digita—, pero tiene un costo de seguridad que no tenía la propuesta anterior: el espacio de búsqueda pasa de 2¹²² combinaciones a 10⁶, y en la práctica es mucho menor, porque solo son válidos los pocos códigos vigentes de ese local en ese momento. Un atacante que pruebe códigos al azar en el panel del Operador podría acertar el almuerzo de otro estudiante.
**Acción:** (1) Limitar los intentos fallidos de validación por sesión de Operador y por ventana de tiempo. (2) Expiración corta del código (horario de almuerzo, no todo el día), que reduce cuántos están vigentes a la vez. (3) Que el panel muestre el nombre del estudiante antes de confirmar la entrega — el Operador lo tiene enfrente, así que un código acertado por azar se cae en la verificación visual. (4) Registrar cada validación fallida en `RegistroAuditoria`. **Riesgo residual aceptable**: la mitigación (3) es fuerte porque la entrega es presencial.

### R-16 — Costo operativo de sostener varios ERP heterogéneos a la vez
**Descripción:** La aclaración de Negocios del 28-jul-2026 (cada local usa su propio ERP) convirtió a Aliflow en una plataforma multi-tenant real. El patrón Adapter resuelve el problema de **diseño**, pero no el de **operación**: cada local nuevo trae su propio juego de credenciales que gestionar y rotar, su propio formato de errores que interpretar, su propio interlocutor de soporte cuando algo falla, y su propio entorno de pruebas (que puede no existir). Es exactamente el tipo de trabajo que R-10 advierte que se subestima.
**Acción:** (1) Tratar el alta de cada local como un mini-proyecto con su propio checklist (credenciales, mapeo de productos al modelo canónico, prueba de humo bidireccional), no como un cambio de configuración. (2) Que el panel de estado de sincronización (UC10) sea por local y le sirva **al equipo de Aliflow** para monitorear, no solo al proveedor. (3) Para el alcance del taller, limitar el número de locales integrados a los dos confirmados (Barú y Caramel Coffee) y dejar los demás como demostración de extensibilidad, no como entregable.

## Riesgos también identificados en la revisión del flujo funcional (no estaban en la matriz original)

Estos se detectaron en `Hallazgos-Ingenieria-API-Generica.md` sección 5.3 y conviene incorporarlos formalmente:

| ID | Nombre | Tipo | Probabilidad | Impacto | Estrategia |
|---|---|---|---|---|---|
| R-12 | Operador sin modo offline en v1 (decisión de negocio ya confirmada) — un fallo de conectividad en el punto de entrega bloquea toda entrega de almuerzos | Tecnológico | Media | Grave | Aceptar (con plan de contingencia manual documentado) |
| R-13 | Órdenes "Comprado" sin estado de expiración/no-show — no hay regla definida para una orden nunca retirada | Requerimientos | Media | Moderado | Mitigar (definir el estado y su regla de negocio antes de construir el diagrama de estados) |
| R-14 | *(nuevo, detectado 27-jul-2026 al diseñar `uml/secuencia-retiro-entrega.puml`)* Doble redención del código de retiro — dos Operadores podrían validar el mismo código casi simultáneamente | Tecnológico | Baja | Grave | Mitigar |

### R-14 — Doble redención del código de retiro
**Descripción:** si dos Operadores (posiblemente en distintos puntos de entrega del mismo local) intentan validar el mismo `CodigoRetiro` casi al mismo tiempo, sin un mecanismo atómico ambos podrían marcar la entrega como exitosa, resultando en dos entregas físicas de un mismo almuerzo.
**Acción:** ya resuelto a nivel de diseño — la invalidación del código se modela como una actualización atómica y condicional (`UPDATE ... WHERE usado = false`), igual que el mecanismo de bloqueo optimista usado para el stock (`Plato.version`). Si la actualización afecta 0 filas, se informa error en vez de completar una segunda entrega. Ver `uml/secuencia-retiro-entrega.puml`.

## Riesgos incorporados tras la respuesta de Negocios del 8-ago-2026

> **Negocios resolvió la decisión #13: la recarga se hace por establecimiento**, con la aplicación *Parqueo Positivo* como referencia (el usuario elige un servicio por defecto y su saldo pertenece a ese servicio). Es la salida B de las tres analizadas. Consecuencias sobre esta matriz:
>
> - **R-18 y R-19 quedan cerrados.** Ya no hay contradicción con el acta —el dinero va directo a la cuenta de cada proveedor y Aliflow no custodia nada— y el *split payments* deja de ser necesario, porque cada recarga tiene un único destinatario. El universo de pasarelas candidatas se amplía en vez de reducirse.
> - **Se desbloquea el esquema completo de la base de datos**, que era lo único que quedaba congelado.
> - **Se agregan tres riesgos:** R-21, R-22 y R-23, todos consecuencia de que el saldo pase a ser por local.
>
> Vale decirlo con honestidad: la salida elegida **no era la recomendada por Ingeniería** (habíamos recomendado la A). La decisión es del cliente y es defendible —resuelve la contradicción de raíz y elimina el riesgo regulatorio—, pero el costo real es R-21, y ese costo lo paga el estudiante, no el proyecto.

### R-21 — Saldo fragmentado entre establecimientos
**Descripción:** al ser el saldo por local, un estudiante con $6 en Barú y $4 en Caramel Coffee **no puede comprar un almuerzo de $7 en ninguno de los dos**, pese a tener $10 en la plataforma. Es exactamente el problema por el que Ingeniería descartó la "lectura A" de la distribución el 28-jul; la diferencia es que ahora la fragmentación es *elegida por el estudiante* y no automática, lo que la hace tolerable pero no la elimina. Además la fricción crece con cada local: comer en dos locales significa administrar dos saldos y hacer dos recargas.
**Por qué es Alta:** no es un caso raro. Basta con recargar un monto que no sea múltiplo del precio del almuerzo para ir dejando restos en cada local.
**Acción:** (1) Que la interfaz muestre siempre el saldo del establecimiento activo y advierta al recargar que ese dinero solo sirve ahí (RF-08 criterio 6, RF-15). (2) Sugerir montos de recarga alineados con el precio de los platos de ese local, en vez de montos redondos genéricos. (3) Al fallar una compra por saldo insuficiente, ofrecer recargar en ese mismo local sin salir del flujo (RF-12 criterio 3). (4) Medir cuántas compras se pierden por saldo insuficiente teniendo saldo en otro local — si el número es alto, es evidencia concreta para volver a discutir el modelo con Negocios.

### R-22 — Un local sin cuenta de comercio en la pasarela
**Descripción:** que el dinero vaya directo a la cuenta de cada proveedor implica que **cada local necesita su propia cuenta de comercio** en la pasarela que se elija. Si un local no puede abrirla (requisitos bancarios, RUC, volumen mínimo) o no quiere asumir su comisión, no puede recibir recargas — y por lo tanto no puede vender por Aliflow, aunque su ERP esté integrado y su menú publicado.
**Por qué es Grave:** convierte el alta de un local en una gestión financiera, no solo técnica. Es un requisito nuevo de admisión a la plataforma que antes no existía.
**Acción:** (1) Verificar con los dos locales confirmados que pueden abrir cuenta **antes** de seleccionar pasarela (RNF-E-11b). (2) Incorporar "cuenta de comercio activa" a la lista de verificación de alta de local (RNF-O-06). (3) Si los locales no coinciden en una misma pasarela, evaluar soportar más de una — con el costo de integración que eso implica, análogo a R-16 pero en pagos.

### R-23 — Saldo huérfano que Aliflow no puede devolver
**Descripción:** un estudiante se gradúa, o un local sale de la plataforma, y queda saldo sin consumir. **Aliflow no puede devolverlo porque nunca tuvo el dinero** (RN-14): es una obligación del establecimiento con el estudiante. Pero el reclamo va a llegar a Aliflow igual, porque la aplicación es la cara visible.
**Acción:** (1) **Transferir el riesgo por contrato:** que el acuerdo comercial con cada local establezca explícitamente qué pasa con el saldo no consumido y quién responde. (2) Que la aplicación lo comunique al estudiante en la recarga (RNF-E-05b). (3) Avisar al estudiante con saldo remanente antes de que un local se desactive. (4) Definir un plazo y una política de saldo inactivo, acordados con el local — es la misma pregunta abierta que el reembolso de órdenes expiradas y conviene resolverlas juntas.

---

## Riesgos incorporados tras la reunión del 30-jul-2026

### R-18 — Contradicción entre custodia de fondos y saldo único — ✅ **CERRADO el 8-ago-2026**

> **Resuelto.** Negocios eligió la salida B: la recarga es por establecimiento. Se conserva la descripción completa abajo porque documenta el análisis que llevó a la decisión y sirve de respaldo si el punto reaparece.
**Descripción:** el acta del 30-jul (§3.9) establece que *"el dinero llegará directamente a la cuenta de cada proveedor"* y que *"AliFlow no actuará como custodio de los fondos"*. La decisión #4 del 28-jul establece que el estudiante hace **una sola recarga** a un **saldo único** gastable en cualquier local. Las dos no pueden ser ciertas a la vez: al momento de recargar todavía no se sabe en qué local se comprará, así que no hay a qué cuenta de proveedor enviar el dinero.
**Por qué es Grave:** no es un detalle de implementación. Según cómo se resuelva, cambia el modelo de datos de la billetera, la elección de pasarela y posiblemente la experiencia del estudiante.
**Acción:** (1) Llevarlo a la próxima reunión como **decisión bloqueante**, con las tres salidas ya analizadas (pasarela con *split*, elegir local al recargar, o Aliflow custodia). (2) **No escribir el esquema de base de datos de la billetera** hasta tener la respuesta; el resto del esquema sí se puede avanzar. (3) Recomendación de Ingeniería: la pasarela con *split*, porque es la única que preserva el saldo único sin poner a Aliflow a custodiar dinero de terceros.

### R-19 — Que ninguna pasarela ecuatoriana soporte *split payments* — ✅ **CERRADO el 8-ago-2026**

> **Ya no aplica.** Este riesgo existía solo si Negocios elegía la salida A. Al elegirse la B, cada recarga tiene un único destinatario y el *split* deja de ser necesario: la capacidad de marketplace pasa de criterio eliminatorio a irrelevante. En su lugar aparece R-22, que es un problema distinto (que cada local pueda abrir su propia cuenta) y de menor severidad técnica.

**Descripción:** si la salida elegida para R-18 es "la pasarela retiene y liquida al comprar", el proyecto queda dependiendo de que exista una pasarela en Ecuador con capacidad de marketplace. Si ninguna la ofrece a un costo razonable, hay que volver atrás y rehacer el modelo de billetera.
**Acción:** (1) En la comparación de pasarelas (tarea acordada), tratar el *split* como **criterio eliminatorio**, no como deseable. (2) Verificarlo **antes** de comprometer el modelo de saldo único con Negocios. (3) Tener lista la alternativa de respaldo: saldo por local, que es lo que se descartó el 28-jul.

### R-20 — El cupo reservado depende de mantenimiento manual del proveedor
**Descripción:** el inventario reservado elimina la sobreventa, pero introduce una dependencia operativa nueva: si el proveedor no repone el cupo, Aliflow muestra "agotado" mientras el local sigue teniendo comida. El fallo es silencioso — nadie se queja porque nadie ve lo que no puede comprar — y se traduce en venta perdida.
**Acción:** (1) Alertar al proveedor en su panel cuando el cupo baje de un umbral. (2) Registrar los intentos de compra rechazados por cupo agotado y mostrarlos como métrica, para que la venta perdida sea **visible**. (3) Evaluar para v2 una reposición automática desde el stock del ERP cuando la integración esté disponible.

---

*Documento preparado por el Grupo de Ingeniería, formalizando la matriz de riesgos ya elaborada por el equipo e incorporando los riesgos detectados durante la revisión del flujo funcional, la investigación de arquitectura de integración y las reuniones con Negocios del 28 y 30 de julio de 2026.*
