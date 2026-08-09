# Entregables — Aliflow

Documentación del proyecto **Aliflow**, una plataforma web para pedir y pagar el almuerzo dentro del campus de la UEES.

---

## Documentos oficiales

Los cinco documentos del proyecto, en PDF:

| # | Documento |
|---|---|
| 01 | [Especificación de requerimientos del sistema](Documento%20Oficial/01-Especificacion-de-Requerimientos.pdf) |
| 02 | [Modelamiento de la parte estática — diagramas UML](Documento%20Oficial/02-Modelamiento-Parte-Estatica.pdf) |
| 03 | [Modelamiento del comportamiento — diagramas UML](Documento%20Oficial/03-Modelamiento-Comportamiento.pdf) |
| 04 | [Modelo de la base de datos](Documento%20Oficial/04-Modelo-de-Base-de-Datos.pdf) |
| 05 | [Mockups](Documento%20Oficial/05-Mockups.pdf) |

**Prototipo interactivo:** https://jesus-jb.github.io/aliflow/ — se abre en el navegador, sin instalar nada.

---

## Documentos por tema

Los mismos contenidos, separados por tema, para consultar un punto concreto sin abrir el documento completo.

### Especificación de requerimientos

| Documento | Contenido |
|---|---|
| [Estructura del documento](01a-Estructura-del-Documento.pdf) | Portada, integrantes, convenciones e índices |
| [Requerimientos funcionales](01b-Requerimientos-Funcionales.pdf) | 57 requerimientos con sus criterios de aceptación |
| [Requerimientos no funcionales](01c-Requerimientos-No-Funcionales.pdf) | 53 requerimientos clasificados según Sommerville, con criterio de validación |
| [Contenido complementario](01h-Contenido-Complementario.pdf) | Introducción, glosario, actores, reglas de negocio, alcance excluido y trazabilidad |
| [Evidencias de levantamiento](01d-Evidencias-de-Levantamiento.pdf) | Técnicas de elicitación empleadas y sus resultados |
| [Gestión de riesgos](01g-Gestion-de-Riesgos.pdf) | Matriz de riesgos y plan de acción |
| [Sprint backlogs y cronograma](01g-Sprint-Backlogs-y-Cronograma.pdf) | Organización de la construcción en sprints |
| [Prototipo](01f-Prototipo.pdf) | Las 22 pantallas y su flujo de ventanas |
| [Acta de conformidad](01e-Acta-de-Conformidad.pdf) | Conformidad del cliente con la especificación |

### Diagramas UML

| Documento | Contenido |
|---|---|
| [Casos de uso](02a-Casos-de-Uso.pdf) | 20 casos de uso desarrollados |
| [Diagrama de clases](02b-Diagrama-de-Clases.pdf) | Modelo de dominio, principios SOLID y patrones aplicados |
| [Diagramas de objetos](02c-Diagramas-de-Objetos.pdf) | Instancias de los aspectos medulares |
| [Diagrama de componentes](02d-Diagrama-de-Componentes.pdf) | Módulos del sistema y sus interfaces |
| [Diagrama de despliegue](02e-Diagrama-de-Despliegue.pdf) | Infraestructura y nodos |
| [Diagramas de actividad](03a-Diagramas-de-Actividad.pdf) | Los procesos del sistema |
| [Diagramas de secuencia](03b-Diagramas-de-Secuencia.pdf) | Algoritmos transaccionales |
| [Diagramas de estado](03c-Diagramas-de-Estado.pdf) | Ciclo de vida de las entidades con estado |

### Datos y diseño

| Documento | Contenido |
|---|---|
| [Modelo de la base de datos](04-Modelo-de-Base-de-Datos.pdf) | Diagrama entidad-relación, esquema y pruebas de restricciones |
| [Mockups](05-Mockups.pdf) | Sistema de diseño y pantallas |

---

## Fuentes

| Qué | Dónde |
|---|---|
| Texto de los documentos | [`markdown/`](markdown/) — organizado por entregable |
| Diagramas UML | [`uml/`](uml/) — fuentes `.puml` y sus `.svg` |
| Mockups y prototipo | [`mockups/`](mockups/) — exportaciones, marca y código |
| Esquema de base de datos | [`markdown/04-Modelo-de-Base-de-Datos/`](markdown/04-Modelo-de-Base-de-Datos/) — `esquema.sql` y sus pruebas |

Los PDF **no se editan a mano**: se generan desde `markdown/` con

```bash
./build/construir.sh
```

Requiere `pandoc` y `typst`.
