#!/usr/bin/env bash
#
# Genera todos los PDF de la carpeta Entregables desde las fuentes de markdown/.
#
#   ./construir.sh              → todo
#   ./construir.sh individuales → solo los PDF sueltos de Entregables/
#   ./construir.sh oficiales    → solo los 5 de "Documento Oficial/"
#
# Requiere: pandoc y typst.
#
# Los PDF NUNCA se editan a mano: son salida de los .md de markdown/.
# Si cambiás un .md, volvé a correr esto o el PDF entregado deja de coincidir
# con su fuente.

set -euo pipefail
cd "$(dirname "$0")/.."          # → Entregables/

MD="markdown"
OFICIAL="Documento Oficial"
ESTILO="build/estilo.typ"
QUE="${1:-todo}"

mkdir -p "$OFICIAL"

# pandoc con los ajustes comunes. $1 = salida, resto = fuentes en orden.
# Una fuente vacía o casi vacía produce un PDF en blanco sin que nada falle.
# Ya pasó una vez: un reemplazo masivo vació un archivo y el PDF salió con una
# sola página. Cortar acá es más barato que descubrirlo al abrir el entregable.
verificar_fuentes() {
  local malas=0
  for f in "$@"; do
    [ -f "$f" ] || { echo "  ERROR: no existe '$f'"; malas=1; continue; }
    local l; l=$(grep -cve '^[[:space:]]*$' "$f")
    if [ "$l" -lt 5 ]; then
      echo "  ERROR: '$f' tiene solo $l líneas con contenido — ¿se vació por accidente?"
      malas=1
    fi
    # Cuando PlantUML falla escribe el informe de error COMO SI FUERA el SVG:
    # el archivo queda con contenido y tamaño normal. Hay que mirar adentro.
    while read -r img; do
      [ -n "$img" ] || continue
      local ruta="$(dirname "$f")/$img"
      [ -f "$ruta" ] || continue
      if grep -qil 'has crashed\|An error has occurred' "$ruta"; then
        echo "  ERROR: '$img' es un volcado de error de PlantUML, no un diagrama."
        malas=1
      fi
    done < <(grep -oE '\]\([^)]*\.svg\)' "$f" | tr -d ']()')
  done
  [ "$malas" -eq 0 ] || { echo "Compilación abortada."; exit 1; }
}

compilar() {
  local salida="$1"; shift
  verificar_fuentes "$@"
  pandoc "$@" -o "$salida" \
    --pdf-engine=typst \
    --include-in-header="$ESTILO" \
    --resource-path=".:$MD:$MD/01-Especificacion-de-Requerimientos:$MD/02-Modelamiento-Parte-Estatica:$MD/03-Modelamiento-Comportamiento" \
    --toc --toc-depth=3
  printf '  %-62s %s\n' "$salida" "$(pdfinfo "$salida" 2>/dev/null | awk '/^Pages/{print $2" págs"}')"
}

