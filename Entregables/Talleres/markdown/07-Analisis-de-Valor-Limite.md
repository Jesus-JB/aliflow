```{=typst}
#show table.cell: set par(justify: false)
#set align(center)
#v(5cm)
```

::: {custom-style="Portada"}
```{=typst}
#text(size: 26pt, weight: "bold")[Aliflow]
#v(0.3cm)
#text(size: 16pt, weight: "bold")[Taller 07 · Análisis del valor límite]
#v(0.8cm)
```

```{=openxml}
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="1F3A5F"/><w:sz w:val="52"/></w:rPr><w:t xml:space="preserve">Aliflow</w:t></w:r></w:p><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="360"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="1F3A5F"/><w:sz w:val="32"/></w:rPr><w:t xml:space="preserve">Taller 07 · Análisis del valor límite</w:t></w:r></w:p>
```

**Universidad de Especialidades Espíritu Santo**\
Facultad de Ingenierías · Computación\
**Ingeniería de Software II** · Pruebas funcionales

**Integrantes**\
Jesus Jimenez\
Yull Bazurto\
Antonio Adrian

**Repositorio del proyecto:** https://github.com/Jesus-JB/aliflow

**Fecha:** 8 de octubre de 2026

:::

```{=typst}
#pagebreak()
#set align(left)
```

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# Objetivo y alcance

Este taller aplica el análisis del valor límite a **Aliflow**, la plataforma web del equipo para pedir y pagar el almuerzo en los locales de comida de la UEES. El estudiante recarga saldo en un local, compra con ese saldo y recibe un código de seis dígitos para retirar su pedido.

Se siguen los tres pasos del taller:

1. Identificar las variables de entrada y de salida.
2. Definir el dominio de entrada de cada variable.
3. Obtener los datos de prueba con cada variante: normal (4n + 1), robusta (6n + 1), peor caso (5ⁿ) y robusta en el peor caso (7ⁿ).

Se analizan las tres funciones del sistema donde un error en un límite tiene más costo:

| Función | Requerimientos | Por qué se eligió |
|----------------|----------------|----------------------------------------------------------------|
| **A.** Comprar un almuerzo | RF-19, RF-20, RF-12 | Mueve dinero. Un error de límite cobra de más, cobra de menos o vende sin saldo. |
| **B.** Recargar saldo en un local | RF-08, RF-09 | Es la entrada del dinero. Un monto fuera de rango no debe llegar a la pasarela de pagos. |
| **C.** Validar el código de retiro | RF-25, RF-28 | Es la puerta de la entrega. Un código mal leído entrega el almuerzo equivocado o no entrega ninguno. |

: Funciones analizadas

# Paso 1 · Variables de entrada y de salida

## Salidas críticas

Se parte de las salidas, priorizadas por riesgo. Para cada una se buscan las entradas de las que depende, sin entrar en *cómo* se calcula.

| Salida | Función | Riesgo si falla |
|------------------------------------------------|------------|----------------------------------------|
| Total cobrado y saldo posterior del local | A | Cobro incorrecto al estudiante |
| Resultado de la compra (aprobada o rechazada, con su motivo) | A | Venta sin saldo o sin cupo |
| Resultado de la recarga (aceptada o rechazada) | B | Recarga inválida enviada a la pasarela |
| Orden localizada a partir del código | C | Entrega a la persona equivocada |

: Salidas críticas priorizadas

## Clasificación de las entradas

Cada entrada se clasifica según cómo influye en la salida que se prueba. Una **ROV** (variable de sólo resultados) cambia el valor de la salida. Una **GV** (variable de puerta) decide qué camino sigue el programa. Una **SNM** no debería influir en esa salida.

