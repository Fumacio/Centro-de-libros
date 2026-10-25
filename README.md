# Centro de libros

Biblioteca web de clásicos con categorías, portadas, buscador, lectura por páginas y audiolibros.

## Correr en local

```bash
npm install
npm run dev
```

Abrí http://localhost:3000.

Sin base de datos el sitio funciona igual, pero sin cuentas. Para tener cuentas en local, copiá
`.env.example` a `.env.local` y poné la `DATABASE_URL` de Neon.

## Estructura

- `src/data/books.ts`: catálogo de libros (por ahora datos locales).
- `src/app/para-ti/page.tsx`: feed de recomendaciones de cada usuario.
- `src/data/categories.ts`: categorías.
- `src/lib/search.ts`: buscador (ignora mayúsculas y tildes).
- `src/components/BookCover.tsx`: portada real de Project Gutenberg, o una generada si no carga.
- `src/components/Reader.tsx`: lector por páginas, con modo **Escuchar**.
- `src/lib/narration.ts`: narración párrafo por párrafo (audio generado o voz del navegador).

## Cuentas y recomendaciones

- Registro e inicio de sesión con email y contraseña (`src/lib/auth.ts`, `src/app/cuenta/actions.ts`).
  La contraseña se guarda con scrypt y la sesión es una cookie de 30 días.
- La base es Postgres en Neon. Las tablas están en `db/schema.sql` (se puede volver a correr sin romper nada).
- Con cuenta se guarda qué libros abrió y en qué página va (`lecturas`), lo que busca (`busquedas`) y los
  libros que guarda con ☆ (`favoritos`). El progreso se sincroniza entre dispositivos.
- **Para ti** (`/para-ti`, y un resumen en el inicio) recomienda libros que todavía no leyó, según las
  categorías y autores de lo que leyó, guardó y buscó (`src/lib/recommend.ts`). Lo reciente pesa más, y
  una categoría muy común (como Clásicos) pesa menos que una rara.

## Publicar en Vercel

1. En https://vercel.com/new importá el repo `Fumacio/Centro-de-libros` (Vercel detecta Next.js solo).
2. En **Environment Variables** agregá `DATABASE_URL` con la cadena de conexión de Neon
   (Neon → proyecto `centro-de-libros` → **Connect**).
3. **Deploy**. Cada push a `main` vuelve a publicar.

## Cargar un libro para leer

Convertí el PDF con el script (necesita `poppler-utils` y Pillow):

```bash
python3 scripts/convertir_pdf.py don-quijote ~/Descargas/quijote.pdf
```

El primer argumento es el `slug` del libro en `src/data/books.ts`. El script guarda el texto por páginas y
las ilustraciones en `public/libros/<slug>/` y habilita el botón **Leer**. Con `--paginas-como-imagen`
también guarda cada página tal cual se ve en el PDF (modo "Página original"); conviene usarlo solo en
libros ilustrados porque ocupa más espacio.

## Escuchar

En el lector, **🎧 Escuchar** lee la página en voz alta, resalta el párrafo que se está leyendo y pasa sola
a la página siguiente. Recuerda la página y el párrafo donde quedaste. Doble clic en un párrafo para
escuchar desde ahí.

Si el libro tiene audio generado (`"audio": true` en `src/data/lectura.json`), usa
`public/libros/<slug>/audio/audio.json`:

```json
{
  "voz": "Elena (es-AR)",
  "paginas": {
    "4": { "archivo": "0004.mp3", "marcas": [0, 12.4, 30.1] }
  }
}
```

Un archivo por página; `marcas` es el segundo donde empieza cada párrafo de esa página. Las páginas sin
audio, o los libros sin audio generado, se leen con la voz del navegador.

## Próximos pasos

1. Generar el audio de cada página con el generador de voces en Python.
