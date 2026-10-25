import "server-only";
import { sql } from "./db";
import type { History } from "./recommend";

export interface Progress {
  libro: string;
  pagina: number;
  total: number | null;
}

/** Lo que leyó, guardó y buscó el usuario, lo más reciente primero. */
export async function getHistory(userId: number): Promise<History & { progress: Progress[] }> {
  const db = sql();
  const [lecturas, favoritos, busquedas] = await Promise.all([
    db`select libro, pagina, total from lecturas where usuario_id = ${userId} order by actualizado desc`,
    db`select libro from favoritos where usuario_id = ${userId} order by creado desc`,
    db`select texto, categoria from busquedas where usuario_id = ${userId} order by creado desc limit 30`,
  ]);
  const progress = lecturas.map((r) => ({ libro: r.libro, pagina: r.pagina, total: r.total }));
  return {
    progress,
    read: progress.map((p) => p.libro),
    favorites: favoritos.map((r) => r.libro),
    searches: busquedas.map((r) => ({ query: r.texto, category: r.categoria ?? undefined })),
  };
}

export async function getProgress(userId: number, slug: string): Promise<Progress | null> {
  const rows = await sql()`select libro, pagina, total from lecturas where usuario_id = ${userId} and libro = ${slug}`;
  return (rows[0] as Progress | undefined) ?? null;
}

export async function isFavorite(userId: number, slug: string) {
  const rows = await sql()`select 1 from favoritos where usuario_id = ${userId} and libro = ${slug}`;
  return rows.length > 0;
}
