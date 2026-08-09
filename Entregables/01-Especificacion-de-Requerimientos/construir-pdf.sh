#!/usr/bin/env bash
#
# Ensambla las piezas de esta carpeta en el PDF único que exige el entregable 01.
#
# Por qué existe: el PDF de entregables pide "el documento de especificación de
# requerimientos del sistema de software (en formato pdf)" — en singular — y la
# rúbrica premia con 3 puntos la "estructura del documento". Mantener las piezas
# separadas facilita repartir el trabajo y revisar; este script produce el
# entregable consolidado a partir de ellas, así no hay dos fuentes de verdad.
#
# Uso:  ./construir-pdf.sh
# Requiere: pandoc y typst.

set -euo pipefail
cd "$(dirname "$0")"

SALIDA="Aliflow-Especificacion-de-Requerimientos.pdf"

# El orden importa: es el orden en que se lee el documento entregado.
PIEZAS=(
  "00-Portada-e-Indices.md"
  "01-Introduccion-y-Contexto.md"
  "02-Requerimientos-Funcionales.md"
  "03-Requerimientos-No-Funcionales.md"
  "04-Alcance-Trazabilidad-y-Decisiones.md"
  "05-Evidencias-de-Levantamiento.md"
  "06-Gestion-de-Riesgos.md"
  "07-Sprint-Backlogs-y-Cronograma.md"
  "Apendice-A-Prototipo.md"
  "Apendice-B-Acta-de-Conformidad.md"
)

for f in "${PIEZAS[@]}"; do
  [ -f "$f" ] || { echo "ERROR: falta la pieza '$f'"; exit 1; }
done

echo "Ensamblando ${#PIEZAS[@]} piezas…"

# Se concatena a un temporal en vez de pasarle los N archivos a pandoc, para
# poder insertar el salto de página entre piezas y quitar las cabeceras de
# navegación (las citas '> **Entregable …**'), que sirven en GitHub pero
# estorban en el PDF entregado.
TMP="$(mktemp -t aliflow-srs).md"
trap 'rm -f "$TMP"' EXIT

primera=1
for f in "${PIEZAS[@]}"; do
  [ $primera -eq 1 ] || printf '\n\n\\newpage\n\n' >> "$TMP"
  primera=0
  # Quita el bloque de cabecera: la cita inicial y el separador que le sigue.
  awk '
    NR<=3 && /^> \*\*Entregable/ { saltando=1; next }
    saltando && /^>/            { next }
    saltando && /^[[:space:]]*$/ { next }
    saltando && /^---[[:space:]]*$/ { saltando=0; next }
    { saltando=0; print }
  ' "$f" >> "$TMP"
done

pandoc "$TMP" \
  -o "$SALIDA" \
  --pdf-engine=typst \
  --include-in-header=estilo.typ \
  --toc --toc-depth=3

echo "Listo: $SALIDA"
pdfinfo "$SALIDA" 2>/dev/null | grep -E '^(Pages|File size)' || true

cat <<'NOTA'

Pendiente para cumplir el entregable 01.a por completo:
  · Completar la lista de integrantes en 00-Portada-e-Indices.md.
  · Índice de tablas e índice de figuras. La tabla de contenido ya la genera
    --toc; los otros dos índices exigen que cada tabla y figura lleve rótulo
    ("Tabla 1: …", "Figura 1: …"). Hoy el documento no las rotula.
NOTA
