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

const conCuerpo =
  (method: string) =>
  <T>(ruta: string, cuerpo?: unknown) =>
    api<T>(ruta, { method, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });

export const post = conCuerpo("POST");
export const put = conCuerpo("PUT");
export const patch = conCuerpo("PATCH");

// ── Operación ───────────────────────────────────────────────────────────────

export type LocalResumen = { id: string; nombre: string; hora_maxima_retiro: string; saldo: string };

export type PlatoMenu = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  emoji: string | null;
  disponible: boolean;
};

export type Cartilla = {
  sellos: number;
  requeridos: number;
  premio: string;
  completa: boolean;
  vence: string | null;
  max_sellos_por_dia: number;
};

export type LocalDetalle = LocalResumen & {
  recibe_pedidos: boolean;
  menu: PlatoMenu[];
  cartilla: Cartilla | null;
};

export type EstadoOrden = "COMPRADO" | "ENTREGADO" | "EXPIRADO";
export type EstadoCodigo = "VALIDO" | "UTILIZADO" | "VENCIDO";

export type Orden = {
  id: string;
  numero: string;
  proveedor_id: string;
  estado: EstadoOrden;
  codigo: string;
  estado_codigo: EstadoCodigo;
  fecha_hora: string;
  hora_maxima_retiro: string;
  subtotal: string;
  descuento: string;
  motivo_descuento: string | null;
  total: string;
  es_canje: boolean;
  entregado_en: string | null;
  lineas: { plato: string; emoji: string | null; cantidad: number; precio_unitario: string }[];
  estudiante: string | null;
};

export type Sello = {
  acreditado: boolean;
  sellos: number;
  requeridos: number;
  completa: boolean;
  motivo: string | null;
};

export type PlatoLocal = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  emoji: string | null;
  activo: boolean;
  stock_erp: number;
  cupo_asignado: number;
  cupo_vendido: number;
};

export type Fidelidad = {
  activo: boolean;
  sellos_requeridos: number;
  descripcion_premio: string;
  max_sellos_por_dia: number;
  vigencia_cartilla_dias: number | null;
};

export type PanelLocal = {
  actualizado: string;
  ventas: string;
  ordenes: number;
  entregadas: number;
  por_retirar: number;
  vencidas: number;
  recargas: string;
  canjes: number;
  costo_premios: string;
  rechazos_por_cupo: number;
  rechazos_por_saldo: number;
  hora_pico: number | null;
  por_hora: { hora: number; ordenes: number }[];
  platos: {
    id: string;
    nombre: string;
    emoji: string | null;
    vendidos: number;
    cupo_asignado: number;
    cupo_restante: number;
    perdidas_por_agotado: number;
    alerta: string | null;
  }[];
};

// ── Formato ─────────────────────────────────────────────────────────────────

export const dinero = (x: string | number) => `$${Number(x).toFixed(2)}`;

/** La hora de un instante, en la hora oficial de Ecuador. */
export const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Guayaquil",
  });

export const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-EC", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "America/Guayaquil",
  });

/** "482915" → "482 915": se lee y se dicta mejor en dos grupos (RNF-P-02). */
export const codigoLegible = (c: string) => `${c.slice(0, 3)} ${c.slice(3)}`;
