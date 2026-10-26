import Link from "next/link";
import type { Book } from "@/lib/types";
import { BookCover } from "./BookCover";
import { CardStar } from "./Favorites";
import { formatYear } from "@/lib/search";
import { getReaderInfo } from "@/lib/reader";

export function BookCard({ book }: { book: Book }) {
  return (
    <div className="group relative">
      <Link href={`/libros/${book.slug}`} className="block">
        <BookCover book={book} className="transition group-hover:-translate-y-1 group-hover:shadow-xl" />
        <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{book.title}</h3>
        <p className="text-xs text-muted">
          {book.author} · {formatYear(book.year)}
        </p>
        <div className="mt-1 flex gap-1 text-[10px]">
          {getReaderInfo(book.slug) && <span className="rounded bg-accent/15 px-1.5 py-0.5 text-accent">Para leer</span>}
          {book.illustrated && <span className="rounded bg-surface px-1.5 py-0.5">Ilustrado</span>}
          {book.audio && <span className="rounded bg-surface px-1.5 py-0.5">Audiolibro</span>}
        </div>
      </Link>
      <div className="pointer-events-none absolute inset-x-0 top-0 transition group-hover:-translate-y-1 [&>*]:pointer-events-auto">
        <CardStar slug={book.slug} title={book.title} />
      </div>
    </div>
  );
}
