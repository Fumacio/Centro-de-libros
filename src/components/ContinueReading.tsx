import Link from "next/link";
import type { Book } from "@/lib/types";
import { BookCover } from "./BookCover";

export interface ReadingItem {
  book: Book;
  pagina: number;
  total: number | null;
}

/** Libros empezados, con la barra de progreso. */
export function ContinueReading({ items }: { items: ReadingItem[] }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map(({ book, pagina, total }) => (
        <Link key={book.slug} href={`/libros/${book.slug}/leer`} className="group block">
          <BookCover book={book} className="transition group-hover:-translate-y-1 group-hover:shadow-xl" />
          <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{book.title}</h3>
          {total ? (
            <>
              <div className="mt-1 h-1.5 rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(100, Math.round(((pagina + 1) / total) * 100))}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted">
                Página {pagina + 1} de {total}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted">Empezado</p>
          )}
        </Link>
      ))}
    </div>
  );
}
