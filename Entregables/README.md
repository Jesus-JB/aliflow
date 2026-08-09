# Entregables — Aliflow

Un archivo por ítem de la rúbrica, para que se vea qué está hecho, qué falta y quién puede tomar cada pieza sin pisarse con nadie.

**La rúbrica completa está en [`../Proyecto - entregables .docx-1.pdf`](../Proyecto%20-%20entregables%20.docx-1.pdf).**

---

## Estado por entregable

| Entregable | Pts | Estado | Archivo |
|---|---:|---|---|
| **01 · Especificación de requerimientos** | **32** | | [`01-Especificacion-de-Requerimientos/`](01-Especificacion-de-Requerimientos/) |
| ├ Estructura del documento (portada, integrantes, índices) | 3 | 🟡 Parcial | [`00-Portada-e-Indices.md`](01-Especificacion-de-Requerimientos/00-Portada-e-Indices.md) |
| ├ Contenido de otras secciones | 3 | ✅ | [`01-Introduccion-y-Contexto.md`](01-Especificacion-de-Requerimientos/01-Introduccion-y-Contexto.md) · [`04-Alcance-Trazabilidad-y-Decisiones.md`](01-Especificacion-de-Requerimientos/04-Alcance-Trazabilidad-y-Decisiones.md) |
| ├ **Requerimientos funcionales** | **15** | ✅ | [`02-Requerimientos-Funcionales.md`](01-Especificacion-de-Requerimientos/02-Requerimientos-Funcionales.md) |
| ├ **RNF categorizados con criterio de validación** | **8** | ✅ | [`03-Requerimientos-No-Funcionales.md`](01-Especificacion-de-Requerimientos/03-Requerimientos-No-Funcionales.md) |
| ├ Evidencias de levantamiento y metodologías | 3 | ✅ | [`05-Evidencias-de-Levantamiento.md`](01-Especificacion-de-Requerimientos/05-Evidencias-de-Levantamiento.md) |
| ├ Documentación de riesgos | 3 | ✅ | [`06-Gestion-de-Riesgos.md`](01-Especificacion-de-Requerimientos/06-Gestion-de-Riesgos.md) |
| ├ **Sprint backlogs y activity-on-arrow** | **3** | ❌ **No empezado** | [`07-Sprint-Backlogs-y-Cronograma.md`](01-Especificacion-de-Requerimientos/07-Sprint-Backlogs-y-Cronograma.md) |
| ├ **Prototipo del sistema** | **12** | ✅ | [`Apendice-A-Prototipo.md`](01-Especificacion-de-Requerimientos/Apendice-A-Prototipo.md) |
| └ Acta de conformidad firmada | — | ⏳ **Esperando al cliente** | [`Apendice-B-Acta-de-Conformidad.md`](01-Especificacion-de-Requerimientos/Apendice-B-Acta-de-Conformidad.md) |
| **02–03 · Diagramas UML** | **43** | ✅ | [`02-03-Diagramas-UML.md`](02-03-Diagramas-UML.md) |
| **04 · Modelo de la base de datos** | **10** | ❌ **No empezado** | [`04-Modelo-de-Base-de-Datos.md`](04-Modelo-de-Base-de-Datos.md) |
| **05 · Mockups** | *(incluido en el prototipo)* | ✅ | [`05-Mockups.md`](05-Mockups.md) |
| *Extra · Definición arquitectónica* | +4 | ✅ | [`../Hallazgos-Ingenieria-API-Generica.md`](../Hallazgos-Ingenieria-API-Generica.md) |

**Sin ganar hoy: 16 puntos** — base de datos (10), sprint backlogs (3) y estructura del documento (3).

---

## El entregable 01 se entrega como **un solo PDF**

El enunciado pide *"el documento de especificación de requerimientos del sistema de software (en formato pdf)"*, en singular, y los puntos a–g son partes de ese documento: el **e** y el **f** piden explícitamente el acta y el prototipo **como apéndices**. Por eso las piezas están separadas para trabajarlas, pero se entregan concatenadas:

```bash
cd 01-Especificacion-de-Requerimientos
./construir-pdf.sh
```

Genera `Aliflow-Especificacion-de-Requerimientos.pdf` con las 10 piezas en orden, tabla de contenido y salto de página entre secciones. **Requiere `pandoc` y `typst`.**

> ⚠️ **Hay que recompilar cada vez que cambie una pieza**, o el PDF entregado deja de coincidir con su fuente. Ya pasó una vez.

---

## Cómo se reparte el trabajo sin pisarse

Cada archivo de esta carpeta es independiente: dos personas pueden trabajar en dos piezas distintas sin conflictos de merge. Lo único compartido es `construir-pdf.sh`, que casi nunca cambia.

**Lo que queda libre para tomar:**

| Pieza | Qué falta exactamente |
|---|---|
| `04-Modelo-de-Base-de-Datos.md` | Todo. Es la pieza de más puntos sin empezar (10), y **ya no está bloqueada por ninguna decisión** |
| `07-Sprint-Backlogs-y-Cronograma.md` | Los backlogs y el diagrama activity-on-arrow. El archivo ya tiene la propuesta de sprints y los insumos identificados |
| `00-Portada-e-Indices.md` | La lista de integrantes, y rotular tablas y figuras para poder generar sus índices |

---

## Dónde vive el resto del proyecto

Esta carpeta contiene **los documentos que se entregan**. Lo demás sigue en la raíz del repositorio:

| Qué | Dónde | Por qué no está acá |
|---|---|---|
| Estado del proyecto y traspaso | [`../Estado-del-Proyecto.md`](../Estado-del-Proyecto.md) | Es documentación interna, no se entrega |
| Decisiones abiertas con el cliente | [`../Decisiones-Pendientes-Negocios.md`](../Decisiones-Pendientes-Negocios.md) | Ídem. **Es la fuente de verdad del estado** |
| Investigación de integración con ERPs | [`../Hallazgos-Ingenieria-API-Generica.md`](../Hallazgos-Ingenieria-API-Generica.md) | Sustenta el extra de definición arquitectónica |
| Diagramas UML (fuentes y SVG) | [`../uml/`](../uml/) | Son 20 archivos con su documentación |
| Prototipo web y mockups | [`../mockups/`](../mockups/) | Código y exportaciones |
| Demo técnico con Odoo | [`../demo-odoo/`](../demo-odoo/) | Código |
