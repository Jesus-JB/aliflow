# Entregables 02 y 03 · Diagramas UML

**43 puntos de rúbrica en total.** ✅ Completos.

Los diagramas no se duplican acá: viven en [`../uml/`](../uml/), cada uno con su `.puml` (fuente editable), su `.svg` renderizado y su documentación en Markdown. Este archivo solo mapea cada uno con el ítem de rúbrica que cubre.

> **Regla del repositorio:** si editás un `.puml`, regenerá su `.svg` antes de commitear. Ver [`../uml/README-diagramas.md`](../uml/README-diagramas.md).

---

## 02 · Modelamiento de la parte estática

| Ítem | Pts | Diagrama | Documentación |
|---|---:|---|---|
| 02.a · Casos de uso y documentación completa | 6 | [`casos-de-uso.puml`](../uml/casos-de-uso.puml) | [`Documentacion-Casos-de-Uso.md`](../uml/Documentacion-Casos-de-Uso.md) — 20 casos de uso desarrollados |
| 02.b · Clases (SOLID, patrones, malos olores) | 6 | [`diagrama-clases.puml`](../uml/diagrama-clases.puml) | [`Documentacion-Diagrama-Clases.md`](../uml/Documentacion-Diagrama-Clases.md) |
| 02.c · Objetos | 3 | [`objeto-billetera-orden.puml`](../uml/objeto-billetera-orden.puml) · [`objeto-integracion-erp.puml`](../uml/objeto-integracion-erp.puml) | [`Documentacion-Diagrama-Objetos.md`](../uml/Documentacion-Diagrama-Objetos.md) |
| 02.d · Componentes | 3 | [`diagrama-componentes.puml`](../uml/diagrama-componentes.puml) | [`Documentacion-Diagrama-Componentes.md`](../uml/Documentacion-Diagrama-Componentes.md) |
| 02.e · Despliegue | 3 | [`diagrama-despliegue.puml`](../uml/diagrama-despliegue.puml) | [`Documentacion-Diagrama-Despliegue.md`](../uml/Documentacion-Diagrama-Despliegue.md) |

**Sobre el diagrama de clases**, que es el que más criterios tiene en la rúbrica: su documentación incluye una tabla de los cinco principios SOLID con dónde se aplica cada uno, los patrones usados **con la razón de cada uno** (Adapter, Factory Method, Outbox), y una sección de malos olores evitados. También registra que el patrón Strategy **se eliminó** cuando la decisión #13 lo dejó sin problema que resolver — conservarlo habría sido el mal olor que el propio diagrama declara evitar.

---

## 03 · Modelamiento del comportamiento

| Ítem | Pts | Diagramas |
|---|---:|---|
| 03.a · Actividad — *todos* los procesos | 6 | 5 diagramas: [autenticación](../uml/actividad-autenticacion.puml), [compra](../uml/actividad-compra-almuerzo.puml), [recarga](../uml/actividad-recarga-saldo.puml), [retiro y entrega](../uml/actividad-retiro-entrega.puml), [sincronización ERP](../uml/actividad-sincronizacion-erp.puml) |
| 03.b · Secuencia — algoritmos transaccionales | 10 | 4 diagramas: [compra](../uml/secuencia-compra-almuerzo.puml), [recarga](../uml/secuencia-recarga-saldo.puml), [retiro y entrega](../uml/secuencia-retiro-entrega.puml), [sincronización ERP](../uml/secuencia-sincronizacion-erp.puml) |
| 03.c · Estado — objetos pertinentes | 3 | 5 diagramas: [orden](../uml/estado-orden.puml), [código de retiro](../uml/estado-codigo-retiro.puml), [pago](../uml/estado-pago.puml), [cartilla](../uml/estado-cartilla.puml), [evento de sincronización](../uml/estado-evento-sincronizacion.puml) |

Documentación: [actividad](../uml/Documentacion-Diagramas-Actividad.md) · [secuencia](../uml/Documentacion-Diagramas-Secuencia.md) · [estado](../uml/Documentacion-Diagramas-Estado.md)

---

## Pendiente de revisar

Los diagramas de **secuencia y actividad de la recarga** se dibujaron cuando el modelo era de saldo único. La decisión #13 (recarga por establecimiento) se propagó al diagrama de clases, a los mockups y al prototipo, **pero conviene verificar que estos dos no describan todavía la distribución interna que ya no existe.**
