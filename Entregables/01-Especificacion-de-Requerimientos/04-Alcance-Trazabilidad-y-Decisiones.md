> **Entregable 01 · rúbrica: Contenido de otras secciones (3 pts)**
> Parte del documento de especificación de requerimientos. Se ensambla en el PDF único con `construir-pdf.sh` — ver [`../README.md`](../README.md).

## 7. Requerimientos bloqueados por decisiones abiertas

Esta sección existe para que **nadie construya sobre arena**. Son los puntos donde no se puede escribir un criterio de aceptación porque falta una decisión del cliente.

> ✅ **Cerrado el 8-ago-2026 — decisión #13.** Negocios respondió: **la recarga se hace por establecimiento**, con el modelo de *Parqueo Positivo* como referencia. Es la salida B. Con eso **se desbloquea el esquema completo de la billetera** —era lo único que quedaba congelado del modelo de datos— y se cierran los riesgos R-18 y R-19. El costo es que **se revierte la decisión #4**: ya no hay saldo único. Las tres consecuencias nuevas están abajo.

| Bloqueo | Requerimientos afectados | Qué se necesita | Consecuencia de construir sin la respuesta |
|---|---|---|---|
| 🔴 **Reembolso de órdenes expiradas** *(ahora más difícil)* | RF-29 (criterio 3), RF-56 (criterio 2) | Qué pasa con el dinero de una orden que venció sin retirarse: ¿se devuelve al saldo del estudiante en ese local, se pierde, o se le queda al proveedor porque el almuerzo se preparó? | **La decisión #13 acotó las salidas posibles:** como Aliflow no custodia fondos (RN-14), no puede devolver dinero — a lo sumo puede reacreditar saldo en ese mismo establecimiento, y eso es una obligación del proveedor, no de Aliflow. Si la respuesta implica devolución, hace falta el mecanismo de **movimientos compensatorios**, que el modelo actual no tiene. |
| 🟡 **Saldo huérfano** *(nuevo, creado por la decisión #13)* | RF-07, RNF-E-05b | Qué pasa con el saldo que un estudiante deja en un local cuando se gradúa, o cuando el local sale de la plataforma. | Aliflow **no puede devolverlo**: nunca tuvo el dinero. Sin una política acordada con cada local, el estudiante pierde el saldo y el reclamo llega igual a Aliflow. Ver riesgo R-23. |
| 🟡 **Cuenta de comercio por establecimiento** *(nuevo, creado por la decisión #13)* | RF-08, RNF-E-10, RNF-E-11b | Confirmar que cada local puede abrir su propia cuenta de comercio en la pasarela que se elija. | Un local que no pueda o no quiera abrir cuenta **no puede vender por Aliflow**. Es una condición de alta, no un detalle técnico. Ver riesgo R-22. |
| 🔴 **Representación del canje de $0 en el ERP** | RF-37 | Verificación técnica contra la documentación de cada ERP: documento de cortesía o descuento del 100%. | Un `notifySale` con monto cero puede ser rechazado por el ERP como error. |
| 🔴 **Decisión #12 — pasarela de pagos** | RF-08, RF-11, RNF-E-08, RNF-E-09, RNF-E-10 | Comparación y selección, con los ocho criterios acordados en el acta. | No se puede maquetar ni construir el flujo de pago sin saber si es modal, ventana integrada o página externa. |
| ⬜ **Decisión #7 — modelo de cobro al proveedor** *(se volvió más restringida)* | Ninguno de v1, pero condiciona la elección de pasarela | Comisión por transacción, suscripción fija u otro. | **La decisión #13 eliminó el punto donde encajaba una comisión:** el dinero nunca pasa por Aliflow, así que no hay momento en que se pueda retener. Quedan tres formas —suscripción fija, comisión facturada a posteriori, o comisión retenida por la pasarela— y **la tercera reabre el requisito de *split*** que la #13 nos permitió abandonar. |
| 🟡 **Valores del programa de fidelidad** | RF-32 *(no bloquea)* | Cuántos sellos requiere la cartilla y en qué consiste el premio. | Ninguna: están modelados como configuración por local a propósito. Definirlos es cargar un valor en base de datos. |

---

## 8. Fuera del alcance de v1

Declarado explícitamente, con la razón. Lo que no está aquí ni en la sección 5 **no forma parte del sistema**.

| Fuera de alcance | Razón |
|---|---|
| **Modo offline del Operador** | Decisión de negocio confirmada. Riesgo R-12 aceptado formalmente, con procedimiento manual de contingencia (RNF-O-10). |
| **Aliflow como emisor de facturas electrónicas** | RNF-E-01. Cambiaría el modelo de negocio, no solo el software. |
| **Aplicaciones móviles nativas** | Una sola aplicación web responsiva cubre los cuatro roles (RNF-P-23). |
| **Lector de códigos QR o de barras** | Negocios eligió código numérico dictado de viva voz. No hay escáner en ninguna parte del sistema. |
| **Programa de fidelidad con puntos, niveles o campañas por temporada** | Alcance congelado en cartilla simple (RNF-O-14). Cualquier variante entra por control de cambios. |
| **Integración con más de dos locales en el piloto** | RNF-O-12. El modelo admite N; el piloto integra los dos confirmados. |
| **Pedidos programados para días futuros** | No solicitado. El código vale solo el día de la compra (RN-03), lo que presupone compra y consumo el mismo día. |
| **Entrega a domicilio o a un punto distinto del local** | No solicitado. La entrega es presencial en el punto de entrega del local. |
| **Reservas sin pago** | La orden solo existe después de descontar el saldo (RF-19). |
| **Recuperación de contraseña autoservicio para roles operativos** | Lo resuelve el Proveedor de cada local (RF-04) o el Super-Admin (RF-45). |
| **Saldo único gastable en cualquier local** | Revertido por la decisión #13 el 8-ago-2026. El saldo es por establecimiento (RN-13). |
| **Transferir saldo de un establecimiento a otro** | Exigiría que Aliflow mueva dinero entre cuentas de terceros, que es justo lo que el acta §3.9 prohíbe (RN-14). Ver RF-12b. |
| **Retiro del saldo en efectivo** | Mismo motivo: Aliflow no tiene el dinero, no puede devolverlo. |
| **Reembolsos y devoluciones** | 🔴 Bloqueado, no descartado. Depende de la política de órdenes expiradas — ver sección 7. |

---

---

## 9. Trazabilidad

### 9.1 Requerimientos ↔ casos de uso ↔ pantalla del prototipo

| RF | Caso de uso | Pantalla del prototipo | Riesgo asociado |
|---|---|---|---|
| RF-01, RF-02 | UC1, UC1a, UC1b | Estudiante 01 | — |
| RF-03 | UC6 | Proveedor 01, Operador 01, Super-Admin 01 | — |
| RF-04 | UC12 | *(sin pantalla — fuera de esta ronda)* | — |
| RF-05, RF-06 | — | *(transversal)* | R-09 |
| RF-07, RF-08, RF-09, RF-10, RF-11 | UC2, UC2a | Estudiante 05 | R-06, R-18 |
| RF-12 | UC2 | *(sin pantalla — es interno)* | R-18 |
| RF-13 | UC8 | Proveedor 03 | — |
| RF-14 | UC3, UC3a | Estudiante 02 | RN-15 |
| RF-15 | UC1b, UC3 | **Estudiante 01b** *(pantalla nueva)* | R-21 |
| RF-16, RF-17, RF-18 | UC16 | Proveedor 03 | R-20 |
| RF-19, RF-20, RF-21, RF-22 | UC4, UC4a, UC4b | Estudiante 03 | R-02 |
| RF-23 | UC17 | Estudiante 04 | — |
| RF-24 | UC11 | Estudiante 06 | — |
| RF-25, RF-26, RF-27 | UC5, UC5a, UC5b | Operador 02, Operador 03 | R-14, R-15 |
| RF-28 | UC5c | Operador 04, Operador 05 | — |
| RF-29 | UC5c | Estudiante 06 (estado Expirado) | R-13 *(cerrado)* |
| RF-30, RF-31 | UC5a, UC5c | Operador 02 | R-15 |
| RF-32 | UC14 | Proveedor 05 | R-17 |
| RF-33 | UC5d | Operador 03 | R-17 |
| RF-34 | UC13 | Estudiante 07 | R-17 |
| RF-35, RF-36, RF-37 | UC15 | Estudiante 08 | R-17 |
| RF-38 | UC9 | Proveedor 02 | — |
| RF-39 | UC17 | Proveedor 03 | — |
| RF-40 | UC10 | Proveedor 04 | R-02, R-16 |
| RF-41 | UC11 | *(sin pantalla — descarga)* | — |
| RF-42 | UC7 | *(sin pantalla — trabajo técnico)* | R-01, R-11 |
| RF-43, RF-44 | UC18, UC20 | Super-Admin 02 | — |
| RF-45 | UC19 | Super-Admin 03 | — |
| RF-46 | UC20 | Super-Admin 03 | R-16 |
| RF-47, RF-48 | UC7 | — | R-16 |
| RF-49, RF-50 | UC4c | Proveedor 04 | R-02 |
| RF-51 | UC3a | Proveedor 04 | — |
| RF-52 | — | — | **R-01** |
| RF-53 | UC7 | — | R-11 |
| RF-54, RF-55, RF-56 | — | *(transversal)* | R-09, R-15 |

### 9.2 Riesgos ↔ requerimientos que los mitigan

Solo los riesgos que se mitigan **con requerimientos del sistema**. Los que se mitigan con acciones de gestión están en `06-Gestion-de-Riesgos.md`.

| Riesgo | Requerimientos que lo atienden |
|---|---|
| R-01 — Sin credenciales del ERP piloto | **RF-52** (ERP simulado), RNF-O-13 |
| R-02 — Inconsistencia entre saldo, facturación e inventario | RF-49, RF-40, RNF-P-11, RNF-P-12, RNF-O-11 |
| R-03 — Poca experiencia en APIs seguras | RNF-P-22, RNF-O-05 |
| R-06 — Ambiente de pruebas de pagos limitado | RF-08 (estados de pago), RNF-E-09 |
| R-08 — Cambios en el flujo de saldo y comprobantes | RNF-O-04 |
| R-09 — Requisitos de seguridad incompletos | RF-06, RF-54, RNF-P-16 a RNF-P-22 |
| R-11 — ERP sin API pública | RF-53, RNF-P-14 |
| R-12 — Operador sin modo offline | RNF-O-10 *(riesgo aceptado)* |
| R-14 — Doble redención del código | RF-27, RNF-P-13 |
| R-15 — Código corto adivinable | RF-25 (criterio 3), RF-31, RF-55 |
| R-16 — Costo de N ERP heterogéneos | RF-46, RNF-O-06, RNF-O-12 |
| R-17 — Cartilla con reglas sin definir | ✅ **Reglas confirmadas** el 8-ago. RF-32, RF-33, RF-35, RNF-O-14 |
| R-18 — Custodia de fondos vs. saldo único | ✅ **Cerrado** por la decisión #13. RN-13, RN-14, RF-08 |
| R-19 — Pasarela sin pagos divididos | ✅ **Cerrado**: el *split* dejó de ser necesario |
| R-20 — Cupo desactualizado manualmente | RF-17, RF-18, RNF-O-08 |
| R-21 — Saldo fragmentado entre establecimientos | RF-07 (criterio 2), RF-08 (criterio 6), RF-12 (criterio 3), RF-15 |
| R-22 — Local sin cuenta de comercio en la pasarela | RNF-E-10, RNF-E-11b, RNF-O-06 |
| R-23 — Saldo huérfano | RNF-E-05b *(se transfiere por contrato — ver sección 7)* |

---