| Función | Entrada | Tipo | Justificación |
|----------|--------------------------------|----------|--------------------------------------------------------|
| A | Cantidad de platos | ROV | Multiplica el precio: cambia el total, no el camino |
| A | Precio unitario del plato | ROV | Lo fija el proveedor al publicar el menú (RF-13); cambia el total |
| A | Saldo del estudiante en el local | GV | Decide si la compra se aprueba o se rechaza por saldo insuficiente |
| A | Cupo remanente del plato | GV | Decide si la compra se aprueba o se rechaza por cupo agotado |
| A | Hora de la compra | SNM | No debe alterar el total |
| A | Sellos acumulados en la cartilla | SNM | No debe alterar el total de una compra normal |
| A | Método de pago guardado | SNM | Interviene en la recarga, no en la compra |
| B | Monto de la recarga | ROV | Es el valor que se acredita al saldo |
| B | Establecimiento destino | GV | Decide a qué saldo se acredita; es una variable enumerada |
| C | Código ingresado | GV | Decide qué orden se muestra o qué mensaje de error aparece |
| C | Hora de la validación | GV | Decide si un código del día anterior se reporta como vencido (RF-28) |

: Clasificación de las entradas (ROV, GV, SNM)

Al análisis del valor límite entran las variables numéricas acotadas: **cantidad y precio** (A, n = 2), **monto de la recarga** (B, n = 1) y **código** (C, n = 1). Saldo, cupo y hora tienen límites que dependen de otra variable. Por eso se tratan aparte, en la sección de límites dependientes. El establecimiento es una variable enumerada y no tiene límites que probar.

# Paso 2 · Dominio de entrada

Los valores mínimos salen del esquema de la base de datos y de la especificación. La especificación no fija los valores máximos, así que para esta prueba se adoptan los topes de la tabla. Si el sistema define otros, las tablas de la siguiente sección se recalculan con los mismos pasos.

| Variable | Tipo | Mínimo | Máximo | Paso | Fuente del límite |
|----------------------------|------------------|------------|------------|---------|------------------------------------------------|
| x₁ · Cantidad de platos por orden | Entero | 1 | 10 | 1 | Mínimo: `cantidad > 0` (esquema). Máximo: tope adoptado para la prueba |
| x₂ · Precio unitario del plato | Decimal (USD) | $0.01 | $20.00 | $0.01 | Mínimo: `precio > 0` (esquema). Máximo: tope adoptado para la prueba |
| Monto de la recarga | Decimal (USD) | $1.00 | $100.00 | $0.01 | Mínimo: `monto_total > 0` (esquema) y monto mínimo habitual de una pasarela. Máximo: tope adoptado para la prueba |
| Código de retiro | Cadena de 6 dígitos | `000000` | `999999` | 1 | `^[0-9]{6}$` (esquema, RF-25) |

: Dominio de entrada de cada variable

A partir de cada dominio se obtienen los siete valores característicos:

| Variable | min− | min | min+ | nom | max− | max | max+ |
|---|---|---|---|---|---|---|---|
| Cantidad | 0 | 1 | 2 | 5 | 9 | 10 | 11 |
| Precio unitario | $0.00 | $0.01 | $0.02 | $3.50 | $19.99 | $20.00 | $20.01 |
| Monto de la recarga | $0.99 | $1.00 | $1.01 | $50.00 | $99.99 | $100.00 | $100.01 |
| Código de retiro | `-1` | `000000` | `000001` | `500000` | `999998` | `999999` | `1000000` |

: Valores límite de cada variable

En las variables decimales, min+ y max− están a un centavo del límite, que es el paso más pequeño que el sistema puede representar. El nominal del precio es $3.50, el precio típico de un almuerzo en el campus, y no el punto medio del rango. La teoría pide un valor típico, y este es el que más se usará en producción.

# Paso 3 · Datos de prueba

## Número de casos por variante

| Función | n | Normal (4n + 1) | Robusta (6n + 1) | Peor caso (5ⁿ) | Robusta peor caso (7ⁿ) |
|---|---|---|---|---|---|
| A · Compra | 2 | 9 | 13 | 25 | 49 |
| B · Recarga | 1 | 5 | 7 | 5 | 7 |
| C · Código | 1 | 5 | 7 | 5 | 7 |
| **Total** | | **19** | **27** | **35** | **63** |

