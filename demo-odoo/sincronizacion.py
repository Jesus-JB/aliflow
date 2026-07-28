"""
Implementación real (aunque simplificada) del patrón Outbox diseñado en
Hallazgos-Ingenieria-API-Generica.md sección 3.4 y dibujado en
estado-evento-sincronizacion.puml / secuencia-sincronizacion-erp.puml.

En producción, EventoSincronizacion viviría en PostgreSQL y
SincronizacionWorker sería un worker de Celery consumiendo Redis. Aquí
se simula en memoria — el objetivo es demostrar el comportamiento
(reintentos con backoff, marcado de FALLIDO) contra un adaptador real,
no reemplazar la infraestructura de producción.
"""

import time


class AlpwinAdapterStub:
    """
    Simula AlpwinAdapter para el demo: siempre falla, porque Alpwin no
    tiene API pública (confirmado en Hallazgos-Ingenieria-API-Generica.md,
    secciones 2.5 y 4.3). Alpwin es el ERP de Caramel Coffee; Barú usa
    Contífico, que sí tiene API REST. En una implementación real, este adaptador
    escribiría a un archivo o a una base de datos puente en vez de
    lanzar una excepción.
    """

    def notify_sale(self, tenant_id, orden_id, detalle):
        raise ConnectionError(
            f"Alpwin no tiene API pública — no se puede notificar la venta "
            f"{orden_id} directamente. (Simulado para el demo.)"
        )


class EventoSincronizacion:
    def __init__(self, tipo_evento, payload):
        self.tipo_evento = tipo_evento
        self.payload = payload
        self.estado = "PENDIENTE"
        self.intentos = 0


class SincronizacionWorker:
    def __init__(self, adapter, max_intentos=3, backoff_segundos=0.5):
        self.adapter = adapter
        self.max_intentos = max_intentos
        self.backoff_segundos = backoff_segundos

    def procesar(self, evento, tenant_id, orden_id, detalle, on_intento=None):
        """
        Procesa un EventoSincronizacion contra el adaptador, con
        reintentos y backoff, hasta PROCESADO o FALLIDO.
        """
        while evento.estado == "PENDIENTE" and evento.intentos < self.max_intentos:
            evento.intentos += 1
            try:
                self.adapter.notify_sale(tenant_id, orden_id, detalle)
                evento.estado = "PROCESADO"
            except Exception as exc:
                if on_intento:
                    on_intento(evento.intentos, str(exc))
                if evento.intentos < self.max_intentos:
                    time.sleep(self.backoff_segundos)

        if evento.estado == "PENDIENTE":
            evento.estado = "FALLIDO"

        return evento
