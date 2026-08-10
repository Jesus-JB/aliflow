# Apéndice B · Acta de conformidad

## Acta de conformidad con la especificación de requerimientos

| | |
|---|---|
| **Proyecto** | Aliflow — plataforma web multi-tenant para pedido anticipado, pago, operación, retiro y fidelización de almuerzos dentro del campus de la UEES, integrada con los sistemas de cada proveedor |
| **Documento sobre el que se declara conformidad** | *Documento de Especificación de Requerimientos del Sistema de Software*, con las precisiones y condiciones de aceptación establecidas en esta acta |
| **Versión** | 1.2 — respuesta del equipo de desarrollo a la revisión 1.1 propuesta por el cliente sobre la versión 1.0 |
| **Ejemplar de referencia** | https://github.com/Jesus-JB/aliflow — carpeta `Entregables/Documento Oficial/`. Al momento de la firma se consigna el commit exacto: `________________________` |

: Identificación del documento sobre el que se declara conformidad

En esta acta, **versión 1** y **MVP** designan lo mismo: el alcance de la primera entrega en operación.

---

### 1. Objeto

Dejar constancia de que el representante del cliente revisó la especificación de requerimientos identificada arriba y presta su conformidad con el alcance de la sección 2, **como línea base para la construcción**.

Esta firma **no constituye recepción ni aceptación final del software**. La aceptación final se produce después, mediante pruebas de aceptación de usuario (UAT) contra los criterios definidos en esta acta, y se formaliza en un acta de recepción distinta.

### 2. Alcance de la línea base

