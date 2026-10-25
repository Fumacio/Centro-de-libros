"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { books } from "@/data/books";
import { categories } from "@/data/categories";
import { searchBooks } from "@/lib/search";
import { recordSearch } from "@/app/cuenta/actions";
import { BookCard } from "./BookCard";

/** Buscador + filtro por categoría. El estado vive en la URL (?q=&cat=). */
export function Explorer({ loggedIn = false }: { loggedIn?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const cat = params.get("cat") ?? "";

  const results = useMemo(() => searchBooks(books, query, cat || undefined), [query, cat]);

  // Con cuenta, las búsquedas alimentan las recomendaciones. Se guarda cuando deja de escribir.
  useEffect(() => {
    if (!loggedIn || (query.trim().length < 3 && !cat)) return;
    const timer = setTimeout(() => recordSearch(query, cat || undefined).catch(() => {}), 1500);
    return () => clearTimeout(timer);
  }, [loggedIn, query, cat]);

  function update(next: { q?: string; cat?: string }) {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) sp.set(key, value);
      else sp.delete(key);
    }
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <section>
      <input
        type="search"
        value={query}
        onChange={(e) => update({ q: e.target.value })}
        placeholder="Buscar por título, autor o tema…"
        aria-label="Buscar libros"
        className="w-full rounded-full border border-line bg-surface px-5 py-3 text-base outline-none focus:border-accent"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip active={!cat} onClick={() => update({ cat: "" })}>
          Todos
        </Chip>
        {categories.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => update({ cat: cat === c.id ? "" : c.id })}>
            {c.emoji} {c.name}
          </Chip>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted">
        {results.length === 1 ? "1 libro" : `${results.length} libros`}
      </p>

      {results.length === 0 ? (
        <p className="mt-10 text-center text-muted">No encontramos libros con esa búsqueda.</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {results.map((book) => (
            <BookCard key={book.slug} book={book} />
          ))}
        </div>
      )}
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active ? "border-accent bg-accent text-white" : "border-line hover:border-accent"
      }`}
    >
      {children}
    </button>
  );
}
