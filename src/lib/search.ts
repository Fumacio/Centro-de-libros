import type { Book } from "./types";
import { getCategory } from "@/data/categories";

/** Pasa a minúsculas y quita tildes para que "dracula" encuentre "Drácula". */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function searchBooks(books: Book[], query: string, category?: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return books.filter((book) => {
    if (category && !book.categories.includes(category as Book["categories"][number])) {
      return false;
    }
    if (terms.length === 0) return true;
    const haystack = normalize(
      [
        book.title,
        book.originalTitle ?? "",
        book.author,
        book.description,
        ...book.categories.map((c) => getCategory(c)?.name ?? c),
      ].join(" "),
    );
    return terms.every((t) => haystack.includes(t));
  });
}

export function formatYear(year: number) {
  return year < 0 ? `s. ${Math.ceil(-year / 100)} a. C.` : String(year);
}

export const languageNames: Record<Book["language"], string> = {
  es: "Español",
  en: "Inglés",
  de: "Alemán",
  fr: "Francés",
};
