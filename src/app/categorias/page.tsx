import Link from "next/link";
import { categories } from "@/data/categories";
import { books } from "@/data/books";

export const metadata = { title: "Categorías · Centro de libros" };

export default function CategoriesPage() {
  return (
    <>
      <h1 className="font-serif text-3xl font-bold">Categorías</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => {
          const count = books.filter((b) => b.categories.includes(c.id)).length;
          return (
            <Link
              key={c.id}
              href={`/categorias/${c.id}`}
              className="rounded-lg border border-line bg-surface p-5 transition hover:border-accent"
            >
              <div className="text-3xl">{c.emoji}</div>
              <h2 className="mt-2 font-semibold">{c.name}</h2>
              <p className="text-sm text-muted">{c.description}</p>
              <p className="mt-2 text-xs text-muted">{count === 1 ? "1 libro" : `${count} libros`}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
