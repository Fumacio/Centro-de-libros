"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReaderBook } from "@/lib/reader";

interface Props {
  slug: string;
  title: string;
  author: string;
  hasOriginal: boolean;
}

type Mode = "texto" | "original";

const FONT_SIZES = [16, 18, 20, 23, 26];

/** Los títulos de capítulo llegan como párrafos cortos sin punto final. */
function isHeading(text: string) {
  return text.length < 60 && !/[.,;:!?»”"—–-]$/.test(text);
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento (modo privado): el lector sigue funcionando.
  }
}

export function Reader({ slug, title, author, hasOriginal }: Props) {
  const [book, setBook] = useState<ReaderBook | null>(null);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [fontStep, setFontStep] = useState(1);
  const [mode, setMode] = useState<Mode>("texto");
  const touchX = useRef<number | null>(null);
  const base = `/libros/${slug}`;

  useEffect(() => {
    setPage(load(`lectura:${slug}:pagina`, 0));
    setFontStep(load("lectura:letra", 1));
    if (hasOriginal) setMode(load(`lectura:${slug}:modo`, "texto"));
    fetch(`${base}/libro.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setBook)
      .catch(() => setError(true));
  }, [slug, base, hasOriginal]);

  const total = book?.paginas.length ?? 0;

  const go = useCallback(
    (next: number) => {
      if (!total) return;
      const clamped = Math.max(0, Math.min(total - 1, next));
      setPage(clamped);
      save(`lectura:${slug}:pagina`, clamped);
      window.scrollTo({ top: 0 });
    },
    [total, slug],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, page]);

  function changeFont(delta: number) {
    const next = Math.max(0, Math.min(FONT_SIZES.length - 1, fontStep + delta));
    setFontStep(next);
    save("lectura:letra", next);
  }

  function changeMode(next: Mode) {
    setMode(next);
    save(`lectura:${slug}:modo`, next);
  }

  if (error) {
    return <p className="text-center text-muted">No pudimos cargar este libro. Probá de nuevo más tarde.</p>;
  }
  if (!book) {
    return <p className="text-center text-muted">Cargando libro…</p>;
  }

  const current = book.paginas[Math.min(page, total - 1)];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-background/95 px-4 py-2 backdrop-blur">
        <Link href={`/libros/${slug}`} className="min-w-0 truncate text-sm hover:text-accent">
          ← <span className="font-semibold">{title}</span> <span className="text-muted">· {author}</span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          {hasOriginal && (
            <div className="mr-2 flex overflow-hidden rounded-full border border-line">
              {(["texto", "original"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => changeMode(m)}
                  aria-pressed={mode === m}
                  className={`px-3 py-1 ${mode === m ? "bg-accent text-white" : ""}`}
                >
                  {m === "texto" ? "Texto" : "Página original"}
                </button>
              ))}
            </div>
          )}
          {mode === "texto" && (
            <>
              <button onClick={() => changeFont(-1)} className="rounded border border-line px-2 py-1" aria-label="Letra más chica">
                A−
              </button>
              <button onClick={() => changeFont(1)} className="rounded border border-line px-2 py-1" aria-label="Letra más grande">
                A+
              </button>
            </>
          )}
        </div>
      </div>

      <article
        className="min-h-[60vh] py-8"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 60) go(dx < 0 ? page + 1 : page - 1);
        }}
      >
        {mode === "original" && current.original ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${base}/pag/${current.original}`}
            alt={`Página ${current.n} de ${title}`}
            className="mx-auto w-full max-w-2xl rounded shadow-md"
          />
        ) : (
          <div className="font-serif leading-relaxed" style={{ fontSize: FONT_SIZES[fontStep] }}>
            {current.parrafos.map((p, i) =>
              isHeading(p) ? (
                <h2 key={i} className="mb-4 mt-6 text-center font-bold">
                  {p}
                </h2>
              ) : (
                <p key={i} className="mb-4 text-pretty">
                  {p}
                </p>
              ),
            )}
            {current.imagenes.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img}
                src={`${base}/img/${img}`}
                alt={`Ilustración de la página ${current.n}`}
                loading="lazy"
                className="mx-auto my-6 max-h-[70vh] rounded shadow"
              />
            ))}
          </div>
        )}
      </article>

      <nav className="flex items-center justify-between gap-3 border-t border-line py-4 text-sm">
        <button
          onClick={() => go(page - 1)}
          disabled={page === 0}
          className="rounded-full border border-line px-4 py-2 disabled:opacity-40"
        >
          ← Anterior
        </button>
        <label className="flex items-center gap-2 text-muted">
          Página
          <input
            type="number"
            min={1}
            max={total}
            value={page + 1}
            onChange={(e) => go(Number(e.target.value) - 1)}
            className="w-16 rounded border border-line bg-surface px-2 py-1 text-center text-foreground"
          />
          de {total}
        </label>
        <button
          onClick={() => go(page + 1)}
          disabled={page >= total - 1}
          className="rounded-full bg-accent px-4 py-2 text-white disabled:opacity-40"
        >
          Siguiente →
        </button>
      </nav>
      <div className="h-1 overflow-hidden rounded bg-surface">
        <div className="h-full bg-accent transition-all" style={{ width: `${((page + 1) / total) * 100}%` }} />
      </div>
    </div>
  );
}
