"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useState } from "react";
import { toggleFavorite } from "@/app/cuenta/actions";

interface FavoritesState {
  loggedIn: boolean;
  isSaved: (slug: string) => boolean;
  toggle: (slug: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesState>({
  loggedIn: false,
  isSaved: () => false,
  toggle: async () => {},
});

/** Los libros guardados del usuario, compartidos por todas las estrellas de la página. */
export function FavoritesProvider({
  initial,
  loggedIn,
  children,
}: {
  initial: string[];
  loggedIn: boolean;
  children: React.ReactNode;
}) {
  const [saved, setSaved] = useState(() => new Set(initial));

  const toggle = useCallback(async (slug: string) => {
    const flip = (on: boolean) =>
      setSaved((prev) => {
        const next = new Set(prev);
        if (on) next.add(slug);
        else next.delete(slug);
        return next;
      });
    const wasSaved = saved.has(slug);
    flip(!wasSaved);
    try {
      const now = await toggleFavorite(slug);
      if (now !== null) flip(now);
      else flip(wasSaved);
    } catch {
      flip(wasSaved);
    }
  }, [saved]);

  return (
    <FavoritesContext.Provider value={{ loggedIn, isSaved: (s) => saved.has(s), toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}

export function StarIcon({ filled, className = "" }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </svg>
  );
}

/** Estrella sobre la portada: aparece al pasar el cursor y queda fija si el libro está guardado. */
export function CardStar({ slug, title }: { slug: string; title: string }) {
  const { loggedIn, isSaved, toggle } = useFavorites();
  const saved = isSaved(slug);
  const cls = `absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-black/55 shadow backdrop-blur transition hover:scale-110 hover:bg-black/70 focus-visible:opacity-100 ${
    saved ? "opacity-100 text-amber-300" : "text-white opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
  }`;

  if (!loggedIn) {
    return (
      <Link href={`/ingresar?volver=/libros/${slug}`} className={cls} aria-label={`Iniciá sesión para guardar ${title}`} title="Iniciá sesión para guardar">
        <StarIcon filled={false} className="h-5 w-5" />
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={saved}
      aria-label={saved ? `Quitar ${title} de guardados` : `Guardar ${title}`}
      title={saved ? "Quitar de guardados" : "Guardar"}
      className={cls}
    >
      <StarIcon filled={saved} className="h-5 w-5" />
    </button>
  );
}