: Casos de prueba por variante

Con una sola variable no hay combinaciones posibles. Por eso, en B y C el peor caso coincide con la variante normal y la robusta en el peor caso coincide con la robusta.

## Función A · Comprar un almuerzo (n = 2)

**Condiciones fijas para todos los casos.** El estudiante tiene **$250.00** de saldo en el local. El plato tiene un cupo remanente de 50 unidades y un stock sincronizado del ERP de 50. Con esto, ni el saldo ni el cupo deciden el resultado: el total más alto posible es 10 × $20.00 = $200.00. Así, todo rechazo se debe a la variable que se está probando.

**Resultado esperado.** En una compra aprobada, el saldo baja exactamente por el total y el cupo baja exactamente por la cantidad (RF-19). En una compra rechazada no se descuenta nada: el saldo sigue en $250.00 y el cupo en 50. Un precio fuera de rango no puede existir en el menú, porque el sistema debe impedir que el proveedor publique el plato. Por eso esos casos se ejecutan en dos pasos: primero se intenta publicar el plato y se verifica el rechazo, y luego se verifica que la compra tampoco procede.

### Variante 1 · Normal (4n + 1 = 9 casos)

Una variable toma sus valores extremos mientras la otra se queda en su nominal.

| ID | Cantidad (x₁) | Precio unitario (x₂) | Total esperado | Saldo posterior | Resultado esperado |
|-------------|----------------|-------------------|--------------|--------------|----------------------------------|
| A-N-01 | 5 (nom) | $3.50 (nom) | $17.50 | $232.50 | Aprobada |
| A-N-02 | 1 (min) | $3.50 (nom) | $3.50 | $246.50 | Aprobada |
| A-N-03 | 2 (min+) | $3.50 (nom) | $7.00 | $243.00 | Aprobada |
| A-N-04 | 9 (max−) | $3.50 (nom) | $31.50 | $218.50 | Aprobada |
| A-N-05 | 10 (max) | $3.50 (nom) | $35.00 | $215.00 | Aprobada |
| A-N-06 | 5 (nom) | $0.01 (min) | $0.05 | $249.95 | Aprobada |
| A-N-07 | 5 (nom) | $0.02 (min+) | $0.10 | $249.90 | Aprobada |
| A-N-08 | 5 (nom) | $19.99 (max−) | $99.95 | $150.05 | Aprobada |
| A-N-09 | 5 (nom) | $20.00 (max) | $100.00 | $150.00 | Aprobada |

: Función A · Variante normal

### Variante 2 · Robusta (6n + 1 = 13 casos)

A la normal se le agregan min− y max+ de cada variable.

| ID | Cantidad (x₁) | Precio unitario (x₂) | Total esperado | Saldo posterior | Resultado esperado |
|-------------|----------------|-------------------|--------------|--------------|----------------------------------|
| A-R-01 | 5 (nom) | $3.50 (nom) | $17.50 | $232.50 | Aprobada |
| A-R-02 | 0 (min−) | $3.50 (nom) | — | $250.00 | Rechazada: cantidad fuera de rango |
| A-R-03 | 1 (min) | $3.50 (nom) | $3.50 | $246.50 | Aprobada |
| A-R-04 | 2 (min+) | $3.50 (nom) | $7.00 | $243.00 | Aprobada |
| A-R-05 | 9 (max−) | $3.50 (nom) | $31.50 | $218.50 | Aprobada |
| A-R-06 | 10 (max) | $3.50 (nom) | $35.00 | $215.00 | Aprobada |
| A-R-07 | 11 (max+) | $3.50 (nom) | — | $250.00 | Rechazada: cantidad fuera de rango |
| A-R-08 | 5 (nom) | $0.00 (min−) | — | $250.00 | Rechazada: precio fuera de rango |
| A-R-09 | 5 (nom) | $0.01 (min) | $0.05 | $249.95 | Aprobada |
| A-R-10 | 5 (nom) | $0.02 (min+) | $0.10 | $249.90 | Aprobada |
| A-R-11 | 5 (nom) | $19.99 (max−) | $99.95 | $150.05 | Aprobada |
| A-R-12 | 5 (nom) | $20.00 (max) | $100.00 | $150.00 | Aprobada |
| A-R-13 | 5 (nom) | $20.01 (max+) | — | $250.00 | Rechazada: precio fuera de rango |

