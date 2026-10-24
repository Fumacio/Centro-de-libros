# Centro de libros

Biblioteca web de clásicos con categorías, portadas, buscador, lectura por páginas y audiolibros.

## Correr en local

```bash
npm install
npm run dev
```

Abrí http://localhost:3000.

## Estructura

- `src/data/books.ts`: catálogo de libros (por ahora datos locales).
- `src/data/categories.ts`: categorías.
- `src/lib/search.ts`: buscador (ignora mayúsculas y tildes).
- `src/components/BookCover.tsx`: portada real de Project Gutenberg, o una generada si no carga.
- `src/components/Reader.tsx`: lector por páginas.

## Cargar un libro para leer

Convertí el PDF con el script (necesita `poppler-utils` y Pillow):

```bash
python3 scripts/convertir_pdf.py don-quijote ~/Descargas/quijote.pdf
```

El primer argumento es el `slug` del libro en `src/data/books.ts`. El script guarda el texto por páginas y
las ilustraciones en `public/libros/<slug>/` y habilita el botón **Leer**. Con `--paginas-como-imagen`
también guarda cada página tal cual se ve en el PDF (modo "Página original"); conviene usarlo solo en
libros ilustrados porque ocupa más espacio.

## Próximos pasos

1. Audiolibros con el generador de voces en Python.
