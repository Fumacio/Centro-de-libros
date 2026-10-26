"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type FormState } from "@/app/cuenta/actions";

const input =
  "mt-1 w-full rounded-lg border border-line bg-surface px-4 py-2 outline-none focus:border-accent";

export function AuthForm({ mode, next }: { mode: "ingresar" | "registro"; next?: string }) {
  const isRegister = mode === "registro";
  const [state, action, pending] = useActionState<FormState, FormData>(isRegister ? register : login, {});
  const query = next ? `?volver=${encodeURIComponent(next)}` : "";

  return (
    <form action={action} className="mx-auto max-w-sm space-y-4">
      <h1 className="font-serif text-3xl font-bold">{isRegister ? "Crear cuenta" : "Iniciar sesión"}</h1>
      <p className="text-sm text-muted">
        {isRegister
          ? "Con tu cuenta guardamos por dónde vas en cada libro y te recomendamos otros según lo que leés y buscás."
          : "Entrá para seguir leyendo donde te quedaste."}
      </p>
      {next && <input type="hidden" name="volver" value={next} />}
      {isRegister && (
        <label className="block text-sm">
          Nombre
          <input name="nombre" required autoComplete="name" defaultValue={state.nombre} className={input} />
        </label>
      )}
      <label className="block text-sm">
        Email
        <input name="email" type="email" required autoComplete="email" defaultValue={state.email} className={input} />
      </label>
      <label className="block text-sm">
        Contraseña
        <input
          name="clave"
          type="password"
          required
          minLength={isRegister ? 8 : undefined}
          autoComplete={isRegister ? "new-password" : "current-password"}
          className={input}
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-full bg-accent px-5 py-2 text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Un momento…" : isRegister ? "Crear cuenta" : "Entrar"}
      </button>
      <p className="text-center text-sm text-muted">
        {isRegister ? (
          <>
            ¿Ya tenés cuenta?{" "}
            <Link href={`/ingresar${query}`} className="text-accent underline">
              Iniciá sesión
            </Link>
          </>
        ) : (
          <>
            ¿No tenés cuenta?{" "}
            <Link href={`/registro${query}`} className="text-accent underline">
              Creá una
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
