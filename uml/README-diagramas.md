# Diagramas UML — cómo verlos y regenerarlos

Todos los diagramas del proyecto se escriben en **PlantUML** (`.puml`) — es la fuente editable y la que realmente cuenta como el diseño. GitHub no renderiza `.puml` como imagen (solo lo muestra como texto), así que junto a cada `.puml` se commitea también un `.svg` ya renderizado, que sí se ve directamente en GitHub y en el markdown que lo referencia (`![...](archivo.svg)`).

**Regla:** si editas un `.puml`, vuelve a generar su `.svg` antes de commitear — si no, el diagrama visible queda desactualizado respecto al código fuente.

## Opción 1 — Script incluido (recomendado, ya probado)

```bash
pip3 install plantuml
python3 render.py casos-de-uso.puml
```

Esto genera/actualiza `casos-de-uso.svg` en la misma carpeta, usando el servidor público de PlantUML (`plantuml.com`). Funciona con cualquier archivo `.puml` de esta carpeta — cuando agreguemos el diagrama de clases, de secuencia, etc., se renderizan igual.

## Opción 2 — VS Code

Instala la extensión **"PlantUML" (autor: jebbs)**. Abre el `.puml` y usa `Alt+D` para previsualizar en vivo, o el comando "PlantUML: Export Current Diagram" (elige formato SVG) para generar el archivo.

## Opción 3 — Manual (sin instalar nada)

Copia el contenido del `.puml` y pégalo en https://www.plantuml.com/plantuml/uml/ — te da una previsualización y links de descarga en PNG/SVG.
