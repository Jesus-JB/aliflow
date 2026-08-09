> **Entregable 01.d · rúbrica: Evidencias de uso de técnicas de levantamiento y metodologías (3 pts)**
> Parte del documento de especificación de requerimientos. Se ensambla en el PDF único con `construir-pdf.sh` — ver [`../../README.md`](../../README.md).

## 10. Evidencias del levantamiento de requerimientos

*(Entregable 01.d — evidencias de técnicas de levantamiento y metodologías seguidas.)*

### 10.1 Técnicas utilizadas

| Técnica | Cómo se aplicó | Evidencia en el repositorio |
|---|---|---|
| **Entrevistas / reuniones con el cliente** | Tres sesiones con el Grupo de Negocios: 25-jun, 28-jul y 30-jul de 2026. | `Acta Reunión Aliflow 3.pdf`, `ACTA DE REUNIÓN ALIFLOW 30 JULIO.pdf` |
| **Análisis de documentos** | Revisión del flujo funcional original y del marco de negocio, de donde salen las referencias `est-n`, `prov-n`, `op-n` de cada caso de uso. | `../../Flujos-Aliflow-Revision.html` |
| **Prototipado evolutivo** | Prototipo de alta fidelidad e interactivo con los cuatro roles compartiendo estado, usado como instrumento de validación con el cliente, no solo como entregable. | https://jesus-jb.github.io/aliflow/ · `mockups/` |
| **Investigación técnica y prueba de concepto** | Demo funcional con un ERP real en contenedores, con pruebas de concurrencia. Produjo un hallazgo que cambió el diseño. | `../../demo-odoo/`, `../../Hallazgos-Ingenieria-API-Generica.md` |
| **Registro de decisiones y control de cambios** | Documento vivo que lleva la cuenta de qué está cerrado, qué sigue abierto y qué cambió en el diseño como consecuencia. Usado como material de preparación de cada reunión. | `../../Decisiones-Pendientes-Negocios.md` |
| **Análisis de riesgos** | Matriz de 23 riesgos con probabilidad, impacto y estrategia, revisada tras cada reunión. Varios requerimientos de este documento nacieron de un riesgo. | `06-Gestion-de-Riesgos.md` |
| **Modelado UML como herramienta de descubrimiento** | Diagramar reveló vacíos que la conversación no había expuesto —orden multi-local no prevenida, ausencia de estado para orden no retirada, ausencia de auditoría—, corregidos como requerimientos. | `../../uml/` |

### 10.2 Hallazgos del levantamiento que cambiaron el producto

No todo salió de preguntar. Estos tres salieron de analizar lo que se respondía:

1. **Contradicción sobre el comprobante tributario.** El acta del 25-jun y el flujo funcional decían cosas opuestas sobre el mismo punto. Tomado literalmente, el acta convertía a Aliflow en el emisor fiscal de cada almuerzo —es decir, en el vendedor del almuerzo, no el local—. Se llevó a Negocios y se cerró a favor del modelo correcto (RN-09, RNF-E-01).
2. **El inventario compartido no tenía solución de sincronización.** Dos sistemas escribiendo el mismo contador sin transacción común: sincronizar más seguido achica la ventana de error, no la cierra. Se llevó como problema, y Negocios respondió con el inventario reservado, que convierte un problema de consistencia distribuida en uno de partición de recursos (RN-02, RF-16).
3. **La concurrencia no se puede delegar en el ERP.** Se intentó, empíricamente, y falló: 5 hilos comprando con 3 unidades de stock vendieron 5. El resultado se documentó como hallazgo de arquitectura y se convirtió en RN-11 y RF-21.

### 10.3 Ambigüedad detectada y resuelta: la palabra "cartilla"

Un documento de requerimientos no oficial elaborado por otro equipo del curso usa "cartilla" con un significado **distinto** al de este documento: allí es un **paquete prepago de almuerzos** (comprar 5, 10, 15 o 20 y consumirlos), aquí es una **tarjeta de sellos de fidelidad**. Dos productos diferentes con el mismo nombre, sobre la misma palabra dicha por el cliente.

Se detectó comparando ambos documentos y se llevó a Negocios como pregunta explícita. ✅ **Resuelta el 8-ago-2026: es la tarjeta de sellos.** El módulo F estaba modelando el producto correcto.

Vale registrarlo como evidencia de método: la ambigüedad no la produjo una falta de información, sino un término que **las dos partes creían entender**. Solo apareció al contrastar dos interpretaciones independientes del mismo requisito.

---
