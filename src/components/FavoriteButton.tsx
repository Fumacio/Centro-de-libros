"use client";

import Link from "next/link";
import { StarIcon, useFavorites } from "./Favorites";

export function FavoriteButton({ slug }: { slug: string }) {
  const { loggedIn, isSaved, toggle } = useFavorites();
  const saved = isSaved(slug);
  const cls = "inline-flex items-center gap-2 rounded-full border border-line px-5 py-2 hover:border-accent";

  if (!loggedIn) {
    return (
      <Link href={`/ingresar?volver=/libros/${slug}`} className={cls} title="Iniciá sesión para guardar libros">
        <StarIcon filled={false} className="h-4 w-4" /> Guardar
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => toggle(slug)}
      className={`${cls} ${saved ? "border-accent text-accent" : ""}`}
    >
      <StarIcon filled={saved} className="h-4 w-4" /> {saved ? "Guardado" : "Guardar"}
    </button>
  );
}