| # | Ámbito | Punto y condición de aceptación | Referencia |
|---|-----------|---------------------------------------------------------|------------|
| 1 | Producto | Aliflow es una plataforma **multi-tenant**: cada local opera como un tenant independiente, con su menú, su personal y su propio ERP. **No sustituye** al ERP, a la caja o punto de venta, ni actúa como emisor tributario: convive con ellos e intercambia información. La versión 1 demuestra el ciclo completo, de la publicación del menú a la compra, el retiro y su trazabilidad | Sección 1.2 |
| 2 | Roles | Cuatro roles primarios —Estudiante, Operador, Proveedor y Super-Admin—. El **Estudiante accede con su cuenta institucional**; los demás, con credenciales propias de su rol. Las capacidades y restricciones de cada rol quedan documentadas y son verificables en UAT | Sección 3, RF-01, RF-03 |
| 3 | Roles | Un local puede tener **varias cuentas de Proveedor y de Operador**, y cada una **solo consulta y opera datos de su propio local**. Únicamente el Super-Admin tiene visibilidad transversal, da de alta locales y brinda soporte. La aceptación exige pruebas de aislamiento entre tenants y de rechazo de accesos no autorizados | RF-04, RN-07, RF-43 a RF-46 |
| 4 | Menú, stock y cupo | **Doble control de disponibilidad.** Aliflow sincroniza menú y stock desde el ERP del proveedor, y el Proveedor define además un **cupo reservado** para Aliflow. La disponibilidad vendible **nunca excede ni el stock sincronizado ni el cupo remanente**. El cupo complementa la sincronización, no la sustituye. El descuento transaccional se realiza sobre el cupo, en la base de datos de Aliflow | RN-02, RF-51 |
| 5 | Menú, stock y cupo | La sincronización opera por **consulta periódica**, con el intervalo acordado por ERP en el anexo técnico de la sección 4. Aliflow deja implementado el punto de entrada para **notificación por eventos (webhook)**, de modo que un ERP que la documente pueda usarla sin rediseño. Ningún ERP del alcance actual la ofrece | RF-51, RF-47 |
| 6 | Menú, stock y cupo | Si el stock sincronizado supera el umbral de antigüedad acordado, la venta se valida **contra el cupo remanente** y el panel señala el estado de la sincronización. Un fallo de integración no interrumpe la venta. Al estudiante no se le muestra la cantidad de unidades, solo si el plato está disponible o agotado | RN-15, RF-51 |
| 7 | Menú y compra | **Una orden pertenece a un solo local:** no se mezclan platos de establecimientos distintos en una misma compra, y la disponibilidad y el saldo aplicables corresponden al mismo tenant | RN-01, RN-13 |
| 8 | Panel del Proveedor | El Proveedor administra menú, cupo y horario máximo de retiro, y consulta estado de sincronización, pedidos y detalle de ventas, incluidas las métricas de ventas, ingresos, platos más vendidos y costo de los premios de fidelidad | RF-38 a RF-42 |
| 9 | Dinero y saldo | El **saldo es por establecimiento**: se recarga para un local y solo se gasta ahí, sin transferencias entre locales en la versión 1 | RN-13 |
| 10 | Dinero y pasarela | **Aliflow no recibe ni custodia fondos**: el pago se procesa por la pasarela y se acredita directamente al comercio del proveedor correspondiente. Cada local debe contar con una cuenta de comercio en una pasarela soportada. La versión 1 integra **una pasarela**, mediante una capa de integración que no impide incorporar otras | RN-14, R-22 |
| 11 | Comprobantes | Aliflow emite **comprobantes internos sin validez tributaria**; la factura fiscal corresponde al ERP del proveedor. El pedido conserva **vínculo trazable con el identificador de la factura** cuando el ERP lo devuelve. Aliflow **nunca almacena el número completo de una tarjeta** ni su código de seguridad: la tokenización corresponde a la pasarela | RN-09, RN-06 |
| 12 | Retiro y estados | El mecanismo de retiro de la versión 1 es un **código numérico de 6 dígitos**, válido hasta la hora máxima de retiro configurada del mismo día. El Operador lo valida y registra la entrega física en una pantalla optimizada para atención rápida. Los estados de la orden son **Comprado, Entregado y Expirado** | RN-03, RN-04, RF-25, RF-26, RF-29 |
| 13 | Fidelidad | La **cartilla** es por local y el sello se acredita al retiro. Cantidad de sellos, vigencia y premio son **parámetros configurables por local**: modificarlos no constituye cambio de software ni ampliación de alcance. El premio puede ser un descuento del 100% si el proveedor así lo configura | RN-08, RN-12, RN-05 |
| 14 | ERP | Aliflow se integra con los ERP mediante una **interfaz canónica y adaptadores por sistema**, bidireccional en la medida en que cada ERP lo permita: consulta menú y stock, y registra o concilia ventas y pagos. Los dos locales y ERP del piloto, su mapeo de datos y sus criterios de aceptación se identifican en el anexo técnico de la sección 4 | RF-47 a RF-50, RNF-O-12 |
| 15 | ERP y pruebas | El **ERP simulado** se usa para desarrollo, pruebas automáticas y demostración temprana. La aceptación de cada integración se realiza **contra el ERP real o su ambiente de prueba**, en las condiciones y plazos de la sección 4 | RF-52 |
| 16 | Auditoría | Toda operación que **mueve dinero, afecta saldo, modifica stock o cupo, o cambia el estado de una orden** queda registrada con actor, acción, marca de tiempo y referencia de transacción. El histórico no se elimina desde los flujos ordinarios y puede consultarse para soporte y conciliación | RN-10, RF-56 |
| 17 | Rendimiento | Se mantienen como criterio **50 compras concurrentes** y **p95 ≤ 2 s** en la confirmación de compra, y **p95 ≤ 1 s** en la validación del código de retiro. La prueba de carga y su resultado constan antes de la UAT | RNF-P-07, RNF-P-08, RNF-P-10 |
| 18 | Documento y alcance | La especificación queda vinculada a la **versión y commit** consignados en la Tabla 1. El **prototipo del Apéndice A es la línea base de interfaz**, salvo las pantallas que ambas partes identifiquen expresamente como referencia visual. El **alcance excluido** es el de la sección 7 | Secciones 6 y 7, Apéndice A |

: Alcance de la línea base

#### 2.1 Criterios de aceptación transversales

- **Trazabilidad.** Cada requisito obligatorio de la versión 1 queda asociado a evidencia de prueba y a su resultado de UAT.
- **Inventario.** La sincronización con el ERP y el cupo reservado son controles **complementarios**. No se acepta una solución que dependa únicamente de carga manual ni únicamente de un cupo aislado.
- **Integración.** El simulador es auxiliar. La conformidad final de cada integración requiere pruebas contra el ambiente real o de prueba acordado, en las condiciones de la sección 4.
- **Operación.** El flujo permite gestionar la demanda y validar retiros con rapidez suficiente para no trasladar la fila de la caja al punto de entrega, medido contra el criterio de rendimiento del punto 17.
- **Calidad.** Los defectos y los incumplimientos de requisitos ya aprobados se corrigen sin tramitarse como funcionalidad nueva.
- **Recepción.** La firma de esta acta autoriza la construcción contra esta línea base. La recepción del software se formaliza después de la UAT, en un acta separada.

