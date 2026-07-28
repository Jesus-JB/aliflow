"""
Simula Plato.reservarStock() del dominio propio de Aliflow (PostgreSQL),
tal como está diseñado en diagrama-clases.puml y secuencia-compra-almuerzo.puml.

Por qué existe este archivo (hallazgo real, 27-jul-2026): al intentar
implementar el bloqueo optimista directamente contra el stock de Odoo vía
JSON-RPC (ver OdooAdapter.reservar_stock), una prueba de concurrencia real
con 5 hilos comprando 3 unidades disponibles vendió las 5 — el mecanismo
de "releer y comparar" no cierra la ventana de carrera real, porque no hay
forma de hacer un UPDATE atómico condicionado a una versión sobre una API
RPC externa sin control transaccional propio.

Esto confirma (no contradice) la arquitectura ya diseñada: el control de
concurrencia crítico debe vivir en la base de datos propia de Aliflow
(con una transacción real y un lock a nivel de fila), no delegarse al ERP
externo. El ERP se mantiene sincronizado después, de forma asíncrona, vía
el patrón Outbox (ver sincronizacion.py) — no necesita ser atómico porque
solo refleja una decisión que Aliflow ya tomó de forma segura.

Aquí se simula esa base de datos propia con un lock en memoria
(threading.Lock), que es el equivalente conceptual a "SELECT ... FOR
UPDATE" o "UPDATE ... WHERE version = v" en una transacción real de
PostgreSQL.
"""

import threading


class PlatoLocal:
    def __init__(self, nombre, stock_inicial):
        self.nombre = nombre
        self.stock = stock_inicial
        self.version = 0
        self._lock = threading.Lock()

    def reservar(self, cantidad):
        """
        Atómico de verdad (a diferencia de OdooAdapter.reservar_stock):
        el lock representa la transacción/fila bloqueada que una base de
        datos real otorgaría durante el UPDATE.
        """
        with self._lock:
            if self.stock < cantidad:
                return {"exito": False, "razon": "sin_stock", "stock_visto": self.stock}
            self.stock -= cantidad
            self.version += 1
            return {"exito": True, "stock_resultante": self.stock, "version": self.version}
