> **Entregable 01.c · rúbrica: Especificación y categorización de RNF con criterio de validación (8 pts)**
> Parte del documento de especificación de requerimientos. Se ensambla en el PDF único con `construir-pdf.sh` — ver [`../../README.md`](../../README.md).

## 6. Requerimientos no funcionales

Clasificados según **Ian Sommerville**: *de producto* (propiedades del sistema entregado), *organizacionales* (derivadas de las políticas y procedimientos de la organización que desarrolla o usa el sistema) y *externos* (derivados de factores externos al sistema y a su proceso de desarrollo). Cada uno lleva su **criterio de validación**: cómo se comprueba que se cumple.

### 6.1 Requerimientos de producto

#### Usabilidad

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-P-01** | La validación de un código de retiro por parte del Operador debe completarse en **una sola pantalla** y sin más de 8 pulsaciones (6 dígitos + confirmar). | Prueba de recorrido sobre el prototipo: contar pulsaciones desde la pantalla de inicio del Operador hasta la confirmación. Debe ser ≤ 8. |
| **RNF-P-02** | El código de retiro debe ser legible y dictable de viva voz: **6 dígitos numéricos**, presentado con separación visual y en un estilo tipográfico específico. | Inspección del sistema de diseño (existe un estilo de texto dedicado al código) y prueba con 5 usuarios dictando el código sin repetirlo. |
| **RNF-P-03** | Un estudiante que usa la aplicación por primera vez debe completar el flujo de compra sin instrucciones externas. | Prueba de usabilidad con 5 estudiantes que no participaron en el diseño: ≥ 4 completan la compra sin ayuda. |
| **RNF-P-04** | La interfaz del Operador debe ser utilizable en tablet o móvil sostenido con una mano, con los controles de acción en la mitad inferior de la pantalla. | Revisión del prototipo a 390×844: los controles primarios están en el tercio inferior. |
| **RNF-P-05** | Todo texto sobre color de marca debe alcanzar contraste **AA de WCAG 2.1** (4.5:1 para texto normal). | Verificación de contraste sobre las variables de color del sistema de diseño. *(Ya aplicado: el verde del logo da 2.6:1 y por eso **no** se usa en botones con texto blanco; las acciones usan un verde más profundo — `../../mockups/marca/`.)* |
| **RNF-P-06** | Los mensajes de error deben indicar **qué pasó y qué hacer**, sin códigos técnicos ni jerga. | Revisión de los mensajes de los tres estados de fallo de código (RF-28) y de los fallos de compra (RF-19). |

#### Eficiencia y rendimiento

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-P-07** | La confirmación de una compra debe responder en **≤ 2 s** en el percentil 95, medida desde la petición hasta la respuesta del backend. | Prueba de carga con 50 compras concurrentes; medir p95. |
| **RNF-P-08** | La validación de un código de retiro debe responder en **≤ 1 s** en el percentil 95. | Prueba de carga sobre el endpoint de validación. *(Justificación: ocurre con una fila de estudiantes esperando; es el punto del sistema con menos tolerancia a la latencia.)* |
| **RNF-P-09** | La consulta del menú del día **no debe depender de una llamada síncrona al ERP**. | Prueba con el ERP simulado apagado: el menú responde igual (RF-14 criterio 3). |
| **RNF-P-10** | El sistema debe sostener la carga concurrente de la hora pico de almuerzo sin degradar los dos requerimientos anteriores. | Prueba de carga con el perfil estimado de la franja 12:00–14:00 en el campus. *(La cifra exacta de usuarios concurrentes está sin estimar — ver sección 10.)* |

#### Fiabilidad y disponibilidad

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-P-11** | **Ninguna venta puede quedar huérfana**: si el ERP está caído, la venta se registra igual y se sincroniza después. | Prueba de integración: apagar el ERP simulado, comprar, verificar que la orden existe y el evento queda pendiente; encender el ERP y verificar que se procesa. |
| **RNF-P-12** | Los eventos hacia el ERP deben ser **idempotentes**: reprocesar un evento no duplica su efecto. | Prueba de integración: reenviar el mismo evento dos veces y verificar una sola venta en el ERP. |
| **RNF-P-13** | Las operaciones que descuentan saldo y cupo deben ser **atómicas**: no existe estado intermedio observable. | Prueba de concurrencia (RF-21) y revisión de los límites transaccionales en el código. |
| **RNF-P-14** | La caída del ERP de un local **no** debe afectar la operación de los demás locales. | Prueba con dos locales configurados: apagar el ERP de uno y verificar que el otro opera con normalidad. |
| **RNF-P-15** | El sistema debe estar disponible durante toda la franja de almuerzo de días hábiles. | Monitoreo de disponibilidad en la franja 11:00–15:00; objetivo ≥ 99% mensual sobre esa ventana. *(Fuera de esa franja el impacto de una caída es bajo — es un sistema con demanda concentrada.)* |

