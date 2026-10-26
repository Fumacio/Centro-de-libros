"use client";

import { useEffect, useState } from "react";
import { saveProgress } from "@/app/cuenta/actions";

/**
 * Sincroniza con la cuenta la página que el lector guarda en el navegador
 * (lectura:<slug>:pagina), así el progreso sigue en otros dispositivos.
 */
export function ReadingSync({ slug, total, saved }: { slug: string; total: number; saved: number | null }) {
  const key = `lectura:${slug}:pagina`;
  const [offer, setOffer] = useState<number | null>(null);

  useEffect(() => {
    const local = readLocal(key);
    let last = saved;
    // Si en la cuenta va más adelante, se ofrece saltar y no se pisa hasta que pase de página.
    if (saved !== null && saved > (local ?? 0)) {
      setOffer(saved);
      last = local ?? 0;
    }
    const sync = () => {
      const page = readLocal(key) ?? 0;
      if (page === last) return;
      last = page;
      saveProgress(slug, page, total).catch(() => {});
    };
    sync();
    const timer = setInterval(sync, 4000);
    const onHide = () => document.visibilityState === "hidden" && sync();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      sync();
    };
  }, [key, slug, total, saved]);

  if (offer === null) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm">
      <span>En otro dispositivo llegaste a la página {offer + 1}.</span>
      <span className="flex gap-2">
        <button
          type="button"
          className="rounded-full bg-accent px-3 py-1 text-white"
          onClick={() => {
            try {
              localStorage.setItem(key, JSON.stringify(offer));
              localStorage.setItem(`lectura:${slug}:parrafo`, "0");
            } catch {}
            location.reload();
          }}
        >
          Ir a esa página
        </button>
        <button type="button" className="rounded-full border border-line px-3 py-1" onClick={() => setOffer(null)}>
          Seguir acá
        </button>
      </span>
    </div>
  );
}

function readLocal(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    const n = raw === null ? null : Number(JSON.parse(raw));
    return n !== null && Number.isInteger(n) ? n : null;
  } catch {
    return null;
  }
}
