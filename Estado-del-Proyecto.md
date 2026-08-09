# Estado del proyecto Aliflow — documento de traspaso

**Actualizado:** 9-ago-2026
**Para qué sirve:** ponerte al día con el proyecto en una sola lectura. Qué es, qué está hecho, qué falta, qué está bloqueado, y qué cosas ya se intentaron y no funcionan (para que no pierdas tiempo repitiéndolas).

Todo vive en **https://github.com/Jesus-JB/aliflow** (público).

---

## 1. Qué es Aliflow, en 30 segundos

Plataforma web **multi-tenant** para pedir y pagar el almuerzo dentro del campus de la UEES. El estudiante recarga saldo, ve el menú de un local, compra con anticipación y retira presentando un **código numérico de 6 dígitos** que dicta de viva voz.

Cada local de comida (Barú, Caramel Coffee, …) es un tenant independiente **con su propio sistema ERP**. Aliflow se integra con todos a través de una API genérica. Ese es el reto técnico central del proyecto.

**Aliflow no es** un ERP, ni un emisor de facturas, ni un punto de venta. No reemplaza la caja del local: convive con ella.

### Los cuatro roles

| Rol | Qué hace | Ámbito |
|---|---|---|
| **Estudiante** | Recarga, compra, retira, acumula sellos | Su cuenta |
| **Proveedor** | Gerente del local: menú, cupo, métricas, personal | **Un** local |
| **Operador** | Valida el código y marca la entrega física | Un local + un punto de entrega |
| **Super-Admin** | Da de alta locales, soporte, configuración de plataforma | **Todos** los locales |

> ⚠️ Cuidado con la palabra **"Proveedor"**: como *rol* es la persona que gerencia el local; como *entidad* (clase `Proveedor`) es el local/negocio en sí. Negocios usa "Proveedor" y "Administrador" como sinónimos — son el mismo rol.

---

## 2. Por dónde empezar a leer

En este orden. No leas el repo entero de golpe.

| # | Documento | Por qué |
|---|---|---|
| 1 | `README.md` | Portada. Indexa todo y tiene el link al prototipo en vivo |
| 2 | `Entregables/README.md` | **Qué se entrega, cuánto vale y qué falta.** Un PDF por punto del enunciado |
| 3 | `Entregables/markdown/01-Especificacion-de-Requerimientos/02-Requerimientos-Funcionales.md` | **El documento más importante.** 57 requerimientos funcionales con criterios de aceptación + 53 no funcionales. Si vas a construir algo, se construye contra esto |
| 4 | `Decisiones-Pendientes-Negocios.md` | **La fuente de verdad del estado.** Qué está cerrado, qué sigue abierto, y por qué. Si dos documentos se contradicen, este manda |
| 5 | `Entregables/markdown/02-Modelamiento-Parte-Estatica/a-Casos-de-Uso.md` | Los 20 casos de uso desarrollados |
| 6 | `Entregables/markdown/02-Modelamiento-Parte-Estatica/b-Diagrama-de-Clases.md` | El modelo de dominio y por qué está así |
| 7 | `Hallazgos-Ingenieria-API-Generica.md` | La investigación de integración con ERPs. Explica el patrón Adapter y el Outbox |
| 8 | `Entregables/markdown/01-Especificacion-de-Requerimientos/06-Gestion-de-Riesgos.md` | 23 riesgos. Varios requerimientos nacieron de un riesgo |

**Prototipo interactivo, para entender el producto en 2 minutos:** https://jesus-jb.github.io/aliflow/

---

## 3. Qué está hecho

Mapeado contra la rúbrica de evaluación (que está en `Proyecto - entregables .docx-1.pdf`).

**Todo lo que se entrega vive en [`Entregables/`](Entregables/):** los 5 documentos oficiales en `Documento Oficial/`, un PDF por tema sueltos en la carpeta, y las fuentes `.md` en `markdown/`. Se compila con `Entregables/build/construir.sh` — **los PDF nunca se editan a mano, son salida de los `.md`**.

> ⚠️ **`Entregables/` es material de cara al público.** Ahí no va nada de proceso interno: ni decisiones abiertas, ni marcas de "pendiente de Negocios", ni historial de qué cambió y por qué, ni puntos de rúbrica. Todo eso vive acá y en `Decisiones-Pendientes-Negocios.md`. Si al escribir un entregable hace falta explicar *por qué* se eligió algo, va en la justificación técnica, no en la crónica del equipo.

