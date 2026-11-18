import { C, FUENTE_TITULOS } from "@/lib/tokens";

/**
 * Logo de Aliflow según la propuesta de marca: la bolsa sólida (el retiro), la
 * campana (la cocina del campus) y las líneas de movimiento (el flujo).
 *
 * Es una versión vectorial de trabajo. Cuando Negocios comparta los archivos
 * originales, se reemplaza por el SVG oficial sin tocar quien lo usa.
 */
export function AliflowLogo({
  size = 48,
  verde = C.green,
  lineas = C.accent,
  interior = "#FFFFFF",
}: {
  size?: number;
  /** Color de la bolsa. */
  verde?: string;
  /** Color de las líneas de movimiento. */
  lineas?: string;
  /** Color de la campana dentro de la bolsa. */
  interior?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Aliflow">
      <g fill={lineas}>
        <rect x="4" y="52" width="16" height="6" rx="3" />
        <rect x="0" y="63" width="18" height="6" rx="3" />
        <rect x="8" y="74" width="10" height="6" rx="3" />
      </g>
      <path
        d="M39 32 V27 A11 11 0 0 1 61 27 V32"
        stroke={verde}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />
      <path d="M27 32 H73 Q77 32 77.4 36 L80.6 86 Q81 92 75 92 H25 Q19 92 19.4 86 L22.6 36 Q23 32 27 32 Z" fill={verde} />
      <g fill={interior}>
        <circle cx="50" cy="53" r="3.6" />
        <path d="M34 73 A16 16 0 0 1 66 73 Z" />
        <rect x="30" y="74" width="40" height="5.5" rx="2.75" />
      </g>
    </svg>
  );
}

/** El logo completo: el ícono y la palabra "aliflow" inclinada hacia adelante. */
export function AliflowMarca({
  size = 36,
  sobreOscuro = false,
}: {
  size?: number;
  /** Sobre navy: "ali" en blanco y la bolsa en verde. */
  sobreOscuro?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2" aria-label="Aliflow">
      <AliflowLogo size={size} />
      <span
        aria-hidden
        style={{
          fontFamily: FUENTE_TITULOS,
          fontWeight: 800,
          fontStyle: "italic",
          fontSize: size * 0.72,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        <span style={{ color: sobreOscuro ? "#FFFFFF" : C.navy }}>ali</span>
        <span style={{ color: C.green }}>flow</span>
      </span>
    </span>
  );
}
