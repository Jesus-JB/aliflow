# Apéndice B · Acta de conformidad

## Acta de conformidad con la especificación de requerimientos

| | |
|---|---|
| **Proyecto** | Aliflow — plataforma para pedir y pagar el almuerzo dentro del campus de la UEES |
| **Documento sobre el que se declara conformidad** | *Documento de Especificación de Requerimientos del Sistema de Software* |
| **Versión** | 1.0, emitida el 9 de agosto de 2026 |
| **Ejemplar de referencia** | https://github.com/Jesus-JB/aliflow — carpeta `Entregables/Documento Oficial/` |

: Identificación del documento sobre el que se declara conformidad

---

### 1. Objeto

Dejar constancia de que el representante del cliente revisó la especificación de requerimientos identificada arriba y manifiesta su conformidad con el alcance funcional y no funcional descrito en ella, en los términos de las secciones 2 a 4 de esta acta.

### 2. Alcance sobre el que se declara conformidad

| # | Ámbito | Punto | Referencia |
|---|-----------|-------------------------------------------------------|------------|
| 1 | Producto | Aliflow es una plataforma **multi-tenant**: cada local opera como un tenant independiente, con su propio menú, su propio personal y su propio sistema ERP | §1.2 |
| 2 | Producto | **Aliflow no es** un ERP, ni un emisor de facturas electrónicas, ni un punto de venta. **No reemplaza la caja del local: convive con ella** | §1.2 |
| 3 | Roles | El sistema opera con **cuatro roles primarios**: Estudiante, Operador, Proveedor y Super-Admin de Aliflow | §3 |
| 4 | Roles | El **Estudiante se autentica exclusivamente con su cuenta institucional**; Proveedor, Operador y Super-Admin lo hacen con credenciales propias de su rol | RF-01, RF-03 |
| 5 | Roles | Un local puede tener **varias cuentas de Proveedor y varias de Operador** simultáneamente activas | RF-04 |
| 6 | Roles | Cada Proveedor y cada Operador **solo ve y opera datos de su propio local**; únicamente el Super-Admin tiene visibilidad sobre todos | RN-07 |
| 7 | Roles | El **Super-Admin** da de alta locales nuevos, los activa o desactiva, brinda soporte y monitorea el estado de todas las integraciones | RF-43 a RF-46 |
| 8 | Menú y cupo | Cada local aparta un **cupo reservado exclusivo para Aliflow**, y la venta se valida contra ese cupo y no contra el stock del ERP | RN-02 |
| 9 | Menú y cupo | Al estudiante **no se le muestra la cantidad de unidades disponibles**, solo si el plato está disponible o agotado | RN-15 |
| 10 | Menú y cupo | **Una orden pertenece a un solo local:** no se mezclan platos de establecimientos distintos en una misma compra | RN-01 |
| 11 | Menú y cupo | En su panel, el **Proveedor** administra menú y cupo, y consulta métricas, estado de sincronización con su ERP y el detalle de cada venta para re-emitir la factura | RF-38 a RF-42 |
| 12 | Dinero | El **saldo es por establecimiento**: se recarga para un local y solo se gasta ahí, sin transferencias entre locales | RN-13 |
| 13 | Dinero | **Aliflow no recibe ni custodia fondos.** El dinero de cada recarga va de la pasarela directo a la cuenta del proveedor destino | RN-14 |
| 14 | Dinero | Como consecuencia de lo anterior, **cada local necesita su propia cuenta de comercio** en la pasarela. Un local que no pueda abrirla no puede vender por Aliflow | RN-14, R-22 |
| 15 | Dinero | Aliflow emite **comprobantes internos sin validez tributaria**; la factura fiscal la emite el ERP del local | RN-09 |
| 16 | Dinero | Aliflow **nunca almacena el número completo de una tarjeta** ni su código de seguridad | RN-06 |
| 17 | Retiro | El **código de retiro** es numérico de 6 dígitos, se dicta de viva voz y vale únicamente el día de la compra | RN-03, RN-04 |
| 18 | Retiro | El **Operador valida el código y marca la entrega física** en el punto de entrega del local. La orden no retirada ese día queda expirada | RF-25, RF-26, RF-29 |
| 19 | Fidelidad | La **cartilla** es una tarjeta de sellos por local, con sello al retirar —máximo uno por día— y premio cobrado como descuento del 100% | RN-08, RN-12 |
| 20 | Fidelidad | Los **horarios, cupos, cantidad de sellos y premios son configuración de cada local**, no constantes del sistema | RN-05 |
| 21 | ERP | Aliflow se integra con el ERP de cada local por una **interfaz única y bidireccional**: lee menú e inventario, y le devuelve las ventas y los pagos | RF-47, RF-49, RF-50 |
| 22 | ERP | Incorporar un local con un ERP distinto es **agregar un adaptador**, sin cambios al resto del sistema. El piloto integra dos locales | RF-48, RNF-O-12 |
| 23 | ERP | La integración se construye y se demuestra **contra un ERP simulado**, de modo que no queda supeditada a que un tercero entregue credenciales | RF-52 |
| 24 | Auditoría | Toda operación que **mueve dinero o cambia el estado de una orden queda registrada** con actor, acción y marca de tiempo, y el histórico no se borra | RN-10, RF-56 |
| 25 | Documento | Los **requerimientos no funcionales** son los declarados en §6, clasificados según Sommerville y con su criterio de validación | §6 |
| 26 | Documento | El **prototipo de alta fidelidad** del Apéndice A es el que se validó con el cliente y refleja el alcance aprobado | Apéndice A |
| 27 | Documento | El **alcance excluido** de la versión 1 es el declarado en §7, y lo que no está en el documento no forma parte del sistema | §7 |

