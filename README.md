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
- `src/components/Reader.tsx`: lector por páginas.
- `src/components/AudioPlayer.tsx`: reproductor del audiolibro (en la página del libro y abajo en el lector).
- `src/lib/audio.ts`: arma la URL del audio de cada libro.

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

El texto sale limpio (sin los cuadraditos de las palabras cortadas ni los encabezados de cada página).
Después mirá las primeras y últimas páginas y sacá portada, créditos, índice y contratapa:

```bash
python3 scripts/limpiar_libro.py don-quijote --desde 12 --hasta 471
```

`--desde` y `--hasta` son los números de página del PDF. También acepta `--quitar 20,21` para borrar
otras páginas y `--quitar-imagen p0073-0.jpg` para sacar un logo.

## Audiolibros

Cada libro tiene **un archivo de audio**. Para agregarlo:

1. Copiá el archivo a la carpeta del libro: `public/libros/<slug>/audio.mp3`
   (por ejemplo `public/libros/don-quijote/audio.mp3`).
2. En `src/data/books.ts`, agregá el campo `audio` a ese libro:

   ```ts
   {
     slug: "don-quijote",
     title: "Don Quijote de la Mancha",
     // ...
     audio: "audio.mp3",
   },
   ```

`audio` acepta tres formas:

- Un nombre de archivo (`"audio.mp3"`): se busca en `public/libros/<slug>/`.
- Una ruta desde `public` (`"/audios/quijote.mp3"`).
- Una URL completa (`"https://…/quijote.mp3"`), para audios guardados en otro servicio.

Ojo con el tamaño: GitHub no acepta archivos de más de 100 MB, y un audiolibro largo en MP3 suele pasarlos.
Esos conviene subirlos a un almacenamiento aparte (por ejemplo Vercel Blob) y poner la URL en `audio`.

Formatos que reproducen todos los navegadores: **MP3** (recomendado), M4A/AAC y OGG/Opus. WAV también
anda, pero ocupa mucho.

Si un libro no tiene `audio`, no se muestra el reproductor. Cuando lo tiene, aparece en la página del libro
y fijo abajo en el lector, con play/pausa, retroceder 15 s, adelantar 30 s, barra de progreso y velocidad
(0,75× a 2×). Recuerda en cada navegador la posición de cada libro y la velocidad elegida, y la comparte
entre la página del libro y el lector. Los libros con audio llevan la etiqueta "Audiolibro" en el catálogo.
