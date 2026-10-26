"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getBook } from "@/data/books";
import { endSession, getCurrentUser, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { dbEnabled, sql } from "@/lib/db";

export interface FormState {
  error?: string;
  /** Lo que escribió, para no vaciar el formulario si hay un error. */
  nombre?: string;
  email?: string;
}

const NO_DB = "Las cuentas todavía no están configuradas en este sitio.";

/** Solo se vuelve a rutas internas, para no redirigir a otro sitio. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/para-ti";
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  if (!dbEnabled()) return { error: NO_DB };
  const nombre = String(form.get("nombre") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const clave = String(form.get("clave") ?? "");
  const fail = (error: string) => ({ error, nombre, email });
  if (!nombre) return fail("Escribí tu nombre.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("El email no parece válido.");
  if (clave.length < 8) return fail("La contraseña tiene que tener al menos 8 caracteres.");

  const rows = await sql()`
    insert into usuarios (nombre, email, clave_hash) values (${nombre}, ${email}, ${await hashPassword(clave)})
    on conflict (email) do nothing returning id`;
  if (!rows[0]) return fail("Ya hay una cuenta con ese email. Probá iniciar sesión.");
  await startSession(Number(rows[0].id));
  redirect(safeNext(form.get("volver")));
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  if (!dbEnabled()) return { error: NO_DB };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const clave = String(form.get("clave") ?? "");
  const rows = await sql()`select id, clave_hash from usuarios where email = ${email}`;
  const user = rows[0];
  if (!user || !(await verifyPassword(clave, user.clave_hash))) {
    return { error: "El email o la contraseña no coinciden.", email };
  }
  await startSession(Number(user.id));
  redirect(safeNext(form.get("volver")));
}

export async function logout() {
  await endSession();
  redirect("/");
}

export async function recordSearch(query: string, category?: string) {
  const user = await getCurrentUser();
  const texto = query.trim().slice(0, 100);
  if (!user || !user.guardarHistorial || (texto.length < 3 && !category)) return;
  // Si sigue escribiendo la misma búsqueda, se reemplaza en lugar de sumar otra.
  await sql()`
    delete from busquedas where usuario_id = ${user.id} and creado > now() - interval '2 minutes'
    and ${texto} like texto || '%'`;
  await sql()`insert into busquedas (usuario_id, texto, categoria) values (${user.id}, ${texto}, ${category ?? null})`;
}

export async function saveProgress(slug: string, page: number, total: number) {
  const user = await getCurrentUser();
  if (!user || !getBook(slug) || !Number.isInteger(page) || page < 0) return;
  await sql()`
    insert into lecturas (usuario_id, libro, pagina, total) values (${user.id}, ${slug}, ${page}, ${total || null})
    on conflict (usuario_id, libro) do update set pagina = excluded.pagina, total = excluded.total, actualizado = now()`;
}

export async function toggleFavorite(slug: string): Promise<boolean | null> {
  const user = await getCurrentUser();
  if (!user || !getBook(slug)) return null;
  const removed = await sql()`delete from favoritos where usuario_id = ${user.id} and libro = ${slug} returning 1`;
  if (removed.length === 0) {
    await sql()`insert into favoritos (usuario_id, libro) values (${user.id}, ${slug}) on conflict do nothing`;
  }
  revalidatePath("/para-ti");
  revalidatePath("/perfil");
  return removed.length === 0;
}