: Alcance sobre el que se declara conformidad

### 3. Puntos que quedan expresamente abiertos

El cliente reconoce que las siguientes decisiones **siguen sin resolverse** y que su definición posterior puede requerir control de cambios y reestimación:

1. **Política del saldo que ya no puede gastarse:** órdenes vencidas sin retirar, saldo remanente de un estudiante que se gradúa y saldo en un local que sale de la plataforma. Al no custodiar fondos, Aliflow no puede devolver dinero; la salida posible es reacreditar saldo en ese mismo local, y es obligación del proveedor.
2. **Modelo de cobro de Aliflow al proveedor.**
3. **Selección de la pasarela de pagos**, y confirmación de que cada local puede abrir su propia cuenta de comercio en ella (punto 9 del alcance).
4. **Cuántos sellos requiere la cartilla y en qué consiste el premio.**
5. **Carga concurrente esperada en hora pico**, necesaria para fijar la cifra del requerimiento de rendimiento.

Ninguno de estos puntos impide construir lo aprobado en la sección 2: los cuatro primeros están modelados como configuración o quedan fuera de la versión 1, y el quinto fija un número, no un diseño.

### 4. Declaración

1. El **representante del cliente** declara que revisó el documento identificado en el encabezado, que su contenido recoge fielmente lo acordado en las sesiones de levantamiento de requerimientos, y que presta su conformidad con el alcance descrito en la sección 2 de esta acta.
2. El representante del cliente declara asimismo que **conoce y acepta los puntos abiertos** enumerados en la sección 3, y que su resolución posterior se tramitará por control de cambios.
3. El **equipo de desarrollo** declara que el documento refleja los requerimientos levantados y validados con el cliente, y que la construcción se realizará contra esa especificación.
4. Ambas partes acuerdan que **toda modificación posterior del alcance se tramita por control de cambios**, quedando registrada en el repositorio del proyecto junto con su motivo y su impacto. Esta acta ampara la versión del documento identificada en el encabezado y ninguna otra.

```{=typst}
#pagebreak(weak: true)
```

### 5. Firmas

Las firmas de ambas partes van en esta misma página. Una hoja de firmas separada del documento no acredita nada.

```{=typst}
#v(1.2em)
#block(breakable: false)[
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
  #text(size: 8.5pt, style: "italic")[Lugar y fecha: #box(width: 6cm, line(length: 100%, stroke: 0.4pt))]
]
]

#v(1.8em)
#block(breakable: false)[
#align(center)[
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
