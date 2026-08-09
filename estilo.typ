#set page(paper: "a4", margin: (x: 1.8cm, y: 2.2cm))
#set par(leading: 0.65em)

// Permitir saltos de página en el contenedor de las tablas
#show figure: set block(breakable: true)

// Añadir espacio interno (padding) en las celdas y alinear al tope
#set table(inset: 6pt)
#show table.cell: set align(top + left)