| Entregable | Pts | Estado | Dónde |
|---|---|---|---|
| Requerimientos funcionales | 15 | ✅ | `Entregables/markdown/01-Especificacion-de-Requerimientos/02-Requerimientos-Funcionales.md` |
| RNF categorizados (Sommerville) con criterio de validación | 8 | ✅ | `Entregables/markdown/01-Especificacion-de-Requerimientos/03-Requerimientos-No-Funcionales.md` |
| Prototipo del sistema | 12 | ✅ | `Entregables/markdown/01-Especificacion-de-Requerimientos/Apendice-A-Prototipo.md` |
| Evidencias de levantamiento de requerimientos | 3 | ✅ | `Entregables/markdown/01-Especificacion-de-Requerimientos/05-Evidencias-de-Levantamiento.md` |
| Estructura del documento (integrantes, TOC, índices) | 3 | 🟡 Parcial | `Entregables/markdown/01-Especificacion-de-Requerimientos/00-Portada-e-Indices.md` |
| Contenido de otras secciones | 3 | ✅ | `Entregables/markdown/01-Especificacion-de-Requerimientos/01-Introduccion-y-Contexto.md` · `04-Alcance-Trazabilidad-y-Decisiones.md` |
| Documentación de riesgos | 3 | ✅ | `Entregables/markdown/01-Especificacion-de-Requerimientos/06-Gestion-de-Riesgos.md` |
| **Sprint backlogs y activity-on-arrow** | 3 | ❌ **No empezado** | `Entregables/markdown/01-Especificacion-de-Requerimientos/07-Sprint-Backlogs-y-Cronograma.md` |
| Diagrama de clases (SOLID, patrones) | 6 | ✅ | `Entregables/uml/diagrama-clases.puml` |
| Casos de uso | 6 | ✅ | `Entregables/uml/casos-de-uso.puml` |
| Diagramas de objetos | 3 | ✅ | 2 diagramas |
| Diagramas de componentes | 3 | ✅ | 1 diagrama |
| Diagrama de despliegue | 3 | ✅ | 1 diagrama |
| Diagramas de actividad | 6 | ✅ | 5 diagramas |
| Diagramas de secuencia | 10 | ✅ | 4 diagramas |
| Diagramas de estado | 3 | ✅ | 5 diagramas |
| **Modelado de la base de datos** | 10 | ✅ | `Entregables/markdown/04-Modelo-de-Base-de-Datos/` |
| *Extra: definición arquitectónica* | +4 | ✅ | `Hallazgos-…md` + `demo-odoo/` |

**En números: quedan 6 puntos de rúbrica sin ganar** — sprint backlogs 3 y estructura del documento 3. Todo lo demás está hecho y al día.

### Detalle de lo construido

- **20 diagramas UML** en `Entregables/uml/`, cada uno con su `.puml` (fuente editable) y su `.svg` renderizado. Su documentación está en `Entregables/markdown/02-…` y `03-…`. Hay un `render.py` para regenerar los SVG.
- **Prototipo interactivo funcional** en `Entregables/mockups/prototipo-web/` (React + Vite). No son imágenes: los cuatro roles comparten estado real. Se despliega solo a GitHub Pages en cada push a `main` que lo toque.
- **22 pantallas de mockups** exportadas en `Entregables/mockups/`, salidas de un sistema de diseño real en Figma (variables de color y escala, 10 estilos de texto, 10 componentes).
- **Demo técnico funcional** en `demo-odoo/`: Odoo Community en Docker con un adaptador en Python, más pruebas de concurrencia reales. **No es teoría — se levantó y se corrió.**
- **Identidad visual** derivada del logo, documentada en `Entregables/mockups/marca/`.

---

## 4. Las decisiones de diseño que hay que conocer sí o sí

Si no entendés estas diez, vas a romper algo sin darte cuenta.

**1. Inventario reservado.** El proveedor aparta un **cupo exclusivo para Aliflow** (de 100 almuerzos: 75 a caja, 25 a Aliflow) y lo administra a mano desde su panel. **Aliflow valida la compra contra ese cupo, no contra el stock del ERP.** Elimina la sobreventa *por diseño* en vez de perseguir sincronización: convierte un problema de consistencia distribuida (difícil, sin solución completa cuando no controlás los dos sistemas) en uno de partición de recursos (trivial).

