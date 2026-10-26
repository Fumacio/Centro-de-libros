import { Suspense } from "react";
import { books } from "@/data/books";
import { Explorer } from "@/components/Explorer";
import { ForYou } from "@/components/ForYou";
import { getHistory } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { recommend } from "@/lib/recommend";

export default async function Home() {
  const user = await getCurrentUser();
  const forYou = user ? recommend(books, await getHistory(user.id), 5) : [];

  return (
    <>
      <section className="mb-8">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">Leé y escuchá clásicos, gratis</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Una biblioteca de clásicos para leer página por página o escuchar como audiolibro.
        </p>
      </section>
      {user && <ForYou items={forYou} more />}
      <Suspense>
        <Explorer loggedIn={Boolean(user)} />
      </Suspense>
    </>
  );
}
