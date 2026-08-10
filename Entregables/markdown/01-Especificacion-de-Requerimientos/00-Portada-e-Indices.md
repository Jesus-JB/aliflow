<div style="text-align:center">

# Aliflow

## Documento de Especificación de Requerimientos del Sistema de Software

**Universidad de Especialidades Espíritu Santo**
Facultad de Ingenierías · Computación
**Ingeniería de Software I**

---

### Integrantes del equipo

| # | Integrante | Roles en el proyecto |
|---|---|---|
| 1 | Jesus Jimenez | Líder de proyecto y gestión de la configuración · Arquitecto de integración · Modelador de la parte estática |
| 2 | Yull Bazurto | Analista de requerimientos · Modelador del comportamiento · Gestor de riesgos |
| 3 | Antonio Adrian | Diseñador de experiencia e interfaz · Modelador de datos · Planificador y responsable de calidad documental |

: Integrantes del equipo y roles asumidos

**Repositorio público con las evidencias:** https://github.com/Jesus-JB/aliflow
**Prototipo de alta fidelidad:** https://jesus-jb.github.io/aliflow/

**Fecha de emisión:** 9 de agosto de 2026

</div>

---

## Cómo está organizado este documento

| Sección | Qué contiene |
|---|---|
| 1 | Introducción, alcance, glosario, actores y reglas de negocio transversales |
| 2 | **Requerimientos funcionales** — 57 requerimientos con criterios de aceptación |
| 3 | **Requerimientos no funcionales** — 53 clasificados según Sommerville, con criterio de validación |
| 4 | Alcance excluido y matrices de trazabilidad |
| 5 | Evidencias de las técnicas de levantamiento empleadas |
| 6 | Gestión de riesgos |
| 7 | Sprint backlogs y cronograma |
| Apéndice A | Prototipo del sistema y flujo de ventanas |
| Apéndice B | Acta de conformidad firmada por el cliente |

: Organización del documento

Cada sección puede leerse por separado.

---

## Reparto de responsabilidades

Cada integrante asumió tres roles. El reparto sigue las dependencias del trabajo, no un corte por partes iguales: quien levanta los requerimientos es quien mejor puede modelar el comportamiento que describen, y quien diseña las pantallas es quien mejor entiende qué datos deben existir detrás. Cada entregable tiene **un** responsable, y el resto del equipo lo revisa.

| Entregable | Responsable |
|---|---|
| Requerimientos funcionales y no funcionales | Yull Bazurto |
| Evidencias de levantamiento y acta de conformidad | Yull Bazurto |
| Gestión de riesgos | Yull Bazurto |
| Diagramas de actividad, secuencia y estado | Yull Bazurto |
| Casos de uso | Jesus Jimenez |
| Diagrama de clases | Jesus Jimenez |
| Diagramas de objetos, componentes y despliegue | Jesus Jimenez |
| Análisis de integración con ERP y demo técnico | Jesus Jimenez |
| Repositorio, compilación y publicación de los entregables | Jesus Jimenez |
| Sistema de diseño y mockups | Antonio Adrian |
| Prototipo interactivo | Antonio Adrian |
| Modelo de base de datos | Antonio Adrian |
| Sprint backlogs y cronograma | Antonio Adrian |
| Estructura del documento, índices y trazabilidad | Antonio Adrian |

: Responsable de cada entregable

---

## Convenciones de este documento

**Identificadores.** `RF-nn` requerimiento funcional · `RNF-P-nn` no funcional de producto · `RNF-O-nn` organizacional · `RNF-E-nn` externo · `RN-nn` regla de negocio transversal · `UCnn` caso de uso · `R-nn` riesgo · `TT-nn` tarea técnica del backlog sin requerimiento propio.

**Referencias a secciones.** El signo **`§`** significa "sección": `§7` remite a la sección 7 de este mismo documento, y `§1.2` a su subsección 1.2. Cuando va precedido de un nombre de archivo, remite a la sección de *ese* archivo.

**Prioridad (MoSCoW).** *Debe* — sin esto no hay producto · *Debería* — importante pero el producto funciona sin ello · *Podría* — deseable, primer candidato a salir · *No en v1* — excluido con la razón declarada.

---

## Índice de tablas

```{=typst}
#outline(title: none, target: figure.where(kind: table))
```

## Índice de figuras

```{=typst}
#outline(title: none, target: figure.where(kind: image))
```

