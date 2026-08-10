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
| 1 | Producto | Aliflow es una plataforma **multi-tenant**: cada local opera como un tenant independiente, con su menú, su personal y su propio ERP. **No es** un ERP, ni un emisor de facturas electrónicas, ni un punto de venta: **no reemplaza la caja del local, convive con ella** | Sección 1.2 |
| 2 | Roles | El sistema opera con **cuatro roles primarios** —Estudiante, Operador, Proveedor y Super-Admin—. El **Estudiante entra con su cuenta institucional**; los demás, con credenciales propias de su rol | Sección 3, RF-01, RF-03 |
| 3 | Roles | Un local puede tener **varias cuentas de Proveedor y de Operador**, y cada una **solo ve datos de su propio local**. Únicamente el Super-Admin tiene visibilidad sobre todos, da de alta locales y brinda soporte | RF-04, RN-07, RF-43 a RF-46 |
| 4 | Menú y cupo | Cada local aparta un **cupo reservado exclusivo para Aliflow** y la venta se valida contra ese cupo, **no contra el stock del ERP**. Al estudiante no se le muestra la cantidad, solo si el plato está disponible o agotado | RN-02, RN-15 |
| 5 | Menú y cupo | **Una orden pertenece a un solo local:** no se mezclan platos de establecimientos distintos en una misma compra | RN-01 |
| 6 | Menú y cupo | En su panel, el **Proveedor** administra menú y cupo, y consulta métricas, estado de sincronización con su ERP y el detalle de cada venta para re-emitir la factura | RF-38 a RF-42 |
| 7 | Dinero | El **saldo es por establecimiento**: se recarga para un local y solo se gasta ahí, sin transferencias entre locales | RN-13 |
| 8 | Dinero | **Aliflow no recibe ni custodia fondos**: el dinero va de la pasarela directo a la cuenta del proveedor. En consecuencia, **cada local necesita su propia cuenta de comercio**, y el que no pueda abrirla no puede vender por Aliflow | RN-14, R-22 |
| 9 | Dinero | Aliflow emite **comprobantes internos sin validez tributaria** —la factura fiscal la emite el ERP del local— y **nunca almacena el número completo de una tarjeta** ni su código de seguridad | RN-09, RN-06 |
| 10 | Retiro | El **código de retiro** es numérico de 6 dígitos, se dicta de viva voz y vale **solo el día de la compra**. El Operador lo valida y marca la entrega física; la orden no retirada ese día queda expirada | RN-03, RN-04, RF-25, RF-26, RF-29 |
| 11 | Fidelidad | La **cartilla** es una tarjeta de sellos por local, con sello al retirar —máximo uno por día— y premio cobrado como **descuento del 100%**. Horarios, cupos, sellos y premios son **configuración de cada local**, no constantes | RN-08, RN-12, RN-05 |
| 12 | ERP | Aliflow se integra con el ERP de cada local por una **interfaz única y bidireccional**: lee menú e inventario y le devuelve las ventas y los pagos. Incorporar un ERP distinto es **agregar un adaptador**; el piloto integra dos locales | RF-47 a RF-50, RNF-O-12 |
| 13 | ERP | La integración se construye y se demuestra **contra un ERP simulado**, de modo que no queda supeditada a que un tercero entregue credenciales | RF-52 |
| 14 | Auditoría | Toda operación que **mueve dinero o cambia el estado de una orden queda registrada** con actor, acción y marca de tiempo, y el histórico no se borra | RN-10, RF-56 |
| 15 | Documento | Los **requerimientos no funcionales** son los de la sección 6, clasificados según Sommerville y con criterio de validación; el **prototipo** del Apéndice A es el que se validó; y el **alcance excluido** es el de la sección 7 — lo que no está en el documento no forma parte del sistema | Secciones 6 y 7, Apéndice A |

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

### 5. Firmas

Las firmas de ambas partes van en esta misma página. Una hoja de firmas separada del documento no acredita nada.

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