### 3. Alcance incremental

Las siguientes capacidades **no forman parte de la línea base** y quedan disponibles para incorporarse por control de cambios, con la estimación indicada. Se listan aquí, y no en la sección de alcance excluido, porque ambas partes las consideran deseables y el diseño actual las admite sin rediseño.

| Capacidad | Qué agrega | Estimación |
|---|---|---|
| **Estados de preparación** | Estados *En preparación* y *Listo* entre Comprado y Entregado, con la pantalla para que el local los marque y el aviso correspondiente al estudiante | 13 puntos |
| **Tablero ampliado y exportación** | Comportamiento por hora o franja, pedidos retirados y expirados, incidencias de stock, conciliación básica, y exportación del reporte operativo en formato reutilizable | 18 puntos |
| **Pasarelas adicionales** | Segundo adaptador de pasarela sobre la capa de integración ya prevista, con su certificación y sus pruebas | 13 puntos |
| **Entrega de la factura fiscal** | Obtención del documento fiscal desde el ERP y su puesta a disposición del estudiante. Sujeta a que cada ERP exponga el documento y no solo su identificador | 8 puntos |
| **Exportación del histórico de auditoría** | Exportación del registro de auditoría para conciliación externa | 3 puntos |
| **Franjas operativas** | Configuración de franjas de atención por local, además del horario máximo de retiro | 5 puntos |

: Alcance incremental disponible por control de cambios

Referencia de esfuerzo: la construcción de la línea base se planifica en seis sprints de dos semanas y 228 puntos. Los 60 puntos de esta tabla equivalen a unas tres semanas adicionales de trabajo del equipo completo.

### 4. Compromisos del cliente y aceptación de las integraciones

La aceptación de cada integración con un ERP requiere insumos que el equipo de desarrollo no puede producir. Ambas partes acuerdan lo siguiente.

1. **Anexo técnico.** Antes del inicio del sprint de integración, el cliente entrega un anexo que identifica los dos locales y ERP del piloto, el mapeo de datos de cada uno, el intervalo de sincronización acordado por ERP con su umbral de antigüedad, y las credenciales o el ambiente de prueba correspondiente.

   Fecha comprometida de entrega del anexo: `________________________`

2. **Aceptación con ambiente real.** Cuando el ERP disponga de ambiente real o de prueba en la fecha comprometida, la aceptación de ese adaptador se realiza contra él, de extremo a extremo.

3. **Aceptación en ausencia del ambiente.** Si en la fecha comprometida no se dispone del ambiente por causa ajena al equipo de desarrollo, la aceptación de **ese adaptador** se realiza contra el ERP simulado, se deja constancia del pendiente, y **no se bloquea la aceptación del resto del sistema**. La integración real queda como hito posterior, sin cargo de incumplimiento para ninguna de las partes.

4. **Alpwin.** Se deja constancia de que Alpwin **no dispone de API pública ni de ambiente de prueba oficial**. Su integración se realiza por la vía alternativa que se acuerde en el anexo técnico, y sus criterios de aceptación se definen allí.

### 5. Puntos que quedan abiertos

El cliente reconoce que las siguientes decisiones siguen sin resolverse. Su definición posterior no constituye por sí misma un cambio de alcance cuando completa una funcionalidad ya incluida en la línea base; el esfuerzo de implementación se estima al quedar tomada la decisión, y se tramita por control de cambios si excede lo previsto para esa funcionalidad.

| # | Punto abierto | Hito de cierre |
|---|-------------------------------------|------------------------|
| 1 | **Política de saldo, expiración y devolución:** órdenes vencidas sin retirar, saldo remanente de un estudiante que egresa, y salida de un local de la plataforma. Se evalúa la capacidad de reembolso de la pasarela y la política del proveedor, además de la reacreditación de saldo | Antes de la UAT del módulo de pagos |
| 2 | **Modelo de cobro de Aliflow al proveedor.** Automatizar comisiones, retenciones o facturación propia de Aliflow constituye capacidad nueva y se evalúa por separado | Puede permanecer abierto |
| 3 | **Selección de la pasarela de pagos.** Integrar una pasarela aprobada forma parte de la línea base; elegir cuál no constituye ampliación | Antes del sprint de pagos |
| 4 | **Parámetros de fidelidad:** cantidad de sellos, vigencia y premio. Se resuelven como configuración por local dentro de la funcionalidad ya aprobada | Antes de la puesta en operación |
| 5 | **Carga de la hora pico.** Se mantiene como piso el criterio del punto 17. Si el levantamiento de la hora pico de la UEES arroja una cifra mayor, se ajusta el criterio | Antes de la prueba de carga |
| 6 | **Locales y ERP del piloto.** Se cierran con el anexo técnico de la sección 4 | Según la fecha de la sección 4 |

