import { notFound } from "next/navigation";
import { getBook } from "@/data/books";
import { getReaderInfo, readableSlugs } from "@/lib/reader";
import { Reader } from "@/components/Reader";

export const dynamicParams = false;

export function generateStaticParams() {
  // Next necesita al menos un parámetro para exportar la ruta.
  const slugs = readableSlugs();
  return (slugs.length ? slugs : ["_"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = getBook(slug);
  return { title: book ? `Leer ${book.title} · Centro de libros` : "Libro no encontrado" };
}

export default async function ReadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = getBook(slug);
  const info = getReaderInfo(slug);
  if (!book || !info) notFound();

  return (
    <Reader
      slug={book.slug}
      title={book.title}
      author={book.author}
      hasOriginal={info.original}
      hasAudio={Boolean(info.audio)}
    />
  );
}
