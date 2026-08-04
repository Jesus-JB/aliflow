import { C } from "../tokens";

/**
 * Logo de Aliflow, redibujado como vector.
 *
 * Se recrea en SVG en vez de incrustar el JPEG original porque el archivo trae
 * un fondo gris (#F7F7F7) que se vería como un recuadro sobre cualquier color,
 * y porque en vector escala sin perder nitidez y se puede recolorear.
 *
 * Fuente: mockups/marca/logo-aliflow.svg
 */
export function AliflowLogo({
  size = 48,
  verde = C.brandLight,
  azul = C.accent,
}: {
  size?: number;
  /** Color del cuerpo (bolsa y campana). */
  verde?: string;
  /** Color de las líneas de velocidad. */
  azul?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Aliflow">
      <g stroke={azul} strokeWidth={7} strokeLinecap="round" fill="none">
        <path d="M15 57 H32" />
        <path d="M5 65 H28" />
        <path d="M16 73 H26" />
      </g>
      <path
        d="M36 31 V26 A14 14 0 0 1 64 26 V31"
        stroke={verde} strokeWidth={7} strokeLinecap="round" fill="none"
      />
      <path
        d="M25 52 L25 31 L79 31 L82 86 L25 86 L25 77"
        stroke={verde} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" fill="none"
      />
      <g fill={verde}>
        <rect x="47" y="52" width="6" height="7" rx="3" />
        <path d="M34 72 A16 16 0 0 1 66 72 Z" />
        <rect x="30" y="72" width="40" height="7" rx="3.5" />
      </g>
    </svg>
  );
}

/**
 * El logo dentro de una pastilla redondeada, como se usa en las pantallas de
 * login. Sobre fondo oscuro el logo se dibuja en blanco y en el azul del logo,
 * porque el verde de marca no contrasta lo suficiente.
 */
export function AliflowLogoMark({
  size = 84,
  fondo = C.brandBg,
  sobreOscuro = false,
}: {
  size?: number;
  fondo?: string;
  sobreOscuro?: boolean;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: fondo,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <AliflowLogo
        size={size * 0.72}
        verde={sobreOscuro ? "#FFFFFF" : C.brandLight}
        azul={sobreOscuro ? C.accent : C.accent}
      />
    </div>
  );
}
