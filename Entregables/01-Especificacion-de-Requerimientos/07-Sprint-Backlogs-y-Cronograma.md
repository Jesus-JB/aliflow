> **Entregable 01.g · rúbrica: Sprint backlogs y diagramas activity-on-arrow (3 pts)**
> Parte del documento de especificación de requerimientos. Se ensambla en el PDF único con `construir-pdf.sh` — ver [`../README.md`](../README.md).

---

# Sprint backlogs y cronograma

> ❌ **NO EMPEZADO.** Este archivo existe para que el hueco sea visible, no para simular que está cubierto.
>
> El entregable 01.g pide tres cosas: **gestión de riesgos**, **sprint backlogs** y **cronograma**. La primera está completa en `06-Gestion-de-Riesgos.md`. Las otras dos no están hechas, y valen 3 puntos de rúbrica que hoy no se están ganando.

---

## Qué hay que producir

### 1. Sprint backlogs

Un backlog por sprint, con las historias o tareas, su responsable y su estimación. El producto ya tiene de dónde sacarlas: **los 56 requerimientos funcionales de `02-Requerimientos-Funcionales.md` ya están priorizados con MoSCoW y agrupados en 10 módulos.** Un backlog razonable sale de tomar los módulos como épicas y los `RF-nn` como ítems.

Un orden de sprints que respeta las dependencias reales del sistema:

| Sprint | Contenido | Por qué en ese orden |
|---|---|---|
| 1 | Módulo A (autenticación y roles) + esquema de base de datos | Todo lo demás necesita usuarios autenticados y tablas donde escribir |
| 2 | Módulo C (catálogo y cupo reservado) + Módulo G parcial (panel del proveedor) | Sin menú publicado y cupo asignado no hay nada que comprar |
| 3 | Módulo B (billetera) + Módulo D (compra) | La compra depende del saldo, y el saldo depende de la pasarela |
| 4 | Módulo E (retiro y entrega) + Módulo J (auditoría) | Cierra el ciclo completo del estudiante |
| 5 | Módulo I (integración ERP) contra el ERP simulado | RF-52 permite construirlo sin esperar credenciales |
| 6 | Módulo F (fidelidad) + Módulo H (Super-Admin) | Los dos de menor prioridad MoSCoW |

**Esto es una propuesta de Ingeniería, no un plan aprobado.** Falta ajustarla a la disponibilidad real del equipo, que el riesgo R-04 identifica como limitada.

### 2. Cronograma con diagramas *activity-on-arrow*

La rúbrica pide explícitamente **activity-on-arrow** (AoA), no Gantt ni activity-on-node. En AoA las **flechas son las actividades** y los **nodos son eventos/hitos**, y hace falta identificar la **ruta crítica**.

Dos dependencias del proyecto que van a dominar la ruta crítica y conviene modelar bien:

- **Las credenciales de Contífico (R-01)** son una actividad de duración desconocida controlada por un tercero. En AoA se representa como una actividad con holgura cero si el piloto depende de ella. **RF-52 (ERP simulado) existe justamente para sacarla de la ruta crítica.**
- **El acta de conformidad firmada (01.e)** también depende de un tercero y bloquea el cierre del entregable 01.

---

## Qué ya existe y sirve de insumo

| Insumo | Dónde | Para qué sirve |
|---|---|---|
| 56 RF priorizados con MoSCoW, en 10 módulos | `02-Requerimientos-Funcionales.md` | Ítems del backlog |
| 23 riesgos con probabilidad e impacto | `06-Gestion-de-Riesgos.md` | Holguras y planes de contingencia del cronograma |
| Ruta de implementación por fases | `../../Hallazgos-Ingenieria-API-Generica.md` §4.3 | Orden de los sprints de integración |
| Requerimientos bloqueados | `04-Alcance-Trazabilidad-y-Decisiones.md` §7 | Qué **no** se puede planificar todavía |

---

## Herramienta sugerida

Los diagramas AoA se pueden hacer con PlantUML, igual que el resto de los diagramas del proyecto, y quedarían versionados en `../../uml/` con su `.puml` y su `.svg`, siguiendo la convención que ya usa el repositorio. Así el cronograma no queda en una imagen suelta que nadie puede editar.
