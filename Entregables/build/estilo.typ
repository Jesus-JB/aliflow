#set page(paper: "a4", margin: (x: 1.5cm, y: 2cm))
#set par(leading: 0.65em)
#set text(lang: "es")

// Rótulos en español para el índice de tablas y de figuras
#set figure(supplement: [Figura])
#show figure.where(kind: table): set figure(supplement: [Tabla])

// Permitir saltos de página en las tablas
#show figure.where(kind: table): set block(breakable: true)

// Texto general de celdas
#show table.cell: set text(size: 8.5pt)
#show table.cell: set align(top + left)

// Reducir la fuente del código inline (raw) en las tablas
#show table.cell: it => {
  show raw: set text(size: 7.5pt)
  it
}

// Bordes y relleno de celdas
#set table(
  stroke: 0.4pt + luma(150),
  inset: 5pt
)