# ─── PDF individuales, uno por punto del enunciado ──────────────────────────
# Existen para ver de un vistazo qué cubre cada punto y qué falta. No son lo
# que se entrega: eso está en "Documento Oficial/".
individuales() {
  echo "PDF individuales:"
  local S="$MD/01-Especificacion-de-Requerimientos"
  local E="$MD/02-Modelamiento-Parte-Estatica"
  local C="$MD/03-Modelamiento-Comportamiento"

  compilar "01a-Estructura-del-Documento.pdf"          "$S/00-Portada-e-Indices.md"
  compilar "01b-Requerimientos-Funcionales.pdf"        "$S/02-Requerimientos-Funcionales.md"
  compilar "01c-Requerimientos-No-Funcionales.pdf"     "$S/03-Requerimientos-No-Funcionales.md"
  compilar "01d-Evidencias-de-Levantamiento.pdf"       "$S/05-Evidencias-de-Levantamiento.md"
  compilar "01e-Acta-de-Conformidad.pdf"               "$S/Apendice-B-Acta-de-Conformidad.md"
  compilar "01f-Prototipo.pdf"                         "$S/Apendice-A-Prototipo.md"
  compilar "01g-Gestion-de-Riesgos.pdf"                "$S/06-Gestion-de-Riesgos.md"
  compilar "01g-Sprint-Backlogs-y-Cronograma.pdf"      "$S/07-Sprint-Backlogs-y-Cronograma.md"
  compilar "01h-Contenido-Complementario.pdf"          "$S/01-Introduccion-y-Contexto.md" "$S/04-Alcance-Trazabilidad-y-Decisiones.md"

  compilar "02a-Casos-de-Uso.pdf"                      "$E/a-Casos-de-Uso.md"
  compilar "02b-Diagrama-de-Clases.pdf"                "$E/b-Diagrama-de-Clases.md"
  compilar "02c-Diagramas-de-Objetos.pdf"              "$E/c-Diagramas-de-Objetos.md"
  compilar "02d-Diagrama-de-Componentes.pdf"           "$E/d-Diagrama-de-Componentes.md"
  compilar "02e-Diagrama-de-Despliegue.pdf"            "$E/e-Diagrama-de-Despliegue.md"

  compilar "03a-Diagramas-de-Actividad.pdf"            "$C/a-Diagramas-de-Actividad.md"
  compilar "03b-Diagramas-de-Secuencia.pdf"            "$C/b-Diagramas-de-Secuencia.md"
  compilar "03c-Diagramas-de-Estado.pdf"               "$C/c-Diagramas-de-Estado.md"

  compilar "04-Modelo-de-Base-de-Datos.pdf"            "$MD/04-Modelo-de-Base-de-Datos/Modelo-de-Base-de-Datos.md"
  compilar "05-Mockups.pdf"                            "$MD/05-Mockups/Mockups.md"
}

# ─── Los 5 documentos oficiales que pide el enunciado ───────────────────────
oficiales() {
  echo "Documento Oficial:"
  local S="$MD/01-Especificacion-de-Requerimientos"
  local E="$MD/02-Modelamiento-Parte-Estatica"
  local C="$MD/03-Modelamiento-Comportamiento"

  # El entregable 01 va como UN solo PDF: el enunciado lo pide en singular y
  # con el acta (01.e) y el prototipo (01.f) como apéndices de ese documento.
  compilar "$OFICIAL/01-Especificacion-de-Requerimientos.pdf" \
    "$S/00-Portada-e-Indices.md" \
    "$S/01-Introduccion-y-Contexto.md" \
    "$S/02-Requerimientos-Funcionales.md" \
    "$S/03-Requerimientos-No-Funcionales.md" \
    "$S/04-Alcance-Trazabilidad-y-Decisiones.md" \
    "$S/05-Evidencias-de-Levantamiento.md" \
    "$S/06-Gestion-de-Riesgos.md" \
    "$S/07-Sprint-Backlogs-y-Cronograma.md" \
    "$S/Apendice-A-Prototipo.md" \
    "$S/Apendice-B-Acta-de-Conformidad.md"

  compilar "$OFICIAL/02-Modelamiento-Parte-Estatica.pdf" \
    "$E/a-Casos-de-Uso.md" "$E/b-Diagrama-de-Clases.md" "$E/c-Diagramas-de-Objetos.md" \
    "$E/d-Diagrama-de-Componentes.md" "$E/e-Diagrama-de-Despliegue.md"

  compilar "$OFICIAL/03-Modelamiento-Comportamiento.pdf" \
    "$C/a-Diagramas-de-Actividad.md" "$C/b-Diagramas-de-Secuencia.md" "$C/c-Diagramas-de-Estado.md"

  compilar "$OFICIAL/04-Modelo-de-Base-de-Datos.pdf" "$MD/04-Modelo-de-Base-de-Datos/Modelo-de-Base-de-Datos.md"
  compilar "$OFICIAL/05-Mockups.pdf"                 "$MD/05-Mockups/Mockups.md"
}

case "$QUE" in
  individuales) individuales ;;
  oficiales)    oficiales ;;
  todo)         individuales; echo; oficiales ;;
  *) echo "Uso: $0 [todo|individuales|oficiales]"; exit 1 ;;
esac

cat <<'NOTA'

Recordatorios:
  · Completar la lista de integrantes en
    markdown/01-Especificacion-de-Requerimientos/00-Portada-e-Indices.md
  · Toda tabla nueva necesita su leyenda (una línea ": Título" debajo), o
    aparecerá en blanco en el índice de tablas.
NOTA