: Función A · Variante robusta

### Variante 3 · Peor caso (5ⁿ = 25 casos)

Se combinan los cinco valores válidos de la cantidad con los cinco del precio. Esta variante encuentra fallas que sólo aparecen cuando las dos variables están en un extremo a la vez. Por ejemplo, la orden más cara posible (A-P-25, 10 × $20.00 = $200.00) o la más barata (A-P-01, 1 × $0.01 = $0.01).

| ID | Cantidad (x₁) | Precio unitario (x₂) | Total esperado | Saldo posterior | Resultado esperado |
|-------------|----------------|-------------------|--------------|--------------|----------------------------------|
| A-P-01 | 1 (min) | $0.01 (min) | $0.01 | $249.99 | Aprobada |
| A-P-02 | 1 (min) | $0.02 (min+) | $0.02 | $249.98 | Aprobada |
| A-P-03 | 1 (min) | $3.50 (nom) | $3.50 | $246.50 | Aprobada |
| A-P-04 | 1 (min) | $19.99 (max−) | $19.99 | $230.01 | Aprobada |
| A-P-05 | 1 (min) | $20.00 (max) | $20.00 | $230.00 | Aprobada |
| A-P-06 | 2 (min+) | $0.01 (min) | $0.02 | $249.98 | Aprobada |
| A-P-07 | 2 (min+) | $0.02 (min+) | $0.04 | $249.96 | Aprobada |
| A-P-08 | 2 (min+) | $3.50 (nom) | $7.00 | $243.00 | Aprobada |
| A-P-09 | 2 (min+) | $19.99 (max−) | $39.98 | $210.02 | Aprobada |
| A-P-10 | 2 (min+) | $20.00 (max) | $40.00 | $210.00 | Aprobada |
| A-P-11 | 5 (nom) | $0.01 (min) | $0.05 | $249.95 | Aprobada |
| A-P-12 | 5 (nom) | $0.02 (min+) | $0.10 | $249.90 | Aprobada |
| A-P-13 | 5 (nom) | $3.50 (nom) | $17.50 | $232.50 | Aprobada |
| A-P-14 | 5 (nom) | $19.99 (max−) | $99.95 | $150.05 | Aprobada |
| A-P-15 | 5 (nom) | $20.00 (max) | $100.00 | $150.00 | Aprobada |
| A-P-16 | 9 (max−) | $0.01 (min) | $0.09 | $249.91 | Aprobada |
| A-P-17 | 9 (max−) | $0.02 (min+) | $0.18 | $249.82 | Aprobada |
| A-P-18 | 9 (max−) | $3.50 (nom) | $31.50 | $218.50 | Aprobada |
| A-P-19 | 9 (max−) | $19.99 (max−) | $179.91 | $70.09 | Aprobada |
| A-P-20 | 9 (max−) | $20.00 (max) | $180.00 | $70.00 | Aprobada |
| A-P-21 | 10 (max) | $0.01 (min) | $0.10 | $249.90 | Aprobada |
| A-P-22 | 10 (max) | $0.02 (min+) | $0.20 | $249.80 | Aprobada |
| A-P-23 | 10 (max) | $3.50 (nom) | $35.00 | $215.00 | Aprobada |
| A-P-24 | 10 (max) | $19.99 (max−) | $199.90 | $50.10 | Aprobada |
| A-P-25 | 10 (max) | $20.00 (max) | $200.00 | $50.00 | Aprobada |

: Función A · Variante peor caso

### Variante 4 · Robusta en el peor caso (7ⁿ = 49 casos)

