# Decisiones Pendientes para Negocios — Aliflow

**Preparado por:** Grupo de Ingeniería
**Fecha:** 27-jul-2026, para la reunión con Grupo de Negocios
**Objetivo:** consolidar en un solo lugar todas las decisiones que Ingeniería necesita de Negocios antes de seguir avanzando — en particular, antes de modelar la base de datos, que depende directamente de varias de estas.

Todo lo trabajado hasta ahora (arquitectura, casos de uso, diagramas de clases/objetos/componentes/despliegue/actividad/secuencia/estado, registro de riesgos, demo funcional) está en el repositorio: **https://github.com/Jesus-JB/aliflow**. Este documento no repite ese contenido — apunta a la sección exacta de cada documento donde está el detalle completo.

---

## 🔴 Bloquean el modelo de base de datos — prioridad para mañana

### 1. Confirmar que el proveedor real es Barú y su sistema es Alpwin
**Por qué importa:** define el esquema de `IntegracionERP` (qué valores tiene `tipoERP`, si hace falta modelar sincronización por archivos en vez de solo API) y toda la prioridad de la arquitectura de integración.
**Estado:** viene de una fuente indirecta (revisión de otra conversación del equipo), no de una confirmación oficial en acta.
**Necesitamos que Negocios confirme:** ¿Barú es efectivamente el proveedor piloto? ¿Su sistema es Alpwin?
**Detalle:** `Hallazgos-Ingenieria-API-Generica.md`, sección 4.3.

### 2. Alcance del rol Administrador
**Por qué importa:** afecta directamente las tablas de usuarios/roles y varias clases del diagrama (`UsuarioProveedor`, `Propietario`, `Cajero`, `Administrador`).
**Estado:** Ingeniería propuso 3 funciones (dar de alta proveedores, métricas globales, gestionar usuarios/roles) como hipótesis razonable, **sin ninguna base en el acta o el flujo original** — están marcadas en amarillo en los diagramas justamente por esto.
**Necesitamos que Negocios confirme o corrija:** ¿qué hace realmente el Administrador? ¿Es un rol de la plataforma Aliflow (nuestro equipo) o alguien del lado de Barú/UEES?
**Detalle:** `uml/Documentacion-Casos-de-Uso.md` (UC12-UC14), `uml/Documentacion-Diagrama-Clases.md` sección "Usuarios".

### 3. Personal múltiple por proveedor (Propietario / Cajero)
**Por qué importa:** define si la tabla de usuarios necesita soportar varias cuentas por proveedor con distintos permisos, o si es una sola cuenta por proveedor.
**Estado:** propuesta de Ingeniería (jerarquía `UsuarioProveedor` → `Propietario`/`Cajero`) para resolver algo que el flujo original solo insinuaba ("el proveedor o personal autorizado") sin detallar.
**Necesitamos que Negocios confirme:** ¿un proveedor como Barú puede tener varias personas con acceso (dueño + cajeros), cada una con permisos distintos?
**Detalle:** `uml/Documentacion-Diagrama-Clases.md`, sección "Usuarios".

---

## 🟡 No bloquean el esquema de base de datos hoy, pero conviene cerrarlas pronto

### 4. Mecanismo de recarga de saldo
**Por qué importa:** no cambia las tablas (el saldo independiente por proveedor ya está confirmado como decisión de negocio desde el 13-jul-2026), pero sí cambia la lógica de la aplicación.
**Estado:** Ingeniería diseñó esto con un patrón (Strategy) para no bloquearse — hay dos alternativas listas para implementar en cuanto se elija una.
**Necesitamos que Negocios decida:** ¿el estudiante recarga explícitamente por proveedor, o hace una única recarga que Aliflow distribuye internamente?
**Detalle:** `uml/Documentacion-Diagrama-Clases.md`, sección "Wallet y Pagos".

### 5. Regla de expiración de una orden no retirada
**Por qué importa:** define si hace falta algún proceso de reembolso o solo un registro histórico.
**Estado:** Ingeniería propuso un mecanismo concreto (la orden expira cuando vence el código de retiro sin usarse) — antes solo estaba identificado el vacío, ahora hay algo específico para aprobar o corregir.
**Necesitamos que Negocios confirme:** ¿está bien esa regla? ¿Debería haber algún tipo de reembolso o notificación al proveedor?
**Detalle:** `uml/Documentacion-Diagramas-Estado.md`, sección 1.

