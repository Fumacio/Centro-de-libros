import Link from "next/link";
import type { Recommendation } from "@/lib/recommend";
import { BookCard } from "./BookCard";

export function ForYou({ items, title = "Para ti", more }: { items: Recommendation[]; title?: string; more?: boolean }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl font-bold">{title}</h2>
        {more && (
          <Link href="/para-ti" className="text-sm text-accent hover:underline">
            Ver todo
          </Link>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map(({ book, reason }) => (
          <div key={book.slug}>
            <BookCard book={book} />
            <p className="mt-1 text-xs italic text-muted">{reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
