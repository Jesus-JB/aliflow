# Sprint backlogs y cronograma

La construcción se organiza en **seis sprints**. El backlog de cada uno se deriva de los requerimientos funcionales de este mismo documento: los diez módulos funcionan como épicas y cada `RF-nn` como ítem, con la prioridad MoSCoW ya asignada en su ficha.

---

## Orden de los sprints

El orden responde a las dependencias reales entre módulos: ninguno puede construirse antes que aquello sobre lo que se apoya.

| Sprint | Contenido | Depende de |
|---|---|---|
| 1 | Módulo A — autenticación, roles y control de acceso · esquema de base de datos | — |
| 2 | Módulo C — catálogo, menú e inventario reservado · panel del proveedor (parcial) | Sprint 1 |
| 3 | Módulo B — billetera y recarga · Módulo D — compra | Sprints 1 y 2 |
| 4 | Módulo E — retiro y entrega · Módulo J — auditoría | Sprint 3 |
| 5 | Módulo I — integración con ERP, contra el ERP simulado | Sprint 3 |
| 6 | Módulo F — cartilla de fidelidad · Módulo H — Super-Admin | Sprints 4 y 5 |

**Por qué ese orden.** Todo el sistema necesita usuarios autenticados y tablas donde escribir, así que el módulo A y el esquema abren el trabajo. Sin menú publicado y cupo asignado no hay nada que comprar, de modo que el catálogo precede a la compra. El retiro cierra el ciclo del estudiante y solo tiene sentido con órdenes existentes. La integración con el ERP se construye contra el simulador (RF-52), lo que la independiza de la disponibilidad de credenciales externas. Fidelidad y Super-Admin quedan al final por ser los de menor prioridad MoSCoW.

---

## Contenido de cada backlog

Cada ítem del backlog se registra con:

| Campo | Contenido |
|---|---|
| Identificador | El `RF-nn` o `RNF-nn` correspondiente |
| Descripción | El enunciado del requerimiento |
| Criterio de aceptación | El que ya define su ficha en este documento |
| Prioridad | MoSCoW, heredada del requerimiento |
| Responsable | Integrante asignado |
| Estimación | En puntos de historia |

Los requerimientos no funcionales transversales —seguridad, rendimiento, auditoría— no forman un sprint propio: se incorporan como criterios de aceptación de los ítems de cada sprint, porque verificarlos al final impide corregirlos a tiempo.

---

## Cronograma

El cronograma se representa con diagramas **activity-on-arrow**, donde las flechas son las actividades y los nodos son eventos o hitos, e identifica la **ruta crítica** del proyecto.

Dos actividades condicionan esa ruta y no dependen del equipo:

- **La obtención de credenciales del ERP del establecimiento piloto**, cuya duración depende de un tercero. El requerimiento RF-52 —operar contra un ERP simulado— existe precisamente para sacarla de la ruta crítica: el adaptador se construye y se demuestra sin esperar.
- **La firma del acta de conformidad**, que condiciona el cierre de la especificación.

---

## Insumos

| Insumo | De dónde sale |
|---|---|
| Ítems del backlog, ya priorizados | `02-Requerimientos-Funcionales.md` |
| Criterios de aceptación | Ídem, ficha de cada requerimiento |
| Holguras y planes de contingencia | `06-Gestion-de-Riesgos.md` |
| Orden de los sprints de integración | Ruta de implementación por fases del análisis de integración |