#### Seguridad (propiedades del producto)

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-P-16** | Todo el tráfico entre cliente, backend y servicios externos debe viajar sobre **HTTPS/TLS**, sin excepción. | Inspección de la configuración de despliegue; ninguna ruta acepta HTTP en claro. |
| **RNF-P-17** | Las contraseñas de las cuentas operativas deben almacenarse con una función de derivación de clave con sal por registro. | Revisión de código e inspección de la base de datos: ninguna contraseña legible ni con hash simple. |
| **RNF-P-18** | **No debe existir en ninguna tabla** el número completo de una tarjeta ni su código de seguridad (RN-06). | Auditoría del esquema y consulta de verificación sobre la base de datos poblada. |
| **RNF-P-19** | Las credenciales de los ERP y **las credenciales de comercio de la pasarela de cada establecimiento** deben almacenarse cifradas y no ser legibles desde ninguna interfaz. | Inspección de la base de datos y del panel; revisión de que no se registren en los logs. *(La decisión #13 multiplica este requerimiento: ya no es un juego de credenciales de pasarela, sino uno por local.)* |
| **RNF-P-20** | La autorización debe verificarse **en el backend en cada petición**; ocultar un elemento en la interfaz no constituye control de acceso. | Prueba de seguridad: invocar directamente endpoints de otro rol y de otro local con un token válido del rol inferior. Todos deben rechazarse. |
| **RNF-P-21** | Toda entrada del usuario debe validarse en el backend con listas de valores permitidos, sin confiar en la validación del cliente. | Pruebas con entradas maliciosas sobre los endpoints de compra, validación de código y configuración de cupo. |
| **RNF-P-22** | El sistema debe seguir las prácticas del **OWASP Top 10** en autenticación, control de acceso, inyección y exposición de datos. | Revisión de código cruzada entre integrantes, con lista de verificación OWASP, sobre los cuatro endpoints críticos: autenticación, billetera, órdenes y validación de códigos. *(Mitigación de R-03: el equipo tiene poca experiencia construyendo APIs seguras.)* |

#### Portabilidad y mantenibilidad

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-P-23** | El sistema debe ser **una sola aplicación web responsiva**, no aplicaciones nativas por rol. | Verificación de los cuatro roles en navegador de escritorio y móvil. |
| **RNF-P-24** | Debe funcionar en las dos últimas versiones estables de los navegadores mayoritarios, en escritorio y móvil. | Prueba de humo de los flujos principales en cada navegador objetivo. |
| **RNF-P-25** | Agregar un local con un ERP nuevo debe requerir **una clase adaptadora nueva y configuración**, sin modificar el núcleo. | Ejercicio de extensión: agregar un adaptador nuevo y verificar por diff que no se tocó ningún archivo del núcleo. |
| **RNF-P-26** | El diseño debe ser consistente con los **principios SOLID** y no introducir malos olores (clase Dios, obsesión por primitivos, acoplamiento a implementación externa). | Revisión del diagrama de clases contra la tabla de SOLID y la de malos olores de `../../uml/Documentacion-Diagrama-Clases.md`. |

### 6.2 Requerimientos organizacionales

#### De proceso y desarrollo

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-O-01** | Todo el trabajo debe versionarse en el repositorio público del proyecto, con historial que evidencie el proceso. | Inspección del historial de commits del repositorio. |
| **RNF-O-02** | Todo diagrama UML debe tener su **fuente editable** versionada junto a su imagen renderizada, y ambas deben estar sincronizadas. | Verificación de que cada `.svg` tiene su `.puml` correspondiente y refleja su contenido actual. |
| **RNF-O-03** | Toda propuesta de Ingeniería no validada por el cliente debe estar **visualmente distinguible** de una decisión confirmada, en documentos, diagramas y prototipo. | Verificación de la convención: estereotipo `<<propuesta>>` y fondo amarillo en UML; etiqueta "Pendiente de Negocios" en el prototipo; marca 🟡 en este documento. |
| **RNF-O-04** | Todo cambio de requerimiento posterior al cierre de alcance debe pasar por **control de cambios con reestimación**, no absorberse en silencio. | Existencia del registro de decisiones con fecha, y trazabilidad de cada cambio a la reunión que lo originó. *(Mitigación de R-08, que ya se materializó parcialmente.)* |
| **RNF-O-05** | Los endpoints críticos —autenticación, billetera, órdenes, validación de códigos— deben pasar por **revisión de código entre integrantes** antes de integrarse. | Evidencia de revisión en el historial del repositorio para esos módulos. |
| **RNF-O-06** | El alta de cada local nuevo debe ejecutarse como un **procedimiento con lista de verificación** (credenciales, mapeo de productos, prueba de humo bidireccional), no como un cambio de configuración informal. | Existencia del procedimiento documentado y de su registro de ejecución por local. *(Mitigación de R-16.)* |
| **RNF-O-07** | El proyecto debe mantener un **registro de riesgos vivo**, revisado en cada reunión con el cliente. | `06-Gestion-de-Riesgos.md` con fechas de revisión y riesgos incorporados tras cada reunión. |

#### Operacionales

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-O-08** | El cupo reservado es responsabilidad operativa del **Proveedor**, que debe mantenerlo al día manualmente. | Procedimiento operativo entregado al local, más las alertas de RF-17 y la métrica de RF-18. *(Este requerimiento existe porque el inventario reservado traslada una carga operativa al local — riesgo R-20.)* |
| **RNF-O-09** | La emisión de la factura fiscal es responsabilidad del **local**, no de Aliflow. Aliflow entrega los datos (RF-41). | Verificación de que ningún flujo del sistema invoca un servicio de facturación electrónica. |
| **RNF-O-10** | Debe existir un **procedimiento manual de contingencia** documentado para la entrega de almuerzos cuando falle la conectividad en el punto de entrega. | Existencia del procedimiento escrito y entregado a los Operadores. *(R-12 se aceptó formalmente: v1 no tiene modo offline; la contingencia es organizacional, no técnica.)* |
| **RNF-O-11** | Debe existir un **procedimiento de conciliación** entre las ventas de Aliflow y los registros del ERP de cada local, con un responsable designado por local. | Procedimiento documentado y ejecutado al menos una vez durante el piloto. *(Mitigación de R-02.)* |

#### De entrega

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-O-12** | El alcance integrado en el piloto se limita a los **dos locales confirmados**; los demás quedan como demostración de extensibilidad, no como entregable. | Declaración explícita de alcance en este documento (sección 8) y en el registro de riesgos. *(Mitigación de R-16.)* |
| **RNF-O-13** | No debe comprometerse fecha de piloto con el cliente antes de contar con las credenciales del ERP del local piloto. | Verificación de que ningún compromiso de fecha precede a la recepción de credenciales. *(Mitigación de R-01.)* |
| **RNF-O-14** | El alcance del módulo de fidelidad queda **congelado** en "una cartilla simple: N sellos → 1 premio, por local". Puntos, niveles o campañas por temporada son otro proyecto. | Declaración de alcance en sección 8; cualquier variante entra por RNF-O-04. *(Mitigación de R-17.)* |

### 6.3 Requerimientos externos

#### Legales y regulatorios

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-E-01** | Aliflow **no puede emitir comprobantes con validez tributaria**. Toda factura electrónica es emitida por el local desde su propio ERP, bajo su RUC y su firma electrónica. | Verificación de que todos los comprobantes del sistema llevan la marca de "sin validez tributaria" y de que no existe integración con el servicio de facturación electrónica. *(No es una preferencia de diseño: emitir con validez tributaria implicaría certificado de firma digital, RUC emisor, secuenciales autorizados y responsabilidad fiscal — y significaría que Aliflow le vende el almuerzo al estudiante, no el local. Cambia el modelo de negocio, no solo el software.)* |
| **RNF-E-02** | El tratamiento de datos personales de estudiantes debe ajustarse a la normativa ecuatoriana de protección de datos personales: recolectar el mínimo necesario, con finalidad declarada. | Inventario de datos personales tratados, con su finalidad, revisado contra el principio de minimización. Verificar que no se recolecta ningún dato que ningún requerimiento use. |
| **RNF-E-03** | El sistema **no debe entrar en alcance de PCI-DSS**: los datos de tarjeta se tratan exclusivamente en la pasarela, y Aliflow solo custodia tokens (RN-06). | Auditoría del esquema (RNF-P-18) y verificación de que ningún formulario propio captura número de tarjeta o código de seguridad. |
| **RNF-E-04** | **Aliflow no debe llegar a custodiar fondos de terceros en ningún flujo** (RN-14), evitando así la exposición regulatoria de esa figura. | Verificar que ningún flujo deja dinero en una cuenta controlada por Aliflow: el destino de cada recarga es la cuenta del proveedor, y el sistema no ofrece retiro, devolución en efectivo ni transferencia de saldo. *(Cerrado el 8-ago-2026 por la decisión #13: la recarga es por establecimiento.)* |
| **RNF-E-05b** | El saldo prepagado constituye una **obligación del establecimiento con el estudiante**, no de Aliflow. Esto debe ser explícito para el estudiante y estar acordado con cada local. | Verificar que la interfaz de recarga lo comunica (RF-08 criterio 6) y que el acuerdo comercial con cada local lo recoge. *(Consecuencia directa de RN-14: si un local cierra o sale de la plataforma, Aliflow no puede devolver un dinero que nunca tuvo — ver riesgo R-23.)* |

#### De interoperabilidad

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-E-05** | El sistema debe integrarse con ERP **heterogéneos y fuera de su control**, sin poder imponerles cambios. | Verificación de que la interfaz de integración solo asume capacidades que el ERP ya ofrece. |
| **RNF-E-06** | El sistema **no puede depender de webhooks del ERP**: ninguno de los ERP del alcance los ofrece. La dirección ERP → Aliflow es por consulta periódica. | Revisión de la arquitectura de sincronización: no existe ningún endpoint entrante desde un ERP. |
| **RNF-E-07** | La autenticación del Estudiante depende de un proveedor de identidad externo; una caída de ese proveedor impide el ingreso de estudiantes. | Riesgo aceptado y documentado. Verificar que el mensaje de error distingue "el proveedor de identidad no responde" de "credenciales inválidas". |
| **RNF-E-08** | La acreditación de saldo debe depender de la **confirmación de la pasarela**, no de la respuesta del navegador del estudiante. | Prueba: cerrar el navegador tras pagar y verificar que el saldo se acredita igual cuando llega la confirmación de la pasarela. |
| **RNF-E-09** | La pasarela seleccionada debe ofrecer **webhooks** y un ambiente de pruebas utilizable. | Criterio de la comparación de pasarelas (decisión #12), verificado antes de seleccionar. |
| **RNF-E-10** | La pasarela debe permitir que **cada recarga se deposite en la cuenta del establecimiento destino**, operando con credenciales de comercio propias de cada local. **Ya no se requiere soporte de pagos divididos.** | Verificación en la comparación de pasarelas: confirmar que admite múltiples cuentas de comercio operadas por una misma aplicación. *(La decisión #13 cerró R-19: al ser la recarga por establecimiento, cada pago tiene un único destinatario y el* split *deja de ser necesario. El universo de pasarelas candidatas se amplía.)* |
| **RNF-E-11b** | 🟡 Todos los establecimientos deben poder operar con la **misma pasarela**, o el sistema debe soportar más de una. | Confirmar, antes de seleccionar pasarela, que los locales confirmados pueden abrir cuenta de comercio en ella. *(Requerimiento nuevo creado por la decisión #13 — ver riesgo R-22. Si un local no puede o no quiere abrir cuenta, no puede vender por Aliflow.)* |

#### Éticos y de equidad

| ID | Requerimiento | Criterio de validación |
|---|---|---|
| **RNF-E-11** | El sistema no debe crear un canal privilegiado que perjudique al estudiante que compra en caja: el cupo de Aliflow sale de una partición acordada con el local, no de una prioridad sobre la fila física. | Verificación de que el cupo es un valor que el Proveedor asigna libremente y puede poner en cero. |
| **RNF-E-12** | El sistema no debe exponer datos de consumo de un estudiante a otros estudiantes ni a locales donde no ha comprado. | Prueba de control de acceso (RNF-P-20) sobre los endpoints de historial y cartilla. |

---
