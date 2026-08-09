## 2. Glosario y desambiguaciones

Tres términos de este proyecto admiten más de un significado. El documento usa exclusivamente el que se fija en esta tabla.

| Término | Significado en este documento | Con qué se confunde |
|---|---|---|
| **Proveedor** (entidad) | El **local/negocio**: el tenant. Barú, Caramel Coffee. Clase `Proveedor`. | Con el rol homónimo. |
| **Proveedor** (rol) | La **persona** que gerencia el local. Clase `Administrador`. El cliente usa "Proveedor" y "Administrador" para el mismo rol. | Con la entidad, y con el Super-Admin. |
| **Cartilla de fidelidad** | **Tarjeta de sellos**: el estudiante acumula un sello por entrega y al completar N sellos gana un premio. | Con un **paquete prepago de almuerzos**: son productos distintos y este proyecto usa exclusivamente la primera acepción. |
| **Saldo** | Dinero prepagado por el estudiante **en un establecimiento concreto**, gastable **solo ahí**. Un estudiante puede tener varios saldos, uno por local. | Con un saldo único gastable en cualquier local, que **no** es el modelo de este sistema. |
| **Cupo reservado** | Unidades de un plato **apartadas exclusivamente para venta por Aliflow**, administradas manualmente por el Proveedor. Clase `InventarioReservado`. | Con el stock total del ERP (`Plato.stockDisponible`), que en Aliflow es solo un espejo informativo. |
| **Código de retiro** | Código **numérico de 6 dígitos** que el estudiante dicta de viva voz y el Operador teclea. | Con un QR o código de barras escaneable. **No hay escáner en ninguna parte del sistema.** |
| **Comprobante** | Constancia **interna sin validez tributaria** que emite Aliflow. | Con la **factura**, que emite el ERP del local y sí tiene validez tributaria. Ver RN-09. |
| **Operador** | Rol que valida el código y marca la entrega física. | Con "cajero", denominación informal del mismo rol. |

: Glosario de términos

---

## 3. Actores del sistema

| Actor | Tipo | Autenticación | Ámbito |
|---|---|---|---|
| **Estudiante** | Primario | Google OAuth 2.0 / OIDC, dominio institucional | Su propia cuenta; compra en cualquier local |
| **Proveedor** (gerente del local) | Primario | Credenciales propias del rol | **Un solo local.** Un local puede tener varias cuentas |
| **Operador** | Primario | Credenciales propias del rol | Un local y un punto de entrega. Un local puede tener varios |
| **Super-Admin de Aliflow** | Primario | Credenciales propias del rol | **Todos los locales.** Único rol sin local propio |
| **Proveedor de Identidad (Google)** | Secundario / externo | — | Autentica al Estudiante |
| **ERP del local** (Contífico, Alpwin, Odoo, …) | Secundario / externo | Credenciales por local | Uno por local; heterogéneos |
| **Pasarela de pagos** | Secundario / externo | — | Procesa las recargas |

: Actores del sistema

> El sistema tiene **cuatro roles primarios**: Estudiante, Operador, Proveedor y Super-Admin de Aliflow. Los tres primeros operan dentro de un establecimiento; el Super-Admin es el único con visibilidad sobre todos.

---

---

## 4. Reglas de negocio transversales

Restricciones que aplican a varios requerimientos a la vez. Se enuncian una sola vez para no repetirlas en cada RF.

| ID | Regla |
|---|---|
| **RN-01** | **Una orden pertenece a un solo local.** Todos los ítems de una orden deben ser platos del mismo `Proveedor`. |
| **RN-02** | **La disponibilidad de venta se valida contra el cupo reservado**, nunca contra el stock del ERP. Si el cupo está en cero, Aliflow no vende aunque el ERP reporte unidades libres. |
| **RN-03** | **El código de retiro vale únicamente el día de la compra**, y como máximo hasta la hora máxima de retiro del local. Tres estados: `VÁLIDO` / `UTILIZADO` / `VENCIDO`. |
| **RN-04** | **El código de retiro es de un solo uso.** Su invalidación es atómica y condicional; una segunda redención debe fallar, no completarse. |
| **RN-05** | **Toda hora, cupo, cantidad de sellos y premio es configuración por local**, nunca constante del sistema. |
| **RN-06** | **Aliflow nunca almacena el número completo de una tarjeta ni su código de seguridad.** Solo tipo, últimos cuatro dígitos y el token de la pasarela. |
| **RN-07** | **Un Proveedor y un Operador solo pueden ver y operar datos de su propio local.** El aislamiento entre tenants se verifica en el backend, nunca solo en la interfaz. |
| **RN-08** | **El sello de fidelidad se acredita al entregar, no al comprar**, y como máximo **uno por día** por local. |
| **RN-09** | **Aliflow emite comprobantes internos sin validez tributaria; la factura fiscal la emite el ERP del local.** Aliflow no es emisor fiscal en ningún flujo. |
| **RN-10** | **Toda operación que mueve dinero o cambia el estado de una orden queda registrada en auditoría**, con actor, acción, entidad afectada y marca de tiempo. |
| **RN-11** | **El control de concurrencia vive en la base de datos de Aliflow**, no se delega en el ERP externo. Validado empíricamente. |
| **RN-12** | **Un canje de premio es una orden real con un descuento del 100% identificado como "Premio"**, no una venta de $0. Conserva el precio original del plato, descuenta cupo y genera código de retiro, pero el total a pagar es $0 y no toca el saldo del estudiante. |
| **RN-13** | **El saldo pertenece al establecimiento, no al estudiante.** La recarga es por establecimiento y solo puede gastarse ahí. No hay saldo único ni transferencias entre locales. |
| **RN-14** | **Aliflow no recibe ni custodia fondos en ningún punto.** El dinero de la recarga va de la pasarela a la cuenta del proveedor destino. Aliflow registra el movimiento, no lo posee. |
| **RN-15** | **Al estudiante nunca se le muestra la cantidad de unidades disponibles**, solo si el plato está *Disponible* o *Agotado*. La cifra del cupo es información interna del local y sí se le muestra al Proveedor. |

: Reglas de negocio transversales

---