Se combinan los siete valores de cada variable, incluidos los no válidos. Cuando las dos variables están fuera de rango, el mensaje de rechazo debe nombrar las dos.

| ID | Cantidad (x₁) | Precio unitario (x₂) | Total esperado | Saldo posterior | Resultado esperado |
|-------------|----------------|-------------------|--------------|--------------|----------------------------------|
| A-RP-01 | 0 (min−) | $0.00 (min−) | — | $250.00 | Rechazada: cantidad y precio fuera de rango |
| A-RP-02 | 0 (min−) | $0.01 (min) | — | $250.00 | Rechazada: cantidad fuera de rango |
| A-RP-03 | 0 (min−) | $0.02 (min+) | — | $250.00 | Rechazada: cantidad fuera de rango |
| A-RP-04 | 0 (min−) | $3.50 (nom) | — | $250.00 | Rechazada: cantidad fuera de rango |
| A-RP-05 | 0 (min−) | $19.99 (max−) | — | $250.00 | Rechazada: cantidad fuera de rango |
| A-RP-06 | 0 (min−) | $20.00 (max) | — | $250.00 | Rechazada: cantidad fuera de rango |
| A-RP-07 | 0 (min−) | $20.01 (max+) | — | $250.00 | Rechazada: cantidad y precio fuera de rango |
| A-RP-08 | 1 (min) | $0.00 (min−) | — | $250.00 | Rechazada: precio fuera de rango |
| A-RP-09 | 1 (min) | $0.01 (min) | $0.01 | $249.99 | Aprobada |
| A-RP-10 | 1 (min) | $0.02 (min+) | $0.02 | $249.98 | Aprobada |
| A-RP-11 | 1 (min) | $3.50 (nom) | $3.50 | $246.50 | Aprobada |
| A-RP-12 | 1 (min) | $19.99 (max−) | $19.99 | $230.01 | Aprobada |
| A-RP-13 | 1 (min) | $20.00 (max) | $20.00 | $230.00 | Aprobada |
| A-RP-14 | 1 (min) | $20.01 (max+) | — | $250.00 | Rechazada: precio fuera de rango |
| A-RP-15 | 2 (min+) | $0.00 (min−) | — | $250.00 | Rechazada: precio fuera de rango |
| A-RP-16 | 2 (min+) | $0.01 (min) | $0.02 | $249.98 | Aprobada |
| A-RP-17 | 2 (min+) | $0.02 (min+) | $0.04 | $249.96 | Aprobada |
| A-RP-18 | 2 (min+) | $3.50 (nom) | $7.00 | $243.00 | Aprobada |
| A-RP-19 | 2 (min+) | $19.99 (max−) | $39.98 | $210.02 | Aprobada |
| A-RP-20 | 2 (min+) | $20.00 (max) | $40.00 | $210.00 | Aprobada |
| A-RP-21 | 2 (min+) | $20.01 (max+) | — | $250.00 | Rechazada: precio fuera de rango |
| A-RP-22 | 5 (nom) | $0.00 (min−) | — | $250.00 | Rechazada: precio fuera de rango |
| A-RP-23 | 5 (nom) | $0.01 (min) | $0.05 | $249.95 | Aprobada |
| A-RP-24 | 5 (nom) | $0.02 (min+) | $0.10 | $249.90 | Aprobada |
| A-RP-25 | 5 (nom) | $3.50 (nom) | $17.50 | $232.50 | Aprobada |
| A-RP-26 | 5 (nom) | $19.99 (max−) | $99.95 | $150.05 | Aprobada |
| A-RP-27 | 5 (nom) | $20.00 (max) | $100.00 | $150.00 | Aprobada |
| A-RP-28 | 5 (nom) | $20.01 (max+) | — | $250.00 | Rechazada: precio fuera de rango |
| A-RP-29 | 9 (max−) | $0.00 (min−) | — | $250.00 | Rechazada: precio fuera de rango |
| A-RP-30 | 9 (max−) | $0.01 (min) | $0.09 | $249.91 | Aprobada |
| A-RP-31 | 9 (max−) | $0.02 (min+) | $0.18 | $249.82 | Aprobada |
| A-RP-32 | 9 (max−) | $3.50 (nom) | $31.50 | $218.50 | Aprobada |
| A-RP-33 | 9 (max−) | $19.99 (max−) | $179.91 | $70.09 | Aprobada |
| A-RP-34 | 9 (max−) | $20.00 (max) | $180.00 | $70.00 | Aprobada |
| A-RP-35 | 9 (max−) | $20.01 (max+) | — | $250.00 | Rechazada: precio fuera de rango |
| A-RP-36 | 10 (max) | $0.00 (min−) | — | $250.00 | Rechazada: precio fuera de rango |
| A-RP-37 | 10 (max) | $0.01 (min) | $0.10 | $249.90 | Aprobada |
| A-RP-38 | 10 (max) | $0.02 (min+) | $0.20 | $249.80 | Aprobada |
| A-RP-39 | 10 (max) | $3.50 (nom) | $35.00 | $215.00 | Aprobada |
| A-RP-40 | 10 (max) | $19.99 (max−) | $199.90 | $50.10 | Aprobada |
| A-RP-41 | 10 (max) | $20.00 (max) | $200.00 | $50.00 | Aprobada |
| A-RP-42 | 10 (max) | $20.01 (max+) | — | $250.00 | Rechazada: precio fuera de rango |
| A-RP-43 | 11 (max+) | $0.00 (min−) | — | $250.00 | Rechazada: cantidad y precio fuera de rango |
| A-RP-44 | 11 (max+) | $0.01 (min) | — | $250.00 | Rechazada: cantidad fuera de rango |
| A-RP-45 | 11 (max+) | $0.02 (min+) | — | $250.00 | Rechazada: cantidad fuera de rango |
| A-RP-46 | 11 (max+) | $3.50 (nom) | — | $250.00 | Rechazada: cantidad fuera de rango |
| A-RP-47 | 11 (max+) | $19.99 (max−) | — | $250.00 | Rechazada: cantidad fuera de rango |
| A-RP-48 | 11 (max+) | $20.00 (max) | — | $250.00 | Rechazada: cantidad fuera de rango |
| A-RP-49 | 11 (max+) | $20.01 (max+) | — | $250.00 | Rechazada: cantidad y precio fuera de rango |

