"""La hora oficial del sistema es la de Ecuador, no la del servidor.

El código de retiro vale "el día de la compra" (RN-03) y el local fija su hora
máxima de retiro en hora local (RN-05). Un servidor en UTC cambiaría de día a
las 19:00 de Guayaquil, así que todo cálculo de "hoy" pasa por aquí.
"""

from datetime import date, datetime, time
from zoneinfo import ZoneInfo

from aliflow.config import get_settings


def zona() -> ZoneInfo:
    return ZoneInfo(get_settings().zona_horaria)


def ahora() -> datetime:
    return datetime.now(zona())


def hoy() -> date:
    return ahora().date()


def en_zona(dia: date, hora: time) -> datetime:
    """Un instante del día dado, a la hora dada, en la hora oficial."""
    return datetime.combine(dia, hora, tzinfo=zona())
