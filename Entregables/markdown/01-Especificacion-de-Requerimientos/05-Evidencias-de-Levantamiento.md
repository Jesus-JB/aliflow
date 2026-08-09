## 9. Evidencias del levantamiento de requerimientos

### 9.1 Técnicas utilizadas

| Técnica | Cómo se aplicó | Evidencia en el repositorio |
|---|---|---|
| **Entrevistas con el cliente** | Tres sesiones de trabajo, documentadas en actas de reunión. | Actas de reunión del proyecto |
| **Análisis de documentos** | Revisión del flujo funcional original y del marco de negocio, de donde salen las referencias `est-n`, `prov-n`, `op-n` de cada caso de uso. | `../../Flujos-Aliflow-Revision.html` |
| **Prototipado evolutivo** | Prototipo de alta fidelidad e interactivo con los cuatro roles compartiendo estado, usado como instrumento de validación con el cliente, no solo como entregable. | https://jesus-jb.github.io/aliflow/ · `mockups/` |
| **Investigación técnica y prueba de concepto** | Demo funcional con un ERP real en contenedores, con pruebas de concurrencia. Produjo un hallazgo que cambió el diseño. | `../../demo-odoo/`, `../../Hallazgos-Ingenieria-API-Generica.md` |
| **Registro de decisiones y control de cambios** | Bitácora de qué se decidió y qué cambió en el diseño como consecuencia, usada para preparar cada reunión con el cliente. | Repositorio del proyecto |
| **Análisis de riesgos** | Matriz de 23 riesgos con probabilidad, impacto y estrategia. Varios requerimientos de este documento se derivan de un riesgo identificado. | `06-Gestion-de-Riesgos.md` |
| **Modelado UML como herramienta de descubrimiento** | Diagramar reveló vacíos que la conversación no había expuesto —orden multi-local no prevenida, ausencia de estado para orden no retirada, ausencia de auditoría—, corregidos como requerimientos. | `../../uml/` |

: Técnicas de levantamiento empleadas

### 9.2 Resultados del levantamiento

El uso combinado de estas técnicas produjo tres resultados que el solo relevamiento por entrevista no habría dado:

1. **Se detectó una contradicción entre dos documentos del cliente** sobre la validez tributaria del comprobante. Al contrastarlos se determinó el modelo correcto, recogido en RN-09 y RNF-E-01: Aliflow emite comprobantes internos y la factura la emite el ERP del establecimiento.
2. **Se identificó que el inventario compartido no admite una solución por sincronización.** Dos sistemas escribiendo el mismo contador sin transacción común dejan siempre una ventana de error. De ahí surge el inventario reservado (RN-02, RF-16).
3. **Se verificó empíricamente que el control de concurrencia no puede delegarse en el ERP externo.** La prueba contra un ERP real bajo concurrencia falló, lo que fijó RN-11 y RF-21.

También se detectó una **ambigüedad terminológica** en la palabra "cartilla", que admite dos productos distintos —tarjeta de sellos y paquete prepago de almuerzos—. Se resolvió con el cliente antes de modelar el módulo, y el glosario la fija explícitamente.
