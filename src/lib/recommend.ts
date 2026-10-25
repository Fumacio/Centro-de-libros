import type { Book } from "./types";
import { getCategory } from "@/data/categories";
import { getReaderInfo } from "./reader";
import { searchBooks } from "./search";

export interface History {
  /** Libros abiertos en el lector, el más reciente primero. */
  read: string[];
  favorites: string[];
  /** Búsquedas, la más reciente primero. */
  searches: { query: string; category?: string }[];
}

export interface Recommendation {
  book: Book;
  reason: string;
}

/** Las señales recientes pesan más que las viejas. */
const recency = (i: number) => 1 / (1 + i * 0.15);

/**
 * Puntúa cada libro según las categorías y autores de lo que el usuario leyó,
 * guardó y buscó. Devuelve los que todavía no leyó ni guardó, con el motivo principal.
 */
export function recommend(books: Book[], history: History, limit = 12): Recommendation[] {
  const bySlug = new Map(books.map((b) => [b.slug, b]));
  const catWeight = new Map<string, { w: number; reason: string }[]>();
  const authorWeight = new Map<string, { w: number; reason: string }[]>();
  const direct = new Map<string, { w: number; reason: string }[]>();

  const add = (map: Map<string, { w: number; reason: string }[]>, key: string, w: number, reason: string) => {
    const list = map.get(key) ?? [];
    list.push({ w, reason });
    map.set(key, list);
  };

  // Una categoría que tienen casi todos (como Clásicos) dice menos que una rara.
  const catCount = new Map<string, number>();
  for (const b of books) for (const c of b.categories) catCount.set(c, (catCount.get(c) ?? 0) + 1);
  const rarity = (c: string) => Math.log(1 + books.length / (catCount.get(c) ?? 1)) / Math.log(2);

  const fromBook = (book: Book, w: number, reason: string) => {
    for (const c of book.categories) add(catWeight, c, w * rarity(c), reason);
    add(authorWeight, book.author, w * 1.5, `Más de ${book.author}`);
  };

  history.read.forEach((slug, i) => {
    const book = bySlug.get(slug);
    if (book) fromBook(book, 3 * recency(i), `Porque leíste ${book.title}`);
  });
  history.favorites.forEach((slug, i) => {
    const book = bySlug.get(slug);
    if (book) fromBook(book, 4 * recency(i), `Porque guardaste ${book.title}`);
  });
  history.searches.forEach(({ query, category }, i) => {
    const r = recency(i);
    if (category) {
      const name = getCategory(category)?.name ?? category;
      add(catWeight, category, 1.5 * r * rarity(category), `Porque buscaste en ${name}`);
    }
    if (!query.trim()) return;
    const matches = searchBooks(books, query, category);
    // Una búsqueda muy amplia dice poco de cada libro que encuentra.
    const share = matches.length ? 1 / Math.sqrt(matches.length) : 0;
    for (const book of matches) {
      const reason = `Porque buscaste “${query.trim()}”`;
      add(direct, book.slug, 3 * share * r, reason);
      fromBook(book, share * r, reason);
    }
  });

  // Lo leído y lo guardado ya aparecen en sus propias listas.
  const seen = new Set([...history.read, ...history.favorites]);
  const hasHistory = history.read.length + history.favorites.length + history.searches.length > 0;

  const scored = books
    .filter((b) => !seen.has(b.slug))
    .map((book) => {
      const parts = [
        ...(direct.get(book.slug) ?? []),
        ...(authorWeight.get(book.author) ?? []),
        ...book.categories.flatMap((c) => catWeight.get(c) ?? []),
      ];
      // Los que ya se pueden leer en la app van un poco antes.
      const score = parts.reduce((s, p) => s + p.w, 0) + (getReaderInfo(book.slug) ? 0.5 : 0);
      const reasons = new Map<string, number>();
      for (const p of parts) reasons.set(p.reason, (reasons.get(p.reason) ?? 0) + p.w);
      const best = [...reasons].sort((a, b) => b[1] - a[1])[0];
      return { book, score, reason: best?.[0] ?? (hasHistory ? "Para descubrir algo distinto" : "Para empezar") };
    });

  return scored
    .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title))
    .slice(0, limit)
    .map(({ book, reason }) => ({ book, reason }));
}
