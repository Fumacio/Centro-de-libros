import Link from "next/link";
import { notFound } from "next/navigation";
import { books, getBook } from "@/data/books";
import { getCategory } from "@/data/categories";
import { BookCover } from "@/components/BookCover";
import { formatYear, languageNames } from "@/lib/search";
import { getReaderInfo } from "@/lib/reader";
import { FavoriteButton } from "@/components/FavoriteButton";
import { isFavorite } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";

export function generateStaticParams() {
  return books.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = getBook(slug);
  return { title: book ? `${book.title} · Centro de libros` : "Libro no encontrado" };
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = getBook(slug);
  if (!book) notFound();
  const reader = getReaderInfo(book.slug);
  const user = await getCurrentUser();
  const saved = user ? await isFavorite(user.id, book.slug) : false;

  return (
    <article className="grid gap-8 sm:grid-cols-[220px_1fr]">
      <BookCover book={book} className="mx-auto w-48 sm:w-full" />
      <div>
        <h1 className="font-serif text-3xl font-bold">{book.title}</h1>
        {book.originalTitle && <p className="italic text-muted">{book.originalTitle}</p>}
        <p className="mt-1 text-lg">{book.author}</p>
        <p className="text-sm text-muted">
          {formatYear(book.year)} · Texto en {languageNames[book.language].toLowerCase()}
          {book.illustrated && " · Con ilustraciones"}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {book.categories.map((id) => {
            const c = getCategory(id);
            return (
              <Link
                key={id}
                href={`/categorias/${id}`}
                className="rounded-full border border-line px-3 py-1 text-xs hover:border-accent"
              >
                {c?.emoji} {c?.name}
              </Link>
            );
          })}
        </div>

        <p className="mt-5 max-w-prose leading-relaxed">{book.description}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {reader ? (
            <Link href={`/libros/${book.slug}/leer`} className="rounded-full bg-accent px-5 py-2 text-white hover:opacity-90">
              📖 Leer · {reader.paginas} páginas
            </Link>
          ) : (
            <span
              className="cursor-not-allowed rounded-full bg-accent/50 px-5 py-2 text-white"
              title="Todavía no cargamos el texto de este libro"
            >
              📖 Leer (pronto)
            </span>
          )}
{reader && (
            <Link
              href={`/libros/${book.slug}/leer`}
              className="rounded-full border border-line px-5 py-2 hover:border-accent"
              title={reader.audio ? "Audiolibro con voz generada" : "Se lee con la voz de tu navegador"}
            >
              🎧 Escuchar
            </Link>
          )}
          <FavoriteButton slug={book.slug} initial={saved} loggedIn={Boolean(user)} />
        </div>

        <p className="mt-6 text-xs text-muted">
          {book.edition && <>Texto: {book.edition} · </>}
          Original en{" "}
          <a href={book.source.url} className="underline hover:text-accent" target="_blank" rel="noreferrer">
            {book.source.name}
          </a>
        </p>
      </div>
    </article>
  );
}