**2. Saldo por establecimiento.** El estudiante recarga **para un local** y ese saldo solo se gasta ahí. El dinero va directo a la cuenta del proveedor — **Aliflow no custodia fondos en ningún momento**. El modelo de referencia lo dio el cliente: la app de Parqueo Positivo, donde elegís un servicio por defecto y el saldo pertenece a ese servicio. *(Esto se decidió el 8-ago-2026 y revirtió una decisión anterior de "saldo único". Documentos anteriores a esa fecha describen el modelo viejo.)*

**3. Código de retiro de 6 dígitos.** Numérico, sin QR, **sin escáner en ninguna parte del sistema**. El estudiante lo dicta de viva voz y el Operador lo teclea. Vale **solo el día de la compra**. Tres estados: `VÁLIDO` / `UTILIZADO` / `VENCIDO`.

**4. La concurrencia vive en la base de datos de Aliflow.** Bloqueo optimista con campo de versión. **No se delega en el ERP** — se probó y falló (ver sección 6).

**5. Patrón Outbox para todo lo que sale hacia un ERP.** La compra nunca llama al ERP de forma síncrona: encola un evento que un worker procesa con reintentos. Así, si el ERP está caído, la venta se confirma igual y no queda "venta huérfana" (cobrada al estudiante, desconocida por el local).

**6. Patrón Adapter + Factory para los ERP.** El núcleo solo conoce la interfaz `IInventoryProvider`. Agregar un ERP nuevo = una clase adaptadora nueva + un valor de configuración, **cero cambios en el núcleo**. Hay `ContificoAdapter`, `AlpwinAdapter`, `OdooAdapter`.

**7. Aliflow nunca emite facturas.** Emite **comprobantes internos sin validez tributaria**; la factura fiscal la emite el ERP del local. Esto no es preferencia de diseño: emitir con validez tributaria en Ecuador significa certificado de firma digital, RUC emisor y responsabilidad fiscal, y significaría que Aliflow le vende el almuerzo al estudiante en vez del local. Cambia el modelo de negocio, no solo el software.

**8. Al estudiante nunca se le muestra la cantidad disponible.** Solo *Disponible* o *Agotado*. La cifra del cupo es un acuerdo interno entre el local y Aliflow: mostrar "quedan 3" cuando el local tiene 40 almuerzos en la cocina sería engañoso. El Proveedor sí ve el número exacto en su panel. Es la regla RN-15, no un detalle de pantalla — aplica a cualquier vista futura del estudiante.

**9. El canje de un premio es una venta con descuento del 100%, no una venta de $0.** La orden conserva el precio real del plato y le aplica un descuento rotulado como premio. Dos razones: el local puede ver **cuánto le costaron los premios** (con $0 ese dato no existe), y el ERP recibe un documento que entiende — una venta de importe cero puede rechazarla como error.

**10. Todo lo que el negocio no fijó se modela como configuración, no como constante.** Hora máxima de retiro, sellos de la cartilla, premio, tope diario, caducidad. Cuando Negocios los defina, es un valor en base de datos — no un rediseño. Es la jugada que más veces salvó al proyecto de quedarse esperando.

### La convención de colores, que se respeta en todo el repo

| Marca | Significado |
|---|---|
| ✅ | Confirmado por Negocios (consta en acta o decisión cerrada) |
| 🟡 / fondo amarillo / `<<propuesta>>` | **Propuesta de Ingeniería sin validar.** Aparece igual en los UML, en los mockups y en los documentos |
| 🔴 | Bloqueado por una decisión abierta |

**Nunca presentes una propuesta de Ingeniería como si fuera decisión del cliente.** Es la regla que hace confiable el resto de la documentación.

---

## 5. Qué falta

Ordenado por lo que más mueve la aguja.

### 5.1 No empezado

**A. ~~Modelo de base de datos~~ — ✅ hecho el 9-ago-2026.** 24 tablas en PostgreSQL, con las reglas de negocio expresadas como restricciones declarativas en vez de confiarlas al código. El DDL se ejecutó de verdad contra PostgreSQL 16 y hay 10 pruebas que verifican que la base impide lo que dice impedir. Ver `Entregables/markdown/04-Modelo-de-Base-de-Datos/`.

