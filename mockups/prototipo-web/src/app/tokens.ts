/**
 * Tokens de color de Aliflow — fuente única para los cuatro roles.
 *
 * Derivados del logo (mockups/marca/logo-aliflow.svg):
 *   verde #74AB68 · azul #7AB7D3
 *
 * Dos decisiones que conviene conocer antes de tocar esto:
 *
 * 1. El verde del logo NO se usa para botones con texto blanco. Da 2.6:1 de
 *    contraste, muy por debajo del 4.5:1 que exige WCAG AA. Por eso `brand`
 *    (acciones) es un verde más profundo y `brandLight` es el verde del logo,
 *    reservado para superficies grandes, la marca y elementos decorativos.
 *
 * 2. `success` dejó de ser verde y pasó a ser teal. Con una marca verde, un
 *    badge verde de "Entregado" deja de leerse como señal de estado y se
 *    confunde con el color de la aplicación.
 */
export const C = {
  // ── Marca ────────────────────────────────────────────────────────────────
  /** Acciones primarias. Contraste 4.6:1 sobre blanco. */
  brand: "#46833B",
  /** El verde exacto del logo. Superficies grandes y la marca. */
  brandLight: "#74AB68",
  /** Énfasis en texto sobre fondo claro. */
  brandDeep: "#2F6B2A",
  /** Fondo suave de marca. */
  brandBg: "#E9F3E6",
  /** El azul exacto del logo. Decorativo. */
  accent: "#7AB7D3",

  // ── Texto y superficies ──────────────────────────────────────────────────
  text: "#14161A",
  textSec: "#5A6472",
  textMuted: "#98A1AE",
  pageBg: "#F5F6F8",
  card: "#FFFFFF",
  sunken: "#EDEFF3",
  border: "#E4E7EC",
  borderStrong: "#C6CCD6",

  // ── Estados ──────────────────────────────────────────────────────────────
  /** Teal, no verde: tiene que distinguirse de la marca. 5.2:1 */
  successText: "#0F7B62",
  successBg: "#DCF2EC",
  warnText: "#9A5B00",
  warnBg: "#FDF0DC",
  errorText: "#C4321F",
  errorBg: "#FCE6E2",
  /** Azul legible, de la misma familia que el azul del logo. 5.2:1 */
  infoText: "#2A7295",
  infoBg: "#E4F1F8",

  // ── Super-Admin ──────────────────────────────────────────────────────────
  /** Azul profundo de la familia del logo. Distingue el rol de plataforma
   *  sin salirse de la paleta. 7:1 sobre blanco. */
  admin: "#2C5F73",
  adminBg: "#E3EDF2",
} as const;
