# Documentación de Diagramas de Estado — Aliflow

Cuatro diagramas de estado, para los objetos del sistema con un ciclo de vida real (más de un estado posible y transiciones con condiciones). Misma convención visual que el resto del proyecto: fondo amarillo = propuesta de Ingeniería sin validar con Negocios.

---

## 1. Orden

![Estado: Orden](estado-orden.svg)

**Fuente:** `estado-orden.puml` · **Referencia:** UC4/UC5, `uml/diagrama-clases.puml`.

`COMPRADO → ENTREGADO` es el camino confirmado del flujo original. `COMPRADO → EXPIRADO` es la propuesta de Ingeniería (ya existía como valor del enum desde el diagrama de clases, pero sin ninguna regla concreta). En esta revisión se propuso un mecanismo específico: la Orden expira cuando se cumple `CodigoRetiro.fechaExpiracion` sin que se haya usado — antes esto era solo "hay que definir la regla", ahora es una propuesta concreta que el equipo puede aceptar o corregir rápido.

## 2. CodigoRetiro

![Estado: CodigoRetiro](estado-codigo-retiro.svg)

**Fuente:** `estado-codigo-retiro.puml` · **Referencia:** UC5, `uml/secuencia-retiro-entrega.puml`.

`Vigente → Usado` es la transición atómica y condicional (`UPDATE ... WHERE usado=false`) que resuelve el riesgo R-14 (doble redención, detectado en la revisión anterior). `Vigente → Expirado` es la misma propuesta que dispara la expiración de la `Orden` asociada — son dos objetos, pero una sola regla de negocio.

**Formato del código, cerrado el 28-jul-2026:** Negocios eligió un **código numérico corto de 6 dígitos** en vez de la propuesta anterior (UUID firmado), porque el estudiante se lo dice de viva voz al Operador y este lo digita. El cambio no toca la máquina de estados, pero sí trae dos consecuencias de diseño que quedaron anotadas en el diagrama:

1. **Unicidad acotada, no global.** Seis dígitos son ~1 millón de combinaciones: alcanzan de sobra si la unicidad se exige solo entre los códigos **Vigentes de un mismo local**, pero no si se pretende que sean únicos históricamente. La generación reintenta ante colisión.
2. **Espacio de búsqueda pequeño.** Un código de 6 dígitos es adivinable por fuerza bruta de una forma que un UUID no lo era. Se registró como riesgo **R-15** (`Gestion-de-Riesgos.md`), con la mitigación correspondiente.

## 3. Pago

![Estado: Pago](estado-pago.svg)

**Fuente:** `estado-pago.puml` · **Referencia:** UC2, `uml/secuencia-recarga-saldo.puml`.

Simple pero real: `PENDIENTE` no es solo un estado transitorio instantáneo — puede persistir si la pasarela de pagos responde de forma asíncrona (riesgo R-06, `Gestion-de-Riesgos.md`). Solo `APROBADO` genera una `Recarga`.

## 4. EventoSincronizacion

![Estado: EventoSincronizacion](estado-evento-sincronizacion.svg)

**Fuente:** `estado-evento-sincronizacion.puml` · **Referencia:** `Hallazgos-Ingenieria-API-Generica.md` sección 3.4.

El auto-loop en `PENDIENTE` (reintento con backoff) y la transición a `FALLIDO` tras agotar intentos son exactamente el comportamiento ya mostrado en el diagrama de secuencia y en el diagrama de objetos con el caso real de Alpwin en Caramel Coffee — este diagrama es la vista de ciclo de vida del mismo mecanismo.

---

## Por qué estos 4 y no otros

`Estudiante`, `Proveedor`, `Plato` no tienen un ciclo de vida con estados discretos más allá de `activo`/`inactivo` (una sola transición booleana, no justifica un diagrama). `SaldoProveedor` y `TarjetaVirtual` cambian de valor (monto) pero no de "estado" en el sentido UML. Se priorizaron los objetos cuyo estado determina qué operaciones son válidas en cada momento — que es exactamente el criterio que pide la rúbrica ("objetos pertinentes").