: Función A · Variante robusta en el peor caso

## Función B · Recargar saldo en un local (n = 1)

**Condiciones fijas.** El estudiante recarga en un local con saldo previo de $0.00 y un pago que la pasarela aprueba. Lo que se verifica es que un monto fuera de rango se rechace **antes** de invocar la pasarela. Así ni se cobra a la tarjeta ni se acredita saldo.

### Variantes normal y peor caso (5 casos)

| ID | Monto | Resultado esperado |
|------------|--------------------|------------------------------------------------------------------------|
| B-N-01 | $1.00 (min) | Aceptada: se envía a la pasarela; al aprobarse, el saldo del local sube en $1.00 |
| B-N-02 | $1.01 (min+) | Aceptada: se envía a la pasarela; al aprobarse, el saldo del local sube en $1.01 |
| B-N-03 | $50.00 (nom) | Aceptada: se envía a la pasarela; al aprobarse, el saldo del local sube en $50.00 |
| B-N-04 | $99.99 (max−) | Aceptada: se envía a la pasarela; al aprobarse, el saldo del local sube en $99.99 |
| B-N-05 | $100.00 (max) | Aceptada: se envía a la pasarela; al aprobarse, el saldo del local sube en $100.00 |

: Función B · Variantes normal y peor caso

### Variantes robusta y robusta en el peor caso (7 casos)

