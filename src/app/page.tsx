import { Suspense } from "react";
import { Explorer } from "@/components/Explorer";

export default function Home() {
  return (
    <>
      <section className="mb-8">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">Leé y escuchá clásicos, gratis</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Una biblioteca de libros de dominio público para leer página por página o escuchar como audiolibro.
        </p>
      </section>
      <Suspense>
        <Explorer />
      </Suspense>
    </>
  );
}
