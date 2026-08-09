# Entregables — Aliflow

Todo lo que se entrega, más las fuentes de donde sale.

**El enunciado y la rúbrica están en [`../Proyecto - entregables .docx-1.pdf`](../Proyecto%20-%20entregables%20.docx-1.pdf).**

---

## Cómo está organizado

| Qué | Dónde | Para qué |
|---|---|---|
| **Lo que se entrega** | [`Documento Oficial/`](Documento%20Oficial/) | Los 5 documentos que pide el enunciado, ya en PDF |
| **Un PDF por punto** | esta carpeta, sueltos | Ver de un vistazo qué cubre cada punto y qué falta. **No se entregan**, son para nosotros |
| **Las fuentes** | [`markdown/`](markdown/) | Los `.md` organizados por entregable. **Acá se edita** |
| Diagramas UML | [`uml/`](uml/) | Fuentes `.puml`, sus `.svg` y el script para regenerarlos |
| Mockups y prototipo | [`mockups/`](mockups/) | Exportaciones PNG, marca y el código del prototipo web |
| Script de compilación | [`build/`](build/) | Genera todos los PDF desde `markdown/` |

> ⚠️ **Los PDF no se editan a mano.** Son salida de los `.md`. Si cambiás una fuente, recompilá o el PDF entregado deja de coincidir con ella.

```bash
./build/construir.sh                # todo
./build/construir.sh individuales   # solo los PDF sueltos
./build/construir.sh oficiales      # solo los 5 de Documento Oficial/
```

Requiere `pandoc` y `typst`.

---

## Estado por punto

### 01 · Documento de especificación de requerimientos — 32 pts

| Punto | Rúbrica | Pts | Estado | PDF | Fuente |
|---|---|---:|---|---|---|
| 01.a | Estructura del documento | 3 | 🟡 **Parcial** | `01a-Estructura-del-Documento.pdf` | [`00-Portada-e-Indices.md`](markdown/01-Especificacion-de-Requerimientos/00-Portada-e-Indices.md) |
| — | **Requerimientos funcionales** | **15** | ✅ | `01b-Requerimientos-Funcionales.pdf` | [`02-Requerimientos-Funcionales.md`](markdown/01-Especificacion-de-Requerimientos/02-Requerimientos-Funcionales.md) |
| 01.c | **RNF categorizados con criterio de validación** | **8** | ✅ | `01c-Requerimientos-No-Funcionales.pdf` | [`03-Requerimientos-No-Funcionales.md`](markdown/01-Especificacion-de-Requerimientos/03-Requerimientos-No-Funcionales.md) |
| 01.d | Evidencias de levantamiento y metodologías | 3 | ✅ | `01d-Evidencias-de-Levantamiento.pdf` | [`05-Evidencias-de-Levantamiento.md`](markdown/01-Especificacion-de-Requerimientos/05-Evidencias-de-Levantamiento.md) |
| 01.e | Acta de conformidad firmada | — | ⏳ **Esperando al cliente** | `01e-Acta-de-Conformidad.pdf` | [`Apendice-B-Acta-de-Conformidad.md`](markdown/01-Especificacion-de-Requerimientos/Apendice-B-Acta-de-Conformidad.md) |
| 01.f | **Prototipo de alta fidelidad** | **12** | ✅ | `01f-Prototipo.pdf` | [`Apendice-A-Prototipo.md`](markdown/01-Especificacion-de-Requerimientos/Apendice-A-Prototipo.md) |
| 01.g | Documentación de riesgos | 3 | ✅ | `01g-Gestion-de-Riesgos.pdf` | [`06-Gestion-de-Riesgos.md`](markdown/01-Especificacion-de-Requerimientos/06-Gestion-de-Riesgos.md) |
| 01.g | **Sprint backlogs y activity-on-arrow** | **3** | ❌ **No empezado** | `01g-Sprint-Backlogs-y-Cronograma.pdf` | [`07-Sprint-Backlogs-y-Cronograma.md`](markdown/01-Especificacion-de-Requerimientos/07-Sprint-Backlogs-y-Cronograma.md) |
| — | Contenido de otras secciones | 3 | ✅ | `01h-Contenido-Complementario.pdf` | [`01-Introduccion-y-Contexto.md`](markdown/01-Especificacion-de-Requerimientos/01-Introduccion-y-Contexto.md) · [`04-Alcance-Trazabilidad-y-Decisiones.md`](markdown/01-Especificacion-de-Requerimientos/04-Alcance-Trazabilidad-y-Decisiones.md) |

> **Dos líneas de la rúbrica no tienen letra propia en el enunciado**: los requerimientos funcionales (15 pts, el ítem de más valor de todo el proyecto) y el contenido de otras secciones (3 pts). Se les asignó `01b` y `01h` para que no queden sin archivo visible.

**Se entrega como un solo PDF.** El enunciado lo pide en singular y con el acta (01.e) y el prototipo (01.f) **como apéndices de ese documento**. Por eso `Documento Oficial/01-Especificacion-de-Requerimientos.pdf` concatena las 10 piezas.

