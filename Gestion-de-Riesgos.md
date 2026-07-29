# Gestión de Riesgos — Aliflow

**Proyecto:** Aliflow — Sistema web para venta online de almuerzos en la UEES
*(el nombre original del proyecto decía "en Barú UEES"; Negocios aclaró el 28-jul-2026 que Aliflow sirve a cualquier local de comida de la universidad — Barú, Caramel Coffee, etc. — no solo a Barú)*
**Entregable de referencia:** 01.g de la especificación de proyecto final ("Se debe documentar la gestión de riesgos, sprint backlogs y el cronograma para el proyecto.")
**Fecha:** 26-jul-2026 · **Última revisión:** 28-jul-2026 (reevaluación tras las decisiones de Negocios)
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
| R-17 | *(nuevo, 28-jul-2026)* Cartilla de fidelidad con reglas sin definir: alcance no acotado y riesgo de que el local regale premios que no vendió | Requerimientos | Alta | Moderado | Mitigar |

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
**Acción:** Definir los 3 roles confirmados por Negocios (Estudiante, Proveedor y Operador — no existe un super-admin de plataforma); usar autenticación con tokens, contraseñas cifradas, validaciones en backend, expiración de códigos de retiro y registro de auditoría para compras y redenciones. **Ya modelado (27-jul-2026):** clase `RegistroAuditoria` agregada al diagrama de clases (`uml/diagrama-clases.puml`, paquete "Órdenes"), registrando quién ejecuta las operaciones que cambian dinero o estado de una orden.

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

---

*Documento preparado por el Grupo de Ingeniería, formalizando la matriz de riesgos ya elaborada por el equipo e incorporando los riesgos detectados durante la revisión del flujo funcional y la investigación de arquitectura de integración.*
