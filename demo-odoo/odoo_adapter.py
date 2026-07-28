"""
OdooAdapter — implementación concreta de IInventoryProvider contra Odoo Community,
usando su API externa vía JSON-RPC (execute_kw sobre /jsonrpc).

Este adaptador es la prueba de concepto del patrón descrito en
Hallazgos-Ingenieria-API-Generica.md, sección 3.1: el core de Aliflow solo
debería depender de estos métodos (get_menu / get_stock / update_stock /
notify_sale), nunca de los modelos internos de Odoo directamente.

Nota (confirmado en vivo): se usa JSON-RPC en vez de XML-RPC porque algunos
métodos de Odoo (ej. action_apply_inventory) devuelven None, y el protocolo
XML-RPC no puede serializar None ("cannot marshal None unless allow_none is
enabled") — JSON sí lo soporta de forma nativa.
"""

import json
import urllib.request


class OdooAdapter:
    def __init__(self, url, db, username, password):
        self.url = url.rstrip("/")
        self.db = db
        self.username = username
        self.password = password

        self.uid = self._json_rpc("common", "authenticate", [db, username, password, {}])
        if not self.uid:
            raise RuntimeError(
                "Autenticación con Odoo falló. Revisa ODOO_DB / ODOO_USERNAME / "
                "ODOO_PASSWORD (o API key) y que la base de datos ya exista."
            )

    def _json_rpc(self, service, method, args):
        payload = {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {"service": service, "method": method, "args": args},
            "id": 0,
        }
        req = urllib.request.Request(
            f"{self.url}/jsonrpc",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read())
        if body.get("error"):
            raise RuntimeError(body["error"])
        # Odoo omite la clave "result" por completo cuando el método llamado
        # no retorna nada (ej. action_apply_inventory) — no es un error.
        return body.get("result")

    def _call(self, model, method, args, kwargs=None):
        return self._json_rpc(
            "object",
            "execute_kw",
            [self.db, self.uid, self.password, model, method, args, kwargs or {}],
        )

    # ---------------- IInventoryProvider ----------------

    def get_menu(self):
        """Lista los productos vendibles como 'menú del día', con precio y stock."""
        ids = self._call("product.product", "search", [[["sale_ok", "=", True]]])
        fields = ["id", "name", "list_price", "qty_available"]
        return self._call("product.product", "read", [ids], {"fields": fields})

    def get_stock(self, product_id):
        """Stock disponible de un producto (campo calculado qty_available)."""
        result = self._call(
            "product.product", "read", [[product_id]], {"fields": ["qty_available"]}
        )
        return result[0]["qty_available"]

    def set_stock(self, product_id, quantity):
        """
        Fija el stock absoluto de un producto en su ubicación interna principal,
        vía un ajuste de inventario sobre stock.quant.

        No verificado en vivo: 'inventory_mode' en el contexto y el método
        action_apply_inventory son el mecanismo documentado por la comunidad de
        Odoo para ajustes vía RPC — confirmar contra la versión real antes del demo.
        """
        location_id = self._get_internal_location_id()

        quant_ids = self._call(
            "stock.quant",
            "search",
            [[["product_id", "=", product_id], ["location_id", "=", location_id]]],
        )

        if quant_ids:
            self._call(
                "stock.quant",
                "write",
                [quant_ids, {"inventory_quantity": quantity}],
                {"context": {"inventory_mode": True}},
            )
        else:
            quant_ids = [
                self._call(
                    "stock.quant",
                    "create",
                    [
                        {
                            "product_id": product_id,
                            "location_id": location_id,
                            "inventory_quantity": quantity,
                        }
                    ],
                    {"context": {"inventory_mode": True}},
                )
            ]

        self._call("stock.quant", "action_apply_inventory", [quant_ids])
        return self.get_stock(product_id)

    def update_stock(self, product_id, delta):
        """Descuenta (delta negativo) o incrementa (delta positivo) stock."""
        current = self.get_stock(product_id)
        return self.set_stock(product_id, current + delta)

    def reservar_stock(self, product_id, cantidad, max_intentos=5):
        """
        Intenta aproximar el bloqueo optimista diseñado en
        secuencia-compra-almuerzo.puml, pero contra la API externa de Odoo.

        ADVERTENCIA (hallazgo real, 27-jul-2026, ver demo.py y
        plato_local.py): una prueba con 5 hilos comprando concurrentemente
        con solo 3 unidades de stock en Odoo terminó vendiendo las 5 — este
        método NO ofrece atomicidad real. La relectura antes de escribir no
        cierra la ventana de carrera (el conflicto real ocurre entre esa
        relectura y el `set_stock`, que sigue sin protección).

        Conclusión: el control de concurrencia crítico NO debe delegarse al
        ERP externo vía RPC — debe vivir en la base de datos propia de
        Aliflow (transacción real + lock de fila, ver Plato.version en
        diagrama-clases.puml y PlatoLocal en plato_local.py). Este método se
        deja en el adaptador solo como sincronización de "mejor esfuerzo"
        hacia Odoo, nunca como mecanismo de bloqueo.
        """
        for intento in range(1, max_intentos + 1):
            stock_inicial = self.get_stock(product_id)
            if stock_inicial < cantidad:
                return {
                    "exito": False,
                    "razon": "sin_stock",
                    "intento": intento,
                    "stock_visto": stock_inicial,
                }

            stock_justo_antes_de_escribir = self.get_stock(product_id)
            if stock_justo_antes_de_escribir != stock_inicial:
                # Alguien más modificó el stock en el intervalo: reintentar
                # con una lectura fresca, igual que en el diagrama de secuencia.
                continue

            nuevo_stock = self.set_stock(product_id, stock_justo_antes_de_escribir - cantidad)
            return {
                "exito": True,
                "intento": intento,
                "stock_resultante": nuevo_stock,
            }

        return {"exito": False, "razon": "conflicto_no_resuelto", "intentos": max_intentos}

    def notify_sale(self, partner_id, product_id, quantity, price_unit):
        """
        Crea una factura de venta (account.move, move_type=out_invoice) simulando
        el comprobante de compra. Equivalente al 'notifySale' de IInventoryProvider.
        """
        invoice_id = self._call(
            "account.move",
            "create",
            [
                {
                    "move_type": "out_invoice",
                    "partner_id": partner_id,
                    "invoice_line_ids": [
                        (
                            0,
                            0,
                            {
                                "product_id": product_id,
                                "quantity": quantity,
                                "price_unit": price_unit,
                            },
                        )
                    ],
                }
            ],
        )
        return invoice_id

    # ---------------- Helpers de datos maestros ----------------

    def get_or_create_product(self, name, price):
        ids = self._call("product.product", "search", [[["name", "=", name]]])
        if ids:
            return ids[0]
        return self._call(
            "product.product",
            "create",
            [{"name": name, "list_price": price, "sale_ok": True, "type": "product"}],
        )

    def get_or_create_default_customer(self, name="Consumidor Final Aliflow"):
        ids = self._call("res.partner", "search", [[["name", "=", name]]])
        if ids:
            return ids[0]
        return self._call("res.partner", "create", [{"name": name}])

    def _get_internal_location_id(self):
        ids = self._call(
            "stock.location", "search", [[["usage", "=", "internal"]]], {"limit": 1}
        )
        if not ids:
            raise RuntimeError(
                "No se encontró una ubicación interna de stock. "
                "¿Está instalada la app 'Inventario' en esta instancia de Odoo?"
            )
        return ids[0]
