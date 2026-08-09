> **Entregable 01.e · acta de conformidad firmada por el representante del cliente**
> Va como apéndice del documento de especificación de requerimientos. Se ensambla en el PDF único con `construir-pdf.sh` — ver [`../README.md`](../README.md).

---

# Apéndice B · Acta de conformidad

> ⏳ **PENDIENTE DE FIRMA.** El entregable 01.e exige que este documento vaya firmado por el representante del cliente. **Es una dependencia externa con tiempo de respuesta que no controlamos: conviene pedirla ahora, no al cierre.**
>
> Abajo está el texto propuesto, listo para imprimir y firmar. Una vez firmado, se escanea y se reemplaza esta plantilla por el documento escaneado.

---

## Acta de conformidad con la especificación de requerimientos

**Proyecto:** Aliflow — plataforma para pedir y pagar el almuerzo dentro del campus de la UEES
**Documento sobre el que se declara conformidad:** *Documento de Especificación de Requerimientos del Sistema de Software*, versión del 9 de agosto de 2026
**Repositorio de referencia:** https://github.com/Jesus-JB/aliflow

---

### 1. Objeto

El representante del cliente declara haber revisado la especificación de requerimientos y manifiesta su conformidad con el alcance funcional y no funcional descrito en ella.

### 2. Alcance sobre el que se declara conformidad

| # | Punto | Referencia |
|---|---|---|
| 1 | El sistema opera con **cuatro roles primarios**: Estudiante, Operador, Proveedor y Super-Admin de Aliflow | §3 Actores |
| 2 | Cada local aparta un **cupo reservado exclusivo para Aliflow**, y la venta se valida contra ese cupo y no contra el stock del ERP | RN-02 |
| 3 | El **saldo es por establecimiento**: se recarga para un local y solo se gasta ahí. El dinero va directo a la cuenta del proveedor y Aliflow no custodia fondos | RN-13, RN-14 |
| 4 | El **código de retiro** es numérico de 6 dígitos, se dicta de viva voz y vale únicamente el día de la compra | RN-03, RN-04 |
| 5 | Aliflow emite **comprobantes internos sin validez tributaria**; la factura fiscal la emite el ERP del local | RN-09 |
| 6 | La **cartilla de fidelidad** es una tarjeta de sellos por local, con sello al retirar y premio cobrado como descuento del 100% | RN-08, RN-12 |
| 7 | Al estudiante **no se le muestra la cantidad de unidades disponibles**, solo si el plato está disponible o agotado | RN-15 |
| 8 | El alcance excluido de la versión 1 es el declarado en la sección de alcance | §8 |

### 3. Puntos que quedan expresamente abiertos

El cliente reconoce que las siguientes decisiones **siguen sin resolverse** y que su definición posterior puede requerir control de cambios y reestimación:

1. Política del saldo que ya no puede gastarse: órdenes vencidas sin retirar, saldo remanente de un estudiante que se gradúa y saldo en un local que sale de la plataforma.
2. Modelo de cobro de Aliflow al proveedor.
3. Selección de la pasarela de pagos, y confirmación de que cada local puede abrir su propia cuenta de comercio.
4. Cuántos sellos requiere la cartilla y en qué consiste el premio.

### 4. Declaración

Se deja constancia de que los elementos marcados como **propuesta de Ingeniería** en la especificación no constituyen decisiones del cliente y requieren validación posterior.

---

<div style="text-align:center">

<br><br>

_____________________________________

**Representante del cliente**

Nombre: ______________________________

Cargo: _______________________________

Fecha: _______________________________

<br><br>

_____________________________________

**Por el Grupo de Ingeniería**

Nombre: ______________________________

Fecha: _______________________________

</div>
