"""Reglas de negocio de la operación diaria: billetera, compra, retiro y fidelidad.

Los routers traducen HTTP; aquí vive lo que el acta exige. Cada función recibe
`cuando` para que las pruebas y la siembra de datos de demostración puedan
fijar el instante sin tocar el reloj.
"""


class ErrorDeNegocio(Exception):
    """Una regla del acta impide la operación. `codigo` es el estado HTTP."""

    def __init__(self, codigo: int, mensaje: str):
        super().__init__(mensaje)
        self.codigo = codigo
        self.mensaje = mensaje
