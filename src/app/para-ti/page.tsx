import { redirect } from "next/navigation";
import { books, getBook } from "@/data/books";
import { ContinueReading } from "@/components/ContinueReading";
import { BookCard } from "@/components/BookCard";
import { ForYou } from "@/components/ForYou";
import { getHistory } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { recommend } from "@/lib/recommend";

export const metadata = { title: "Para ti · Centro de libros" };

export default async function ForYouPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?volver=/para-ti");
  const history = await getHistory(user.id);
  const reading = history.progress.flatMap((p) => {
    const book = getBook(p.libro);
    return book ? [{ ...p, book }] : [];
  });
  const favorites = history.favorites.flatMap((slug) => getBook(slug) ?? []);
  const items = recommend(books, history, 20);
  const empty = history.read.length + history.favorites.length + history.searches.length === 0;

  return (
    <>
      <h1 className="font-serif text-3xl font-bold">Hola, {user.nombre}</h1>
      <p className="mt-1 mb-8 text-muted">
        {empty
          ? "Todavía no leíste ni buscaste nada. Empezá por alguno de estos y las recomendaciones se van a ir ajustando a vos."
          : "Libros elegidos según lo que fuiste leyendo, guardando y buscando."}
      </p>

      {reading.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-2xl font-bold">Seguir leyendo</h2>
          <ContinueReading items={reading} />
        </section>
      )}

      <ForYou items={items} title={empty ? "Para empezar" : "Te pueden gustar"} />

      {favorites.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-2xl font-bold">Guardados</h2>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {favorites.map((book) => (
              <BookCard key={book.slug} book={book} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
