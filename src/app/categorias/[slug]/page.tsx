import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, getCategory } from "@/data/categories";
import { books } from "@/data/books";
import { BookCard } from "@/components/BookCard";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `${getCategory(slug)?.name ?? "Categoría"} · Centro de libros` };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const list = books.filter((b) => b.categories.includes(category.id));

  return (
    <>
      <Link href="/categorias" className="text-sm text-muted hover:text-accent">
        ← Categorías
      </Link>
      <h1 className="mt-2 font-serif text-3xl font-bold">
        {category.emoji} {category.name}
      </h1>
      <p className="text-muted">{category.description}</p>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {list.map((book) => (
          <BookCard key={book.slug} book={book} />
        ))}
      </div>
    </>
  );
}