### 6. Formato del código de retiro
**Por qué importa:** bloquea el prototipo de mockups (entregable 01.f).
**Estado:** propuesta concreta ya lista (UUID firmado con expiración), recuperada de investigación previa del equipo.
**Necesitamos que Negocios confirme:** ¿aprobamos ese formato, o prefieren algo más simple (ej. código numérico corto para que el estudiante lo pueda decir de viva voz)?
**Detalle:** `Hallazgos-Ingenieria-API-Generica.md`, sección 5.2.

### 7. Modelo de cobro de Aliflow al proveedor
**Por qué importa:** si se decide una comisión o suscripción, eventualmente hace falta una tabla de facturación de Aliflow hacia el proveedor (no la del proveedor hacia el estudiante, que es otra cosa).
**Estado:** sin ninguna propuesta todavía — es una decisión de modelo de negocio, no algo que Ingeniería deba proponer.
**Necesitamos que Negocios decida:** ¿comisión por transacción, suscripción fija, u otro esquema?
**Detalle:** `Hallazgos-Ingenieria-API-Generica.md`, sección 5.2.

### 8. Corrección del Acta original (comprobante tributario)
**Por qué importa:** evita que quede una contradicción en el documento de especificación de requerimientos final.
**Estado:** el Acta (25-jun-2026) dice que la compra genera "comprobante válido tributariamente", pero el flujo (mismo día) y el marco de negocio del 13-jul-2026 confirman que Aliflow **nunca** emite comprobantes con validez tributaria — el proveedor re-emite la factura real.
**Necesitamos que Negocios confirme:** que el texto del Acta se corrija para no contradecir lo ya decidido.
**Detalle:** `Hallazgos-Ingenieria-API-Generica.md`, sección 5.1.

---

## 🟢 Ya resueltas por Ingeniería — solo pendiente de "luz verde"

Estas no requieren debate, solo que Negocios las revise y las apruebe o señale si algo no cuadra con la realidad del negocio:

- **Ruta de implementación**: Odoo Community como demo/piloto técnico (ya construido y probado), con Alpwin como integración real prioritaria para Barú, y Contífico como opción de destino si más adelante se decide migrar de sistema. Detalle: `Hallazgos-Ingenieria-API-Generica.md`, secciones 4 y 4.3.
- **Un solo proveedor por orden**: una compra nunca mezcla platos de distintos proveedores — regla ya incorporada al diseño. Detalle: `uml/Documentacion-Diagrama-Clases.md`.
- **Control de concurrencia** (doble compra de última unidad, doble redención de código): ya resuelto a nivel de diseño con bloqueo optimista. Detalle: `uml/Documentacion-Diagramas-Secuencia.md`.
- **Registro de auditoría** para compras y entregas: ya modelado (`RegistroAuditoria`). Detalle: `uml/Documentacion-Diagrama-Clases.md`.
- **Modo offline del Operador**: ya confirmado como fuera de alcance de v1 (riesgo aceptado formalmente). Detalle: `Gestion-de-Riesgos.md`, R-12.

---

## Checklist para la reunión

- [ ] #1 Confirmar Barú/Alpwin como proveedor y sistema real
- [ ] #2 Definir alcance del rol Administrador
- [ ] #3 Confirmar modelo de personal múltiple por proveedor
- [ ] #4 Decidir mecanismo de recarga
- [ ] #5 Aprobar regla de expiración de orden
- [ ] #6 Aprobar formato del código de retiro
- [ ] #7 Decidir modelo de cobro Aliflow-proveedor
- [ ] #8 Aprobar corrección del Acta
- [ ] Revisar y dar luz verde a lo ya resuelto (sección 🟢)

Con #1, #2 y #3 resueltos, Ingeniería puede empezar el modelo de base de datos de inmediato — son los tres que de verdad lo bloquean. El resto puede resolverse en paralelo sin detener ese trabajo.