**B. Sprint backlogs y cronograma con diagramas activity-on-arrow** — 3 puntos. Forman parte del mismo entregable que los riesgos (01.g). `Entregables/markdown/01-Especificacion-de-Requerimientos/06-Gestion-de-Riesgos.md` cubre los riesgos, pero los sprint backlogs y el cronograma **no están ni empezados**.

**C. Composición del PDF final** — 3 puntos. Lista de integrantes en la primera página, tabla de contenido, índice de tablas e índice de figuras, más los apéndices: capturas del prototipo con su flujo de ventanas, y el acta de conformidad firmada.

### 5.2 Ya propagado — no queda nada desactualizado

*(Esta sección listaba lo que faltaba propagar de las decisiones del 8-ago. Se completó el 9-ago-2026 y se deja el registro de qué se tocó, porque explica por qué el modelo se ve como se ve.)*

| Dónde | Qué cambió |
|---|---|
| `Entregables/uml/diagrama-clases.puml` + SVG | `TarjetaVirtual` perdió `saldoDisponible`; `SaldoProveedor` → `SaldoEstablecimiento` cambiando de significado; `Recarga` ganó establecimiento destino; `Orden` ganó descuento y motivo; **se eliminó el patrón Strategy** `EstrategiaDistribucionRecarga`, que quedó sin problema que resolver |
| Mockups de Figma + PNG | Pantalla nueva de selección de establecimiento; menú, recarga, historial y canje actualizados; se retiraron tres marcas amarillas ya resueltas |
| Prototipo web | Saldo por establecimiento, selección obligatoria de local, perfil con saldos separados. Probado en navegador |
| `Entregables/markdown/02-Modelamiento-Parte-Estatica/b-Diagrama-de-Clases.md` | Sección 3 reescrita |

### 5.3 Trabajo técnico que no depende de nadie

- **`ContificoAdapter` contra un ERP simulado.** Es el requerimiento RF-52 y existe por una razón: el riesgo R-01 (que Barú no entregue las credenciales de Contífico) es el único riesgo **catastrófico** del proyecto y **no se puede mitigar con trabajo de Ingeniería**. Construir el adaptador contra la documentación y demostrarlo contra un simulador convierte ese riesgo en manejable: el día que lleguen las credenciales solo hay que enchufarlo.
- **Verificar contra la documentación de Contífico y Alpwin** que aceptan un descuento del 100% en línea de venta (RF-37).
- **Los 9 requerimientos que siguen en 🟡** son endurecimientos que propuso Ingeniería a partir de riesgos —límite de intentos de validación del código, alertas de cupo bajo, expiración de sesión, vista consolidada del Super-Admin, ERP simulado—. **Ninguno espera a Negocios**; los puede aprobar el equipo.

---

## 6. Trampas: cosas que ya se intentaron y no funcionan

Esto es lo más valioso de este documento. Cada punto costó tiempo real.

**No delegues el control de concurrencia en el ERP externo.** Se intentó implementar el bloqueo directamente contra Odoo vía RPC y **falló bajo concurrencia real**: 5 hilos comprando con 3 unidades de stock vendieron 5. La misma prueba contra un dominio local con lock real se comportó bien. Por eso `version`/`reservarStock()` viven en la base de Aliflow. Está documentado en `demo-odoo/README.md` sección 7 — no lo repitas.

**Con Odoo usá JSON-RPC, no XML-RPC.** XML-RPC falla al serializar `None`. Está comentado en el adaptador.

**Ningún ERP del alcance tiene webhooks.** Ni Contífico ni Alpwin. La dirección ERP → Aliflow es **polling**, y no hay forma de evitarlo. La única integración del sistema que sí tiene webhooks es la pasarela de pagos.

**Alpwin no tiene API pública.** Lo usa Caramel Coffee, no Barú. La vía sería archivos o base de datos puente, y no está confirmada. **No bloquea el piloto** porque el local piloto es Barú, que usa Contífico (API REST documentada).

**El verde del logo no sirve para botones con texto blanco.** Da 2.6:1 de contraste, por debajo de AA. Las acciones usan un verde más profundo. Y el color de "éxito" pasó a teal, porque con una marca verde un badge verde deja de leerse como estado. Está en `Entregables/mockups/marca/`.

**Hay un documento de requerimientos que NO es oficial.** `Requerimientos del Proyecto Aliflow.pdf`, elaborado por otro equipo del curso. **No hay que cumplirlo**: describe una plataforma white-label multi-organización (universidades, empresas, hospitales) con planes y suscripciones. Es otro producto. Además contradice decisiones cerradas: propone registro con correo y contraseña (el real es Google OAuth institucional) y código QR escaneable (el real son 6 dígitos tecleados).

