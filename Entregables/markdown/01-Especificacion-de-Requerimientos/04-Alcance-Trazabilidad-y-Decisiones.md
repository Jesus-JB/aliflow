## 7. Fuera del alcance de la versión 1

Declarado explícitamente, con su razón. Lo que no está en este documento **no forma parte del sistema**.

| Fuera de alcance | Razón |
|---|---|
| **Modo offline del Operador** | La validación de códigos requiere conexión. Existe un procedimiento manual de contingencia (RNF-O-10). |
| **Aliflow como emisor de facturas electrónicas** | RNF-E-01. Cambiaría el modelo de negocio, no solo el software. |
| **Aplicaciones móviles nativas** | Una sola aplicación web responsiva cubre los cuatro roles (RNF-P-23). |
| **Lector de códigos QR o de barras** | El código es numérico y se dicta de viva voz. No hay escáner en ninguna parte del sistema. |
| **Programa de fidelidad con puntos, niveles o campañas por temporada** | El alcance es una cartilla simple: N sellos por local dan un premio (RNF-O-14). |
| **Integración con más de dos locales en el piloto** | El modelo admite N establecimientos; el piloto integra dos (RNF-O-12). |
| **Pedidos programados para días futuros** | No solicitado. El código vale solo el día de la compra (RN-03), lo que presupone compra y consumo el mismo día. |
| **Entrega a domicilio o a un punto distinto del local** | No solicitado. La entrega es presencial en el punto de entrega del local. |
| **Reservas sin pago** | La orden solo existe después de descontar el saldo (RF-19). |
| **Recuperación de contraseña autoservicio para roles operativos** | Lo resuelve el Proveedor de cada local (RF-04) o el Super-Admin (RF-45). |

: Alcance excluido de la versión 1
| **Saldo único gastable en cualquier local** | El saldo pertenece al establecimiento y solo se gasta ahí (RN-13). |
| **Transferir saldo de un establecimiento a otro** | Exigiría que Aliflow mueva dinero entre cuentas de terceros, algo que el sistema no hace (RN-14). Ver RF-12b. |
| **Retiro del saldo en efectivo** | Mismo motivo: Aliflow no tiene el dinero, no puede devolverlo. |
| **Reembolsos y devoluciones** | Fuera del alcance de la versión 1. El modelo de datos los admite como movimiento compensatorio cuando se definan. |

---

---

## 8. Trazabilidad

### 8.1 Requerimientos ↔ casos de uso ↔ pantalla del prototipo

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

: Trazabilidad de requerimientos a casos de uso y pantallas

### 8.2 Riesgos ↔ requerimientos que los mitigan

Solo los riesgos que se mitigan **con requerimientos del sistema**. El registro completo está en `06-Gestion-de-Riesgos.md`.

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
| R-17 — Alcance del programa de fidelidad | RF-32, RF-33, RF-35, RNF-O-14 |
| R-18 — Custodia de fondos | RN-13, RN-14, RF-08 |
| R-19 — Capacidades de la pasarela | RNF-E-09, RNF-E-10, RNF-E-11b |
| R-20 — Cupo desactualizado manualmente | RF-17, RF-18, RNF-O-08 |
| R-21 — Saldo fragmentado entre establecimientos | RF-07 (criterio 2), RF-08 (criterio 6), RF-12 (criterio 3), RF-15 |
| R-22 — Local sin cuenta de comercio en la pasarela | RNF-E-10, RNF-E-11b, RNF-O-06 |
| R-23 — Saldo huérfano | RNF-E-05b *(se transfiere por contrato — ver sección 7)* |

: Trazabilidad de riesgos a requerimientos

---
