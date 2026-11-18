/**
 * Tokens de color de Aliflow, según la propuesta de marca de Negocios
 * (noviembre de 2026). Fuente única para los cuatro roles.
 *
 * Paleta de la marca:
 *   Flow Green #5BA150 · Campus Navy #1F4A5F (colores clave)
 *   Fresh Mint #DCEDD3 · Sky Blue #8EC3DC · Ready Amber #F2A93B
 *
 * Una regla al usarla, por accesibilidad (WCAG AA pide 4.5:1 para texto):
 * el texto blanco sobre Flow Green da 3.2:1, sobre Amber 2.0:1 y sobre Sky
 * 1.9:1. Por eso:
 *   - las acciones principales van en Campus Navy (9.5:1);
 *   - un botón verde usa `greenAction`, un tono más profundo del mismo verde (5.0:1);
 *   - Flow Green queda para el logo, íconos y superficies grandes;
 *   - Amber y Sky se usan como fondo, siempre con texto oscuro encima.
 */
export const C = {
  // ── Marca ────────────────────────────────────────────────────────────────
  navy: "#1F4A5F",
  navyDeep: "#163847",
  green: "#5BA150",
  /** Verde para botones con texto blanco. 5.0:1 */
  greenAction: "#3D7D34",
  /** Verde para texto sobre blanco o mint. 6.5:1 */
  greenText: "#2F6B2A",
  mint: "#DCEDD3",
  sky: "#8EC3DC",
  amber: "#F2A93B",

  /** Acciones primarias: Campus Navy. */
  brand: "#1F4A5F",
  /** El verde exacto del logo. */
  brandLight: "#5BA150",
  /** Énfasis verde en texto. */
  brandDeep: "#2F6B2A",
  /** Fondo suave de marca: Fresh Mint. */
  brandBg: "#DCEDD3",
  /** Las líneas de movimiento del logo: Sky Blue. */
  accent: "#8EC3DC",

  // ── Texto y superficies ──────────────────────────────────────────────────
  text: "#14232B",
  textSec: "#52626B",
  textMuted: "#8B99A1",
  pageBg: "#F4F7F3",
  card: "#FFFFFF",
  sunken: "#ECF1EA",
  border: "#E1E8DE",
  borderStrong: "#C3CEC0",

  // ── Estados ──────────────────────────────────────────────────────────────
  successText: "#2F6B2A",
  successBg: "#DCEDD3",
  /** Texto oscuro sobre Ready Amber suave. 5.4:1 */
  warnText: "#8A5300",
  warnBg: "#FCEBCF",
  errorText: "#B42E1D",
  errorBg: "#FCE6E2",
  infoText: "#1F4A5F",
  infoBg: "#E2F0F7",

  // ── Super-Admin ──────────────────────────────────────────────────────────
  admin: "#1F4A5F",
  adminBg: "#E2F0F7",
} as const;

export const FUENTE_TITULOS = "var(--font-poppins), system-ui, sans-serif";
