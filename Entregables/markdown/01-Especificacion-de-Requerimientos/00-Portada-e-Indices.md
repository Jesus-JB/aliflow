> **Entregable 01.a · rúbrica: Estructura del documento de especificación de requerimientos (3 pts)**
> Esta pieza aporta portada, integrantes, tabla de contenido e índices. Los índices se generan automáticamente al compilar el PDF — ver [`../../README.md`](../../README.md).

---

<div style="text-align:center">

# Aliflow

## Documento de Especificación de Requerimientos del Sistema de Software

**Universidad de Especialidades Espíritu Santo**
Facultad de Ingenierías · Computación
**Ingeniería de Software I**

---

### Integrantes del equipo

<!--
  ⚠️ PENDIENTE — completar antes de entregar.
  La rúbrica (entregable 01.a) exige la lista de integrantes en la PRIMERA página.
  Un nombre por línea, en la tabla de abajo.
-->

| # | Integrante | Rol en el proyecto |
|---|---|---|
| 1 | *(pendiente de completar)* | |
| 2 | *(pendiente de completar)* | |
| 3 | *(pendiente de completar)* | |
| 4 | *(pendiente de completar)* | |

**Cliente:** Grupo de Negocios — Aliflow
**Repositorio público con las evidencias:** https://github.com/Jesus-JB/aliflow
**Prototipo de alta fidelidad:** https://jesus-jb.github.io/aliflow/

**Fecha de emisión:** 9 de agosto de 2026

</div>

---

## Cómo está organizado este documento

| Sección | Qué contiene | Archivo fuente |
|---|---|---|
| 1 | Introducción, alcance, glosario, actores y reglas de negocio transversales | `01-Introduccion-y-Contexto.md` |
| 2 | **Requerimientos funcionales** — 56 requerimientos con criterios de aceptación | `02-Requerimientos-Funcionales.md` |
| 3 | **Requerimientos no funcionales** — 52 clasificados según Sommerville, con criterio de validación | `03-Requerimientos-No-Funcionales.md` |
| 4 | Requerimientos bloqueados, alcance excluido y matrices de trazabilidad | `04-Alcance-Trazabilidad-y-Decisiones.md` |
| 5 | Evidencias de las técnicas de levantamiento empleadas | `05-Evidencias-de-Levantamiento.md` |
| 6 | Gestión de riesgos | `06-Gestion-de-Riesgos.md` |
| 7 | Sprint backlogs y cronograma | `07-Sprint-Backlogs-y-Cronograma.md` |
| Apéndice A | Prototipo del sistema y flujo de ventanas | `Apendice-A-Prototipo.md` |
| Apéndice B | Acta de conformidad firmada por el cliente | `Apendice-B-Acta-de-Conformidad.md` |

Cada archivo se puede leer por separado. El PDF que se entrega los concatena en este orden.

---

## Convenciones de este documento

**Identificadores.** `RF-nn` requerimiento funcional · `RNF-P-nn` no funcional de producto · `RNF-O-nn` organizacional · `RNF-E-nn` externo · `RN-nn` regla de negocio transversal · `UCnn` caso de uso · `R-nn` riesgo.

**Estado de cada requerimiento.**

| Marca | Significado |
|---|---|
| ✅ | **Confirmado por Negocios** — consta en acta o en una decisión cerrada |
| 🟡 | **Propuesta de Ingeniería** — diseño razonado que el cliente todavía no validó |
| 🔴 | **Bloqueado** — no se puede especificar hasta que se resuelva una decisión abierta |

Esta distinción se mantiene en todo el proyecto: en los diagramas UML es el estereotipo `<<propuesta>>` con fondo amarillo, y en el prototipo es la etiqueta "Pendiente de Negocios". **Una propuesta de Ingeniería nunca se presenta como si fuera una decisión del cliente.**

**Prioridad (MoSCoW).** *Debe* — sin esto no hay producto · *Debería* — importante pero el producto funciona sin ello · *Podría* — deseable, primer candidato a salir · *No en v1* — excluido con la razón declarada.

---

## Índice de tablas y de figuras

Ambos se generan automáticamente al compilar el PDF y no se mantienen a mano.

> ⚠️ **Pendiente de verificar antes de entregar.** La rúbrica (01.a) exige índice de tablas **e** índice de figuras además de la tabla de contenido. El script `construir-pdf.sh` genera la tabla de contenido; los índices de tablas y figuras requieren que las tablas y figuras estén rotuladas. Ver la nota en `construir-pdf.sh`.