### 02 · Modelamiento de la parte estática (UML) — 21 pts

| Punto | Pts | Estado | PDF | Fuente |
|---|---:|---|---|---|
| 02.a | Casos de uso y documentación completa | 6 | ✅ | `02a-Casos-de-Uso.pdf` | [`a-Casos-de-Uso.md`](markdown/02-Modelamiento-Parte-Estatica/a-Casos-de-Uso.md) |
| 02.b | Clases (SOLID, patrones, malos olores) | 6 | ✅ | `02b-Diagrama-de-Clases.pdf` | [`b-Diagrama-de-Clases.md`](markdown/02-Modelamiento-Parte-Estatica/b-Diagrama-de-Clases.md) |
| 02.c | Objetos | 3 | ✅ | `02c-Diagramas-de-Objetos.pdf` | [`c-Diagramas-de-Objetos.md`](markdown/02-Modelamiento-Parte-Estatica/c-Diagramas-de-Objetos.md) |
| 02.d | Componentes | 3 | ✅ | `02d-Diagrama-de-Componentes.pdf` | [`d-Diagrama-de-Componentes.md`](markdown/02-Modelamiento-Parte-Estatica/d-Diagrama-de-Componentes.md) |
| 02.e | Despliegue | 3 | ✅ | `02e-Diagrama-de-Despliegue.pdf` | [`e-Diagrama-de-Despliegue.md`](markdown/02-Modelamiento-Parte-Estatica/e-Diagrama-de-Despliegue.md) |

### 03 · Modelamiento del comportamiento (UML) — 19 pts

| Punto | Pts | Estado | PDF | Fuente |
|---|---:|---|---|---|
| 03.a | Actividad — *todos* los procesos | 6 | ✅ | `03a-Diagramas-de-Actividad.pdf` | [`a-Diagramas-de-Actividad.md`](markdown/03-Modelamiento-Comportamiento/a-Diagramas-de-Actividad.md) |
| 03.b | Secuencia — algoritmos transaccionales | 10 | ✅ | `03b-Diagramas-de-Secuencia.pdf` | [`b-Diagramas-de-Secuencia.md`](markdown/03-Modelamiento-Comportamiento/b-Diagramas-de-Secuencia.md) |
| 03.c | Estado — objetos pertinentes | 3 | ✅ | `03c-Diagramas-de-Estado.pdf` | [`c-Diagramas-de-Estado.md`](markdown/03-Modelamiento-Comportamiento/c-Diagramas-de-Estado.md) |

### 04 y 05

| Punto | Pts | Estado | PDF | Fuente |
|---|---:|---|---|---|
| 04 | **Modelo de la base de datos** | **10** | ✅ | `04-Modelo-de-Base-de-Datos.pdf` | [`Modelo-de-Base-de-Datos.md`](markdown/04-Modelo-de-Base-de-Datos/Modelo-de-Base-de-Datos.md) + [`esquema.sql`](markdown/04-Modelo-de-Base-de-Datos/esquema.sql) |
| 05 | Mockups | — | ✅ | `05-Mockups.pdf` | [`Mockups.md`](markdown/05-Mockups/Mockups.md) |

### Extra

| Qué | Pts | Estado | Dónde |
|---|---:|---|---|
| Definición arquitectónica | +4 | ✅ | [`../Hallazgos-Ingenieria-API-Generica.md`](../Hallazgos-Ingenieria-API-Generica.md) + [`../demo-odoo/`](../demo-odoo/) |

---

## Lo que falta: 6 puntos

| Qué | Pts | Quién puede tomarlo |
|---|---:|---|
| **Sprint backlogs y activity-on-arrow** | 3 | Cualquiera. El archivo trae una propuesta de seis sprints derivada de la priorización MoSCoW que ya existe |
| **Estructura del documento** | 3 | Falta la lista de integrantes y rotular tablas y figuras para poder generar sus índices |

**El modelo de base de datos se cerró el 9-ago-2026** (10 pts): 24 tablas, DDL ejecutado contra PostgreSQL 16 y 10 pruebas que verifican que las restricciones impiden lo que dicen impedir.

---

## Dónde vive el resto

Esta carpeta tiene lo que se entrega. Lo que no se entrega sigue en la raíz:

| Qué | Dónde | Por qué no está acá |
|---|---|---|
| Estado del proyecto y traspaso | [`../Estado-del-Proyecto.md`](../Estado-del-Proyecto.md) | Documentación interna |
| Decisiones abiertas con el cliente | [`../Decisiones-Pendientes-Negocios.md`](../Decisiones-Pendientes-Negocios.md) | Interna, y **es la fuente de verdad del estado** |
| Investigación de integración con ERPs | [`../Hallazgos-Ingenieria-API-Generica.md`](../Hallazgos-Ingenieria-API-Generica.md) | Sustenta el extra, no es un entregable en sí |
| Demo técnico con Odoo | [`../demo-odoo/`](../demo-odoo/) | Es código, no un documento |
| Actas de reunión con el cliente | `../ACTA*.pdf` | Fuentes primarias del levantamiento |