**Ojo con la palabra "cartilla".** En ese documento no oficial significa **paquete prepago de almuerzos**. En este proyecto significa **tarjeta de sellos de fidelidad**. Son dos productos distintos con el mismo nombre. Negocios confirmó el 8-ago que es la tarjeta de sellos. La ambigüedad ya está resuelta, pero si alguien la reintroduce, este es el punto donde hay que detenerse.

---

## 7. Qué está esperando a terceros

Ninguna de estas depende del equipo, y todas tienen tiempo de respuesta que no controlamos. **Conviene pedirlas ya, no al cierre.**

| Qué | Por qué importa |
|---|---|
| **Credenciales de API de Contífico**, que Barú tiene que solicitar | Riesgo R-01: el único de impacto **catastrófico**. Sin ellas hay venta (gracias al inventario reservado) pero no registro contable ni factura |
| **Acta de conformidad firmada** por el representante del cliente | Entregable 01.e, va como apéndice del PDF. De paso resuelve el respaldo documental del rol de Super-Admin, que se acordó verbalmente y nunca quedó escrito en un acta |
| **Confirmar que los locales pueden abrir cuenta de comercio** en una pasarela, ojalá la misma | Riesgo R-22. Si el dinero va directo a la cuenta de cada proveedor, cada local necesita la suya. Un local que no pueda abrirla **no puede vender por Aliflow** aunque su ERP esté integrado |

---

## 8. Decisiones de negocio que siguen abiertas

Ninguna bloquea el modelo de base de datos. Detalle completo en `Decisiones-Pendientes-Negocios.md`.

| Qué | Estado |
|---|---|
| **Política del saldo que ya no se puede gastar** — órdenes vencidas sin retirar, saldo huérfano del que se gradúa o del local que se va, caducidad por inactividad | Son la misma pregunta con tres disparadores. Conviene resolverlas juntas. **Aliflow no puede devolver dinero porque nunca lo tuvo** — a lo sumo reacreditar saldo en ese local, que es obligación del proveedor |
| **Cómo le cobra Aliflow al proveedor** (decisión #7) | Se volvió más difícil: al no pasar el dinero por Aliflow, **no hay momento en que se pueda retener una comisión**. Quedan suscripción fija, comisión facturada a posteriori, o comisión retenida por la pasarela — y esta última reabre el requisito de *split payments* |
| **Qué pasarela de pagos** (decisión #12) | Investigación de Ingeniería con 8 criterios ya acordados. Depende de la anterior y de la cuenta de comercio por local |
| **Cuántos sellos y qué premio** en la cartilla | No bloquea nada: están modelados como configuración por local a propósito |
| **Carga concurrente esperada en hora pico** | Falta el número para poder poner cifra al requerimiento de rendimiento |

---

## 9. Cómo correr las cosas

```bash
# Prototipo web (solo si vas a modificarlo; para verlo basta el link)
cd mockups/prototipo-web
npm install
npm run dev

# Demo técnico con Odoo — ver demo-odoo/README.md, tiene un paso manual
cd demo-odoo
docker compose up -d
python demo.py

# Regenerar los SVG de los diagramas después de editar un .puml
cd uml
python render.py
```

Cada push a `main` que toque `Entregables/mockups/prototipo-web/` recompila y publica el sitio automáticamente (`.github/workflows/deploy-prototipo.yml`).

---

## 10. Si tuvieras que hacer una sola cosa

**Los sprint backlogs con el cronograma en activity-on-arrow.** Son los últimos 3 puntos que dependen solo de nosotros —los otros 3 esperan la lista de integrantes— y es lo único del proyecto que no está ni empezado.

Los insumos ya están: los 57 requerimientos funcionales están priorizados con MoSCoW y agrupados en 10 módulos, así que el backlog sale de tomar los módulos como épicas y los `RF-nn` como ítems. El archivo `07-Sprint-Backlogs-y-Cronograma.md` trae una propuesta de seis sprints que respeta las dependencias reales del sistema.

---

*Documento de traspaso preparado por el Grupo de Ingeniería. Si algo de acá contradice a `Decisiones-Pendientes-Negocios.md`, ese documento manda: es la fuente de verdad del estado del proyecto.*