| ID | Monto | Resultado esperado |
|------------|--------------------|------------------------------------------------------------------------|
| B-R-01 | $0.99 (min−) | Rechazada: monto fuera de rango; no se invoca la pasarela y el saldo no cambia |
| B-R-02 | $1.00 (min) | Aceptada: se envía a la pasarela; al aprobarse, el saldo del local sube en $1.00 |
| B-R-03 | $1.01 (min+) | Aceptada: se envía a la pasarela; al aprobarse, el saldo del local sube en $1.01 |
| B-R-04 | $50.00 (nom) | Aceptada: se envía a la pasarela; al aprobarse, el saldo del local sube en $50.00 |
| B-R-05 | $99.99 (max−) | Aceptada: se envía a la pasarela; al aprobarse, el saldo del local sube en $99.99 |
| B-R-06 | $100.00 (max) | Aceptada: se envía a la pasarela; al aprobarse, el saldo del local sube en $100.00 |
| B-R-07 | $100.01 (max+) | Rechazada: monto fuera de rango; no se invoca la pasarela y el saldo no cambia |

: Función B · Variantes robusta y robusta en el peor caso

## Función C · Validar el código de retiro (n = 1)

**Condiciones fijas.** El Operador está en su local y tiene sesión iniciada. Para cada código de formato válido hay una orden vigente precargada en ese local, comprada el mismo día.

El código se trata como un valor numérico de seis posiciones entre `000000` y `999999`. Los casos `000000` y `000001` son los más importantes de esta función. Si en algún punto el código se guarda o se compara como número y no como texto, los ceros a la izquierda se pierden: `000001` se convierte en `1`, la búsqueda falla y el estudiante no puede retirar su almuerzo. Sólo una prueba en el límite inferior detecta esa falla.

### Variantes normal y peor caso (5 casos)

| ID | Código ingresado | Resultado esperado |
|------------|------------------------|------------------------------------------------------------------------|
| C-N-01 | `000000` (min) | Formato válido: muestra la orden precargada con el código `000000` |
| C-N-02 | `000001` (min+) | Formato válido: muestra la orden precargada con el código `000001` |
| C-N-03 | `500000` (nom) | Formato válido: muestra la orden precargada con el código `500000` |
| C-N-04 | `999998` (max−) | Formato válido: muestra la orden precargada con el código `999998` |
| C-N-05 | `999999` (max) | Formato válido: muestra la orden precargada con el código `999999` |

: Función C · Variantes normal y peor caso

### Variantes robusta y robusta en el peor caso (7 casos)

| ID | Código ingresado | Resultado esperado |
|------------|------------------------|------------------------------------------------------------------------|
| C-R-01 | `-1` (min−) | Rechazado por formato. No se puede teclear en la pantalla: se prueba directo contra la API |
| C-R-02 | `000000` (min) | Formato válido: muestra la orden precargada con el código `000000` |
| C-R-03 | `000001` (min+) | Formato válido: muestra la orden precargada con el código `000001` |
| C-R-04 | `500000` (nom) | Formato válido: muestra la orden precargada con el código `500000` |
| C-R-05 | `999998` (max−) | Formato válido: muestra la orden precargada con el código `999998` |
| C-R-06 | `999999` (max) | Formato válido: muestra la orden precargada con el código `999999` |
| C-R-07 | `1000000` (max+) | Rechazado por formato (7 dígitos); el teclado no deja escribir el séptimo dígito y la API lo rechaza |

: Función C · Variantes robusta y robusta en el peor caso

# Límites dependientes: dónde el análisis no alcanza

El análisis del valor límite supone variables independientes con límites fijos. En Aliflow, tres de los límites más importantes no cumplen ese supuesto:

- **Saldo y total.** El límite del saldo no es un número fijo: es el total de la compra, que depende de la cantidad y del precio.
- **Cupo y cantidad.** La cantidad máxima real no es 10, sino el menor valor entre 10, el cupo remanente y el stock sincronizado del ERP (RN-02).
- **Hora y código.** El código vence al terminar el día de la compra (RF-29), así que su límite cambia con la fecha.

