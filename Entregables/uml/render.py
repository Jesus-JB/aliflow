"""
Renderiza uno o más archivos .puml a .svg usando el servidor público de PlantUML.

Requiere: pip3 install plantuml

Uso:
    python3 render.py casos-de-uso.puml
    python3 render.py *.puml
"""

import subprocess
import sys
from pathlib import Path

import plantuml


def render(puml_path):
    puml_path = Path(puml_path)
    svg_path = puml_path.with_suffix(".svg")
    text = puml_path.read_text(encoding="utf-8")
    encoded = plantuml.deflate_and_encode(text)
    url = f"http://www.plantuml.com/plantuml/svg/{encoded}"

    result = subprocess.run(
        ["curl", "-sL", "-o", str(svg_path), "-w", "%{http_code}", url],
        capture_output=True,
        text=True,
    )

    if result.stdout.strip() != "200":
        print(f"ERROR renderizando {puml_path}: HTTP {result.stdout}", file=sys.stderr)
        sys.exit(1)
    print(f"OK: {svg_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 render.py archivo1.puml [archivo2.puml ...]")
        sys.exit(1)
    for path in sys.argv[1:]:
        render(path)
