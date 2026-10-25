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
- `src/components/AudioPlayer.tsx`: reproductor del audiolibro (en la página del libro y abajo en el lector).
- `src/lib/audio.ts`: arma la URL del audio de cada libro.

## Cargar un libro para leer

Convertí el PDF con el script (necesita `poppler-utils` y Pillow):

```bash
python3 scripts/convertir_pdf.py don-quijote ~/Descargas/quijote.pdf
```

El primer argumento es el `slug` del libro en `src/data/books.ts`. El script guarda el texto por páginas y
las ilustraciones en `public/libros/<slug>/` y habilita el botón **Leer**. Con `--paginas-como-imagen`
también guarda cada página tal cual se ve en el PDF (modo "Página original"); conviene usarlo solo en
libros ilustrados porque ocupa más espacio.

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
