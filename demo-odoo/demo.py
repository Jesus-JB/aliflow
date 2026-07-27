"""
Demo de integración Aliflow <-> Odoo Community, usando OdooAdapter.

Simula el recorrido documentado en Flujos-Aliflow-Revision.html:
  est-3 (consulta del menú) -> est-4 (compra) -> est-5 (actualización de
  inventario) -> prov-6 (comprobante / re-emisión de factura).

Uso:
    1. docker compose up -d
    2. Crear la base de datos manualmente en http://localhost:8069 (ver README.md)
    3. Instalar las apps "Inventario" y "Facturación" desde el menú Apps
    4. Ajustar las variables de entorno de abajo (o exportarlas) y correr:
       python demo.py
"""

import os

from odoo_adapter import OdooAdapter

ODOO_URL = os.environ.get("ODOO_URL", "http://localhost:8069")
ODOO_DB = os.environ.get("ODOO_DB", "aliflow")
ODOO_USERNAME = os.environ.get("ODOO_USERNAME", "admin")
ODOO_PASSWORD = os.environ.get("ODOO_PASSWORD", "admin")

PRODUCT_NAME = "Almuerzo del día - Menú Demo"
PRODUCT_PRICE = 3.50
STOCK_INICIAL = 20


def main():
    print(f"Conectando a Odoo en {ODOO_URL} (db={ODOO_DB})...")
    adapter = OdooAdapter(ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD)
    print(f"Autenticado. uid={adapter.uid}\n")

    # --- prov-3: administración del menú (dato maestro ya cargado por el proveedor) ---
    product_id = adapter.get_or_create_product(PRODUCT_NAME, PRODUCT_PRICE)
    adapter.set_stock(product_id, STOCK_INICIAL)
    print(f"Producto listo: '{PRODUCT_NAME}' (id={product_id}), stock inicial={STOCK_INICIAL}\n")

    # --- est-3: consulta del menú del día ---
    print("== est-3: Estudiante consulta el menú del día ==")
    menu = adapter.get_menu()
    for item in menu:
        if item["id"] == product_id:
            print(f"  {item['name']} — ${item['list_price']} — stock: {item['qty_available']}")
    print()

    # --- est-4: compra del almuerzo ---
    print("== est-4: Estudiante compra 1 unidad ==")
    stock_antes = adapter.get_stock(product_id)
    print(f"  Stock antes de la compra: {stock_antes}")

    customer_id = adapter.get_or_create_default_customer()

    # --- est-5: actualización de inventario (descuento de stock) ---
    nuevo_stock = adapter.update_stock(product_id, delta=-1)
    print(f"  Stock después de la compra (est-5): {nuevo_stock}")

    # --- prov-6: comprobante de compra / re-emisión de factura ---
    invoice_id = adapter.notify_sale(
        partner_id=customer_id,
        product_id=product_id,
        quantity=1,
        price_unit=PRODUCT_PRICE,
    )
    print(f"  Factura creada en Odoo (prov-6): account.move id={invoice_id}")
    print(f"  Revisar en: {ODOO_URL}/odoo/accounting\n")

    print("Demo completado: menú -> compra -> descuento de stock -> comprobante en Odoo.")


if __name__ == "__main__":
    main()
