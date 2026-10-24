import Link from "next/link";
import type { Book } from "@/lib/types";
import { BookCover } from "./BookCover";
import { formatYear } from "@/lib/search";

export function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/libros/${book.slug}`} className="group block">
      <BookCover book={book} className="transition group-hover:-translate-y-1 group-hover:shadow-xl" />
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{book.title}</h3>
      <p className="text-xs text-muted">
        {book.author} · {formatYear(book.year)}
      </p>
      <div className="mt-1 flex gap-1 text-[10px]">
        {book.illustrated && <span className="rounded bg-surface px-1.5 py-0.5">Ilustrado</span>}
        {book.audio && <span className="rounded bg-surface px-1.5 py-0.5">Audiolibro</span>}
      </div>
    </Link>
  );
}
