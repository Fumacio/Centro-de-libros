"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { endAllSessions, getCurrentUser, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { sql } from "@/lib/db";

export interface Result {
  ok?: string;
  error?: string;
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?volver=/ajustes");
  return user;
}

async function checkPassword(userId: number, clave: string) {
  const rows = await sql()`select clave_hash from usuarios where id = ${userId}`;
  return Boolean(rows[0]) && verifyPassword(clave, rows[0].clave_hash);
}

export async function updateProfile(_: Result, form: FormData): Promise<Result> {
  const user = await requireUser();
  const nombre = String(form.get("nombre") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!nombre) return { error: "Escribí tu nombre." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "El email no parece válido." };
  if (email !== user.email) {
    const taken = await sql()`select 1 from usuarios where email = ${email} and id <> ${user.id}`;
    if (taken.length) return { error: "Ya hay otra cuenta con ese email." };
  }
  await sql()`update usuarios set nombre = ${nombre}, email = ${email} where id = ${user.id}`;
  revalidatePath("/", "layout");
  return { ok: "Guardamos tus datos." };
}

export async function changePassword(_: Result, form: FormData): Promise<Result> {
  const user = await requireUser();
  const actual = String(form.get("actual") ?? "");
  const nueva = String(form.get("nueva") ?? "");
  if (!(await checkPassword(user.id, actual))) return { error: "La contraseña actual no es correcta." };
  if (nueva.length < 8) return { error: "La nueva contraseña tiene que tener al menos 8 caracteres." };
  if (nueva !== String(form.get("repetir") ?? "")) return { error: "Las contraseñas nuevas no coinciden." };
  await sql()`update usuarios set clave_hash = ${await hashPassword(nueva)} where id = ${user.id}`;
  // Cierra las otras sesiones por si alguien más tenía la contraseña vieja.
  await endAllSessions(user.id);
  await startSession(user.id);
  return { ok: "Cambiamos tu contraseña y cerramos la sesión en los otros dispositivos." };
}

export async function setTheme(theme: string) {
  const jar = await cookies();
  if (theme === "claro" || theme === "oscuro") {
    jar.set("tema", theme, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  } else {
    jar.delete("tema");
  }
}

export async function setSearchHistory(enabled: boolean) {
  const user = await requireUser();
  await sql()`update usuarios set guardar_historial = ${enabled} where id = ${user.id}`;
  revalidatePath("/ajustes");
  revalidatePath("/perfil");
}

export async function clearData(what: "busquedas" | "lecturas" | "favoritos"): Promise<Result> {
  const user = await requireUser();
  if (what === "busquedas") await sql()`delete from busquedas where usuario_id = ${user.id}`;
  if (what === "lecturas") await sql()`delete from lecturas where usuario_id = ${user.id}`;
  if (what === "favoritos") await sql()`delete from favoritos where usuario_id = ${user.id}`;
  revalidatePath("/", "layout");
  return { ok: "Listo, lo borramos." };
}

export async function logoutEverywhere() {
  const user = await requireUser();
  await endAllSessions(user.id);
  redirect("/ingresar");
}

export async function deleteAccount(_: Result, form: FormData): Promise<Result> {
  const user = await requireUser();
  if (!(await checkPassword(user.id, String(form.get("clave") ?? "")))) {
    return { error: "La contraseña no es correcta." };
  }
  // Las sesiones, lecturas, búsquedas y guardados se borran en cascada.
  await sql()`delete from usuarios where id = ${user.id}`;
  (await cookies()).delete("sesion");
  redirect("/?cuenta=eliminada");
}
