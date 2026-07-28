"""
Demo de integración Aliflow <-> Odoo Community, usando OdooAdapter.

Tres escenarios, cada uno demostrando en código real algo que hasta ahora
solo estaba dibujado en los diagramas UML:

  A. Flujo normal: menú -> compra -> descuento de stock -> comprobante
     en Odoo (est-3, est-4, est-5, prov-6 de Flujos-Aliflow-Revision.html).
  B. Concurrencia real: varios hilos comprando el mismo plato con poco
     stock al mismo tiempo, contra el dominio propio de Aliflow
     (PlatoLocal), no contra Odoo — ver plato_local.py para el hallazgo
     de por qué esto NO se puede delegar de forma confiable al ERP
     externo vía RPC (bloqueo optimista real, secuencia-compra-almuerzo.puml).
  C. Patrón Outbox: un adaptador que simula a Alpwin (el ERP de Caramel
     Coffee, sin API pública) fallando, con reintentos hasta marcar el
     evento como FALLIDO
     (ver estado-evento-sincronizacion.puml, objeto-integracion-erp.puml).

Uso:
    1. docker compose up -d
    2. Crear la base de datos manualmente en http://localhost:8069 (ver README.md)
    3. Instalar las apps "Inventario" y "Facturación" desde el menú Apps
    4. Ajustar las variables de entorno de abajo (o exportarlas) y correr:
       python demo.py
"""

import os
from concurrent.futures import ThreadPoolExecutor, as_completed

from odoo_adapter import OdooAdapter
from plato_local import PlatoLocal
from sincronizacion import AlpwinAdapterStub, EventoSincronizacion, SincronizacionWorker

ODOO_URL = os.environ.get("ODOO_URL", "http://localhost:8069")
ODOO_DB = os.environ.get("ODOO_DB", "aliflow")
ODOO_USERNAME = os.environ.get("ODOO_USERNAME", "admin")
ODOO_PASSWORD = os.environ.get("ODOO_PASSWORD", "admin")

MENU_BARU = [
    {"nombre": "Seco de pollo con arroz", "precio": 3.50, "stock": 15},
    {"nombre": "Menestra con carne asada", "precio": 3.75, "stock": 12},
    {"nombre": "Ensalada César con pollo", "precio": 4.00, "stock": 8},
    {"nombre": "Arroz con menestra y carne", "precio": 3.60, "stock": 10},
]


def separador(titulo):
    print("\n" + "=" * 70)
    print(titulo)
    print("=" * 70)


def escenario_a_flujo_normal(adapter):
    separador("ESCENARIO A — Flujo normal: menú -> compra -> comprobante")

    platos = {}
    for item in MENU_BARU:
        pid = adapter.get_or_create_product(item["nombre"], item["precio"])
        adapter.set_stock(pid, item["stock"])
        platos[item["nombre"]] = pid

    print(f"Menú de Barú cargado en Odoo ({len(platos)} platos):\n")
    menu = adapter.get_menu()
    for item in menu:
        if item["name"] in platos:
            print(f"  {item['name']:<32} ${item['list_price']:<6} stock: {item['qty_available']}")

    plato_elegido = "Seco de pollo con arroz"
    product_id = platos[plato_elegido]
    precio = next(i["precio"] for i in MENU_BARU if i["nombre"] == plato_elegido)

    print(f"\nEstudiante compra: '{plato_elegido}'")
    stock_antes = adapter.get_stock(product_id)
    print(f"  Stock antes: {stock_antes}")

    resultado = adapter.reservar_stock(product_id, cantidad=1)
    print(f"  Resultado de reservar_stock: {resultado}")

    customer_id = adapter.get_or_create_default_customer()
    invoice_id = adapter.notify_sale(
        partner_id=customer_id, product_id=product_id, quantity=1, price_unit=precio
    )
    print(f"  Factura creada en Odoo: account.move id={invoice_id}")
    print(f"  Revisar en: {ODOO_URL}/odoo/accounting")

    return platos


def escenario_b_concurrencia():
    separador("ESCENARIO B — Concurrencia real: 5 compras simultáneas, 3 unidades disponibles")

    print(
        "Nota: esta prueba corre contra PlatoLocal (el dominio propio de\n"
        "Aliflow), no contra el stock de Odoo. Ver plato_local.py para el\n"
        "hallazgo de por qué el bloqueo de concurrencia no se puede delegar\n"
        "de forma confiable al ERP externo vía RPC.\n"
    )

    plato = PlatoLocal("Ensalada César con pollo", stock_inicial=3)
    print(f"Stock de '{plato.nombre}' fijado en 3 unidades.")
    print("Lanzando 5 intentos de compra simultáneos (1 unidad cada uno)...\n")

    def intentar_compra(numero):
        return numero, plato.reservar(cantidad=1)

    resultados = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futuros = [executor.submit(intentar_compra, i) for i in range(1, 6)]
        for futuro in as_completed(futuros):
            resultados.append(futuro.result())

    resultados.sort(key=lambda r: r[0])
    exitosos = 0
    for numero, resultado in resultados:
        estado = "OK" if resultado["exito"] else "RECHAZADO"
        detalle = resultado.get("razon", f"version={resultado.get('version')}")
        print(f"  Comprador #{numero}: {estado} ({detalle})")
        if resultado["exito"]:
            exitosos += 1

    print(f"\nResultado: {exitosos} de 5 compras exitosas (stock final: {plato.stock}).")
    if exitosos == 3 and plato.stock == 0:
        print("Correcto: nadie compró más unidades de las que había disponibles.")
    else:
        print("Atención: revisar — no coincide con el comportamiento esperado.")


def escenario_c_outbox_alpwin():
    separador("ESCENARIO C — Patrón Outbox: sincronización con Alpwin (Caramel Coffee, sin API)")

    evento = EventoSincronizacion(tipo_evento="NOTIFICAR_VENTA", payload="ORD-2026-000482")
    worker = SincronizacionWorker(adapter=AlpwinAdapterStub(), max_intentos=3, backoff_segundos=0.3)

    def on_intento(numero, error):
        print(f"  Intento {numero}: falló — {error}")

    print("Procesando evento de sincronización contra Alpwin (simulado)...\n")
    evento_final = worker.procesar(
        evento, tenant_id="caramel-coffee", orden_id="ORD-2026-000482", detalle={}, on_intento=on_intento
    )

    print(f"\nEstado final del evento: {evento_final.estado} (tras {evento_final.intentos} intentos)")
    if evento_final.estado == "FALLIDO":
        print(
            "Correcto: el evento queda visible para reconciliación manual "
            "(UC10) en vez de perderse silenciosamente."
        )


def main():
    print(f"Conectando a Odoo en {ODOO_URL} (db={ODOO_DB})...")
    adapter = OdooAdapter(ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD)
    print(f"Autenticado. uid={adapter.uid}")

    escenario_a_flujo_normal(adapter)
    escenario_b_concurrencia()
    escenario_c_outbox_alpwin()

    separador("Demo completado")
    print("A: menú -> compra -> comprobante en Odoo (ERP real)")
    print("B: concurrencia real resuelta en el dominio propio de Aliflow")
    print("   (hallazgo: NO se puede delegar al ERP externo vía RPC)")
    print("C: patrón Outbox demostrado con el caso real de Alpwin (Caramel Coffee)")


if __name__ == "__main__":
    main()