Tratarlos como variables independientes produciría casos sin sentido, como un saldo "nominal" que no se compara con nada. Para cubrirlos se aplica la misma idea, pero sobre la **diferencia** entre las dos variables: se prueba justo debajo, justo en el límite y justo encima.

| ID | Límite probado | Datos | Resultado esperado |
|--------|----------------------------|------------------------------------|------------------------------------------------|
| D-01 | Saldo − total = −$0.01 | 5 × $3.50 = $17.50, saldo $17.49 | Rechazada por saldo insuficiente; el mensaje nombra el local (RF-12). No se descuenta nada |
| D-02 | Saldo − total = $0.00 | 5 × $3.50 = $17.50, saldo $17.50 | Aprobada; saldo posterior $0.00 |
| D-03 | Saldo − total = +$0.01 | 5 × $3.50 = $17.50, saldo $17.51 | Aprobada; saldo posterior $0.01 |
| D-04 | Cupo − cantidad = −1 | Cantidad 5, cupo remanente 4 | Rechazada por cupo agotado; la compra se registra como rechazada por cupo (RF-18) |
| D-05 | Cupo − cantidad = 0 | Cantidad 5, cupo remanente 5 | Aprobada; el cupo queda en 0 |
| D-06 | Cupo − cantidad = +1 | Cantidad 5, cupo remanente 6 | Aprobada; el cupo queda en 1 |
| D-07 | Stock ERP − cantidad = −1 | Cantidad 5, cupo 50, stock sincronizado 4 | Rechazada: la disponibilidad es el mínimo entre cupo y stock (RN-02) |
| D-08 | Último instante del día | Código del día, validado a las 23:59:59 | Válido: muestra la orden |
| D-09 | Primer instante del día siguiente | El mismo código, validado a las 00:00:00 | Rechazado como **vencido**, no como inexistente (RF-28) |

: Casos de los límites dependientes

Hay otras entradas a las que esta técnica no se aplica. El establecimiento es una variable enumerada, y el estado activo o inactivo del programa de fidelidad es booleano. Para ellas corresponde usar clases de equivalencia o tablas de decisión.

# Verificación preliminar de las SNM

Antes de ejecutar los casos de la función A, se confirma que las variables clasificadas como SNM realmente no afectan el total. Se sigue el procedimiento de la técnica:

1. Se fijan cantidad y precio en sus valores nominales (5 × $3.50) y se ejecuta la compra una vez. El total esperado es $17.50.
2. Se repite la compra variando al azar, dentro de sus rangos válidos, la hora de la compra (de 07:00 a 15:00), los sellos acumulados (de 0 a sellos requeridos − 1) y la presencia o ausencia de un método de pago guardado.
3. Se compara cada total con el de la primera ejecución. Si alguno cambia, la clasificación de esa variable está equivocada, o hay un error en el sistema. En los dos casos se registra y se revisa antes de continuar.

Una cartilla **completa** queda fuera de este rango a propósito. Con la cartilla completa, el estudiante puede canjear el premio, y el canje es otro flujo: conserva el precio original y aplica un descuento del 100% (RF-35). No es una compra normal con otro total.

# Conclusiones

- La función A necesita entre 9 y 49 casos, según la variante. Para una función que mueve dinero se recomienda la **robusta en el peor caso**: con dos variables cuesta 49 casos, todos automatizables, y es la única variante que prueba combinaciones de valores no válidos.
- En B y C, con una sola variable, alcanza la **robusta** (7 casos cada una), porque las variantes de peor caso no agregan nada.
- Los casos de mayor valor no son los de la teoría pura. Son el límite inferior del código (`000000`), que detecta la pérdida de ceros a la izquierda, y los límites dependientes D-01 a D-09, que prueban las reglas de negocio de Aliflow: saldo por local, cupo reservado y vencimiento diario del código.
- Los topes máximos de cantidad, precio y recarga se adoptaron para esta prueba. Si el sistema define otros valores, las tablas se recalculan con el mismo procedimiento; el número de casos no cambia.
