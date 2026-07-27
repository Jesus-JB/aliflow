# Gestión de Riesgos — Aliflow

**Proyecto:** Aliflow — Sistema web para venta online de almuerzos en Barú UEES
**Entregable de referencia:** 01.g de la especificación de proyecto final ("Se debe documentar la gestión de riesgos, sprint backlogs y el cronograma para el proyecto.")
**Fecha:** 26-jul-2026
**Origen:** matriz elaborada previamente por el equipo, recuperada y formalizada aquí junto con la investigación de arquitectura de integración (`Hallazgos-Ingenieria-API-Generica.md`).

Clasificación de tipos de riesgo: Tecnológico, Humano, Organizacional, Herramientas, Requerimientos, Estimación.

Escalas usadas: **Probabilidad** (Muy Baja / Baja / Media / Alta / Muy Alta), **Impacto** (Mínimo / Leve / Moderado / Grave / Catastrófico), **Estrategia** (Evitar / Transferir / Mitigar / Aceptar).

## Matriz de riesgos

| ID | Nombre | Tipo | Probabilidad | Impacto | Estrategia |
|---|---|---|---|---|---|
| R-01 | No contar con acceso real a la API de Contífico | Tecnológico | Alta | Grave | Evitar |
| R-02 | Inconsistencia entre saldo, facturación e inventario | Tecnológico | Media | Grave | Transferir |
| R-03 | Baja experiencia del equipo creando APIs seguras | Humano | Media | Moderado | Mitigar |
| R-04 | Disponibilidad limitada de los integrantes | Humano | Media | Leve | Mitigar |
| R-05 | Falta de validación operativa con Barú | Organizacional | Media | Grave | Transferir |
| R-06 | Limitaciones del ambiente de pruebas de pagos | Herramientas | Media | Moderado | Mitigar |
| R-07 | Fallas o incompatibilidades en herramientas de desarrollo | Herramientas | Baja | Leve | Aceptar |
| R-08 | Cambios en el flujo de saldo y comprobantes | Requerimientos | Alta | Grave | Evitar |
| R-09 | Requisitos de seguridad incompletos | Requerimientos | Media | Moderado | Mitigar |
| R-10 | Subestimación del esfuerzo de integración y pruebas | Estimación | Media | Moderado | Mitigar |
| R-11 | *(nuevo, propuesto tras hallazgo 26-jul-2026)* Alpwin (sistema real de Barú) no tiene API pública documentada | Tecnológico | Alta | Grave | Mitigar |

> **R-11 es nuevo** respecto a la matriz original: se agrega a partir del hallazgo de que Barú ya usa Alpwin (ver `Hallazgos-Ingenieria-API-Generica.md` sección 4.3), que no tenía la certeza de ser el proveedor real cuando se hizo la matriz inicial. Complementa a R-01 (que asumía Contífico como el sistema a integrar) — ambos riesgos conviven porque aún no está resuelto qué ERP es el objetivo final de integración.

## Descripción y plan de acción por riesgo

### R-01 — No contar con acceso real a la API de Contífico
**Descripción:** Barú o el proveedor no entregan credenciales/API key para integrar facturación e inventario reales, limitando la validación con el sistema productivo.
**Acción:** Definir desde el inicio que la integración real con Contífico depende de credenciales externas. Mantener como alcance mínimo una capa de integración desacoplada y un Mock ERP para pruebas; documentar el supuesto y no comprometer facturación real sin autorización.

### R-02 — Inconsistencia entre saldo, facturación e inventario
**Descripción:** Una compra podría descontar saldo en Aliflow, pero fallar al registrar la factura o el descuento de inventario en el sistema externo.
**Acción:** Delegar la emisión contable final al ERP/proveedor autorizado y registrar en Aliflow estados de sincronización. Implementar bitácora, reintentos, estados PENDIENTE/FACTURADO/ERROR y procedimiento de conciliación con el responsable de Barú. (Ver patrón outbox en `Hallazgos-Ingenieria-API-Generica.md` sección 3.4 — ya validado técnicamente en el demo con Odoo.)

### R-03 — Baja experiencia del equipo creando APIs seguras
**Descripción:** El equipo ha consumido APIs, pero tiene poca experiencia construyendo endpoints propios con autenticación, roles, validaciones y manejo seguro de datos.
**Acción:** Dividir responsabilidades, revisar buenas prácticas OWASP, usar un framework documentado, hacer revisiones de código entre integrantes y priorizar endpoints críticos: autenticación, wallet, órdenes y validación de códigos.

### R-04 — Disponibilidad limitada de los integrantes
**Descripción:** Las cargas académicas y horarios del grupo pueden retrasar el desarrollo de módulos clave como pagos, wallet, panel de cajero e integración externa.
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
**Acción:** Congelar el alcance funcional aprobado para el taller: recarga con comprobante interno y compra con comprobante válido en el ERP. Cualquier cambio debe pasar por control de cambios y reestimación.

### R-09 — Requisitos de seguridad incompletos
**Descripción:** No definir correctamente roles, permisos, protección de tokens, validación de códigos de retiro y auditoría puede abrir fallas de seguridad.
**Acción:** Definir roles estudiante, cajero (Operador) y administrador; usar autenticación con tokens, contraseñas cifradas, validaciones en backend, expiración de códigos de retiro y registro de auditoría para compras y redenciones.

### R-10 — Subestimación del esfuerzo de integración y pruebas
**Descripción:** El equipo puede subestimar el trabajo necesario para probar wallet, órdenes, inventario simulado, facturación, errores y seguridad.
**Acción:** Construir primero un MVP con registro, saldo, compra y código de retiro; luego agregar Mock ERP/adaptador real, reportes y validaciones. Reservar tiempo específico para pruebas de integración y corrección de errores.

### R-11 — Alpwin (sistema real de Barú) no tiene API pública documentada
**Descripción:** Se confirmó (26-jul-2026) que Barú usa Alpwin como sistema de punto de venta, y la investigación de Ingeniería no encontró documentación pública de API para ese sistema — ver `Hallazgos-Ingenieria-API-Generica.md` secciones 2.5 y 4.3. Esto es más específico y con mayor certeza que R-01 (que hablaba de Contífico en general).
**Acción:** Contactar directamente a Syscompsa (fabricante de Alpwin) para descartar o confirmar una vía de integración no pública, antes de comprometerse con un adaptador basado en archivos/BD puente o con la opción de migrar a Barú a otro sistema (decisión que le corresponde al cliente, no solo a Ingeniería).

## Riesgos también identificados en la revisión del flujo funcional (no estaban en la matriz original)

Estos se detectaron en `Hallazgos-Ingenieria-API-Generica.md` sección 5.3 y conviene incorporarlos formalmente:

| ID | Nombre | Tipo | Probabilidad | Impacto | Estrategia |
|---|---|---|---|---|---|
| R-12 | Operador sin modo offline en v1 (decisión de negocio ya confirmada) — un fallo de conectividad en el punto de entrega bloquea toda entrega de almuerzos | Tecnológico | Media | Grave | Aceptar (con plan de contingencia manual documentado) |
| R-13 | Órdenes "Comprado" sin estado de expiración/no-show — no hay regla definida para una orden nunca retirada | Requerimientos | Media | Moderado | Mitigar (definir el estado y su regla de negocio antes de construir el diagrama de estados) |

---

*Documento preparado por el Grupo de Ingeniería, formalizando la matriz de riesgos ya elaborada por el equipo e incorporando los riesgos detectados durante la revisión del flujo funcional y la investigación de arquitectura de integración.*
