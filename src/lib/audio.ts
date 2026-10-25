import type { Book } from "@/lib/types";

/**
 * URL del audiolibro de un libro, o undefined si no tiene.
 *
 * `audio` en src/data/books.ts puede ser:
 * - un nombre de archivo ("audio.mp3"), que se busca en public/libros/<slug>/;
 * - una ruta desde public ("/libros/don-quijote/audio.mp3");
 * - una URL completa ("https://…/quijote.mp3").
 */
export function audioSrc(book: Pick<Book, "slug" | "audio">): string | undefined {
  const audio = book.audio?.trim();
  if (!audio) return undefined;
  if (/^https?:\/\//.test(audio) || audio.startsWith("/")) return audio;
  return `/libros/${book.slug}/${audio}`;
}
