/**
 * Cliente de la API. Todas las llamadas van a /api/*, que Next reescribe hacia
 * el backend: la cookie de sesión viaja sola y el JavaScript nunca la ve.
 *
 * El control de acceso lo decide el backend. Lo que la interfaz oculta según el
 * rol es comodidad, no seguridad (RF-03 c3).
 */

export type Rol = "ESTUDIANTE" | "ADMINISTRADOR" | "OPERADOR" | "SUPERADMIN";

export const NOMBRE_ROL: Record<Rol, string> = {
  ESTUDIANTE: "Estudiante",
  ADMINISTRADOR: "Proveedor",
  OPERADOR: "Operador",
  SUPERADMIN: "Super-Admin",
};

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  proveedor_id: string | null;
  destino: string;
};

export type Cuenta = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  punto_entrega_id: string | null;
};

export type CuentaCreada = Cuenta & { password_temporal: string };

export type PuntoEntrega = { id: string; nombre: string; ubicacion: string | null };

export class ErrorApi extends Error {
  constructor(
    public status: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

export async function api<T>(ruta: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api${ruta}`, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!r.ok) {
    let mensaje = "Ocurrió un error. Intenta de nuevo.";
    try {
      const cuerpo = await r.json();
      if (typeof cuerpo.detail === "string") mensaje = cuerpo.detail;
    } catch {
      /* respuesta sin JSON */
    }
    throw new ErrorApi(r.status, mensaje);
  }
  return r.status === 204 ? (undefined as T) : r.json();
}

export const post = <T>(ruta: string, cuerpo?: unknown) =>
  api<T>(ruta, { method: "POST", body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
