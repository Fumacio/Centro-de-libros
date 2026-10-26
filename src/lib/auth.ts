import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { cache } from "react";
import { dbEnabled, sql } from "./db";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

const COOKIE = "sesion";
const DAYS = 30;

export interface User {
  id: number;
  nombre: string;
  email: string;
  /** Si es false, no se guardan sus búsquedas. */
  guardarHistorial: boolean;
  creado: Date;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const key = await scryptAsync(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(keyHex, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** En la base solo se guarda el hash del token, nunca el token de la cookie. */
function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function startSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000);
  await sql()`insert into sesiones (token_hash, usuario_id, vence) values (${tokenHash(token)}, ${userId}, ${expires})`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endAllSessions(userId: number) {
  await sql()`delete from sesiones where usuario_id = ${userId}`;
  (await cookies()).delete(COOKIE);
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && dbEnabled()) await sql()`delete from sesiones where token_hash = ${tokenHash(token)}`;
  jar.delete(COOKIE);
}

/** Usuario de la sesión actual, o null. Se calcula una vez por pedido. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  // Se leen las cookies siempre, para que las páginas se rendericen por usuario.
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !dbEnabled()) return null;
  const rows = await sql()`
    select u.id, u.nombre, u.email, u.guardar_historial, u.creado from sesiones s join usuarios u on u.id = s.usuario_id
    where s.token_hash = ${tokenHash(token)} and s.vence > now()`;
  const row = rows[0];
  if (!row) return null;
  return {
    id: Number(row.id),
    nombre: row.nombre,
    email: row.email,
    guardarHistorial: row.guardar_historial,
    creado: new Date(row.creado),
  };
});
