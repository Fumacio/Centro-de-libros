import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

/** Las cuentas solo funcionan si hay base de datos (DATABASE_URL). */
export function dbEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

export function sql() {
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
  client ??= neon(process.env.DATABASE_URL);
  return client;
}
