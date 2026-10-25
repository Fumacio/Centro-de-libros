"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/cuenta/actions";

export function FavoriteButton({ slug, initial, loggedIn }: { slug: string; initial: boolean; loggedIn: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const cls = "rounded-full border border-line px-5 py-2 hover:border-accent";

  if (!loggedIn) {
    return (
      <Link href={`/ingresar?volver=/libros/${slug}`} className={cls} title="Iniciá sesión para guardar libros">
        ☆ Guardar
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={saved}
      onClick={() =>
        start(async () => {
          const next = await toggleFavorite(slug);
          if (next !== null) setSaved(next);
        })
      }
      className={`${cls} ${saved ? "border-accent text-accent" : ""}`}
    >
      {saved ? "★ Guardado" : "☆ Guardar"}
    </button>
  );
}