: Puntos abiertos y su hito de cierre

Estos puntos no impiden avanzar con los componentes independientes. Cuando un punto abierto afecte directamente a pagos, facturación o a una integración concreta, ese módulo no se considera aceptado hasta que la decisión conste por escrito.

### 6. Declaración

1. El **representante del cliente** declara que revisó el documento identificado en el encabezado y presta su conformidad con el alcance de la sección 2, como línea base para la construcción.
2. El representante del cliente **conoce los puntos abiertos** de la sección 5 y acepta cerrarlos en los hitos indicados. Asume asimismo los compromisos de la sección 4.
3. El **equipo de desarrollo** declara que la construcción, las pruebas y la demostración se realizan contra esta especificación y sus criterios de aceptación, manteniendo trazabilidad entre requerimiento, implementación y evidencia de prueba.
4. **Los defectos y los incumplimientos de requisitos ya aprobados no constituyen ampliación de alcance** y se corrigen sin control de cambios. Se entiende por omisión de documentación aquello que está implícito en un requerimiento aprobado; lo que no se deriva de un requerimiento aprobado constituye capacidad nueva.
5. Existe **cambio de alcance** cuando se solicita una capacidad no contemplada en esta línea base. Se tramita por control de cambios, con registro de motivo, impacto, esfuerzo y aprobación de ambas partes. Las capacidades de la sección 3 ya tienen estimación acordada.
6. Esta acta ampara únicamente la versión y el commit identificados en la Tabla 1.
7. La firma de esta acta **no acredita entrega ni recepción del aplicativo**. La conformidad final requiere UAT satisfactoria y un acta de recepción posterior.

### 7. Firmas

Las firmas de ambas partes constan en esta misma versión del documento, junto con el commit de la línea base consignado en la Tabla 1.

```{=typst}
// Un solo bloque indivisible: las dos firmas nunca pueden quedar en páginas
// distintas, pase lo que pase con la paginación del documento que las contiene.
#block(breakable: false)[
  #v(1.2em)
  #align(center)[
    #text(weight: "bold", size: 10pt)[Por el equipo de desarrollo]
    #v(2.6em)
    #grid(
      columns: (1fr, 1fr, 1fr),
      column-gutter: 1.4em,
      row-gutter: 0.35em,
      line(length: 100%, stroke: 0.5pt),
      line(length: 100%, stroke: 0.5pt),
      line(length: 100%, stroke: 0.5pt),
      text(weight: "bold", size: 10pt)[Jesus Jimenez],
      text(weight: "bold", size: 10pt)[Yull Bazurto],
      text(weight: "bold", size: 10pt)[Antonio Adrian],
      text(size: 8.5pt)[Líder de proyecto],
      text(size: 8.5pt)[Analista de requerimientos],
      text(size: 8.5pt)[Diseño de experiencia y datos],
    )
    #v(1.2em)
    #text(size: 9pt)[Samborondón, Guayas, 9 de agosto de 2026]

    #v(1.8em)
    #text(weight: "bold", size: 10pt)[Por el cliente]
    #v(0.6em)
    #block(width: 78%)[
      #table(
        columns: (auto, 1fr),
        stroke: none,
        inset: (x: 0pt, y: 7pt),
        text(size: 10pt)[Nombre:], table.cell(stroke: (bottom: 0.5pt))[],
        text(size: 10pt)[Cargo:], table.cell(stroke: (bottom: 0.5pt))[],
        text(size: 10pt)[Lugar y fecha:], table.cell(stroke: (bottom: 0.5pt))[],
        text(size: 10pt)[Firma:], table.cell(stroke: (bottom: 0.5pt))[#v(2.2em)],
      )
    ]
  ]
]
```
