# Marca Aliflow

Logo y paleta. Todo lo visual del proyecto —mockups de Figma y prototipo web— sale de aquí.

| Archivo | Qué es |
|---|---|
| `logo-aliflow-original.jpeg` | El archivo tal como lo entregó el equipo. Es la fuente de verdad del color |
| `logo-aliflow.svg` | El mismo logo redibujado en vector. **Es el que se usa** |

## Por qué se redibujó en vector

El JPEG original trae un fondo gris (`#F7F7F7`) que se vería como un recuadro sobre cualquier color, y al ampliarlo pierde nitidez. En vector escala sin degradarse, se puede recolorear (en blanco sobre fondos oscuros) y pesa unos cientos de bytes.

Las formas son las mismas: bolsa con asa, campana cubreplatos y tres líneas de velocidad.

## Colores del logo

Muestreados del archivo original:

| | Hex | Dónde |
|---|---|---|
| Verde | `#74AB68` | Bolsa y campana |
| Azul | `#7AB7D3` | Líneas de velocidad |

## Paleta derivada

Los dos colores del logo no alcanzan para una interfaz. Se construyó una escala alrededor de ellos, con dos decisiones que conviene conocer:

**1. El verde del logo no se usa para botones con texto blanco.** Da **2.6:1** de contraste, muy por debajo del **4.5:1** que exige WCAG AA para texto normal. Por eso las acciones usan un verde más profundo y el verde del logo queda para superficies grandes, la marca y elementos decorativos.

**2. El color de "éxito" dejó de ser verde.** Con una marca verde, un badge verde de "Entregado" deja de leerse como señal de estado y se confunde con el color de la aplicación. Pasó a un **teal**, que sigue leyéndose como positivo pero se distingue.

| Token | Hex | Contraste sobre blanco | Uso |
|---|---|---|---|
| `brand` | `#46833B` | 4.6:1 ✅ | Acciones primarias |
| `brandLight` | `#74AB68` | 2.6:1 ⚠️ | **El verde del logo.** Solo superficies y marca |
| `brandDeep` | `#2F6B2A` | 7.4:1 ✅ | Énfasis en texto |
| `brandBg` | `#E9F3E6` | — | Fondo suave |
| `accent` | `#7AB7D3` | — | **El azul del logo.** Decorativo |
| `successText` | `#0F7B62` | 5.2:1 ✅ | Teal, para no confundirse con la marca |
| `infoText` | `#2A7295` | 5.2:1 ✅ | Azul legible de la familia del logo |
| `warnText` | `#9A5B00` | 6.4:1 ✅ | Sin cambio |
| `errorText` | `#C4321F` | 5.9:1 ✅ | Sin cambio |
| `admin` | `#2C5F73` | 7.0:1 ✅ | Rol Super-Admin, azul profundo del logo |

## Dónde vive cada cosa

- **Prototipo web:** `mockups/prototipo-web/src/app/tokens.ts` es la fuente única; los cuatro roles la importan. El logo es el componente `AliflowLogo`.
- **Figma:** la colección de variables `Aliflow · Color`. Cambiar un valor ahí recolorea todas las pantallas que lo tengan ligado, sin tocar cada frame.

## Si hay que cambiar la marca otra vez

1. Actualizar los valores en `tokens.ts` y en las variables de Figma.
2. Verificar el contraste de cualquier color nuevo que lleve texto encima antes de usarlo.
3. Re-exportar los PNG de `mockups/`.
