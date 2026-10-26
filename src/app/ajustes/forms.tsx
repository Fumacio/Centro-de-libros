"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  changePassword,
  clearData,
  deleteAccount,
  logoutEverywhere,
  type Result,
  setSearchHistory,
  setTheme,
  updateProfile,
} from "./actions";

const input = "mt-1 w-full rounded-lg border border-line bg-background px-4 py-2 outline-none focus:border-accent";
const primary = "rounded-full bg-accent px-5 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60";
const secondary = "rounded-full border border-line px-4 py-2 text-sm hover:border-accent disabled:opacity-60";

function Card({ id, title, description, children, danger }: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section id={id} className={`scroll-mt-24 rounded-2xl border p-6 ${danger ? "border-red-500/50" : "border-line"}`}>
      <h2 className={`text-lg font-semibold ${danger ? "text-red-500" : ""}`}>{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Message({ result }: { result: Result }) {
  if (result.error) return <p role="alert" className="text-sm text-red-500">{result.error}</p>;
  if (result.ok) return <p role="status" className="text-sm text-green-600">{result.ok}</p>;
  return null;
}

function Row({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="max-w-md">
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

/** Lee y guarda una preferencia del navegador (las mismas claves que usan el lector y el reproductor). */
function useLocal<T>(key: string, fallback: T) {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw));
    } catch {}
  }, [key]);
  const update = (next: T) => {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  };
  return [value, update] as const;
}

export function AccountSettings({ nombre, email }: { nombre: string; email: string }) {
  const [profile, saveProfile, savingProfile] = useActionState<Result, FormData>(updateProfile, {});
  const [password, savePassword, savingPassword] = useActionState<Result, FormData>(changePassword, {});
  return (
    <Card id="cuenta" title="Cuenta" description="Tu nombre se muestra en tu perfil.">
      <form action={saveProfile} className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Nombre
          <input name="nombre" required defaultValue={nombre} autoComplete="name" className={input} />
        </label>
        <label className="block text-sm">
          Email
          <input name="email" type="email" required defaultValue={email} autoComplete="email" className={input} />
        </label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button disabled={savingProfile} className={primary}>
            Guardar cambios
          </button>
          <Message result={profile} />
        </div>
      </form>

      <form action={savePassword} className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
        <p className="font-medium sm:col-span-3">Cambiar contraseña</p>
        <label className="block text-sm">
          Contraseña actual
          <input name="actual" type="password" required autoComplete="current-password" className={input} />
        </label>
        <label className="block text-sm">
          Nueva
          <input name="nueva" type="password" required minLength={8} autoComplete="new-password" className={input} />
        </label>
        <label className="block text-sm">
          Repetir la nueva
          <input name="repetir" type="password" required minLength={8} autoComplete="new-password" className={input} />
        </label>
        <div className="flex items-center gap-3 sm:col-span-3">
          <button disabled={savingPassword} className={primary}>
            Cambiar contraseña
          </button>
          <Message result={password} />
        </div>
      </form>
    </Card>
  );
}

const THEMES = [
  { id: "sistema", label: "Como la compu", hint: "Sigue el modo claro u oscuro del dispositivo" },
  { id: "claro", label: "Claro", hint: "Fondo color papel" },
  { id: "oscuro", label: "Oscuro", hint: "Ideal para leer de noche" },
];

export function AppearanceSettings({ initial }: { initial: string }) {
  const [theme, setLocal] = useState(initial);
  const choose = (id: string) => {
    setLocal(id);
    if (id === "sistema") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = id;
    setTheme(id).catch(() => {});
  };
  return (
    <Card id="apariencia" title="Apariencia" description="Se guarda en este navegador.">
      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Tema">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={theme === t.id}
            onClick={() => choose(t.id)}
            className={`rounded-xl border p-4 text-left transition ${theme === t.id ? "border-accent ring-2 ring-accent/30" : "border-line hover:border-accent"}`}
          >
            <span
              className={`mb-3 block h-12 rounded-lg border border-line ${
                t.id === "claro" ? "bg-[#fbf8f3]" : t.id === "oscuro" ? "bg-[#15120e]" : "bg-gradient-to-r from-[#fbf8f3] from-50% to-[#15120e] to-50%"
              }`}
            />
            <span className="block font-medium">{t.label}</span>
            <span className="text-xs text-muted">{t.hint}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

const FONT_SIZES = [16, 18, 20, 23, 26];
const RATES = [0.75, 1, 1.25, 1.5, 2];

export function ReadingSettings() {
  const [fontStep, setFontStep] = useLocal("lectura:letra", 1);
  const [rate, setRate] = useLocal("audio:velocidad", 1);
  return (
    <Card id="lectura" title="Lectura y audio" description="Valores con los que se abre el lector y el audiolibro en este navegador.">
      <Row title="Tamaño de letra">
        <div className="flex gap-1">
          {FONT_SIZES.map((size, i) => (
            <button
              key={size}
              type="button"
              aria-pressed={fontStep === i}
              onClick={() => setFontStep(i)}
              className={`grid h-10 w-10 place-items-center rounded-lg border font-serif ${fontStep === i ? "border-accent bg-accent text-white" : "border-line hover:border-accent"}`}
              style={{ fontSize: size - 2 }}
            >
              A
            </button>
          ))}
        </div>
      </Row>
      <p className="rounded-lg bg-surface/60 p-4 font-serif leading-relaxed" style={{ fontSize: FONT_SIZES[fontStep] ?? 18 }}>
        En un lugar de la Mancha, de cuyo nombre no quiero acordarme…
      </p>
      <Row title="Velocidad del audiolibro">
        <div className="flex gap-1">
          {RATES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={rate === r}
              onClick={() => setRate(r)}
              className={`rounded-lg border px-3 py-2 text-sm ${rate === r ? "border-accent bg-accent text-white" : "border-line hover:border-accent"}`}
            >
              {r}×
            </button>
          ))}
        </div>
      </Row>
    </Card>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-accent" : "bg-line"}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} />
    </button>
  );
}

function ClearButton({ what, label, confirmText }: { what: "busquedas" | "lecturas" | "favoritos"; label: string; confirmText: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result>({});
  return (
    <div className="flex items-center gap-3">
      <Message result={result} />
      <button
        type="button"
        disabled={pending}
        className={secondary}
        onClick={() => {
          if (!confirm(confirmText)) return;
          start(async () => setResult(await clearData(what)));
        }}
      >
        {label}
      </button>
    </div>
  );
}

export function PrivacySettings({ historial }: { historial: boolean }) {
  const [enabled, setEnabled] = useState(historial);
  return (
    <Card id="privacidad" title="Privacidad" description="Lo que guardamos sirve para armar tus recomendaciones de Para ti.">
      <Row title="Guardar mis búsquedas" description="Si lo apagás, tus búsquedas nuevas no se usan para recomendarte libros.">
        <Toggle
          checked={enabled}
          label="Guardar mis búsquedas"
          onChange={(v) => {
            setEnabled(v);
            setSearchHistory(v).catch(() => setEnabled(!v));
          }}
        />
      </Row>
      <Row title="Historial de búsquedas" description="Borra todas tus búsquedas guardadas.">
        <ClearButton what="busquedas" label="Borrar historial" confirmText="¿Borrar todo tu historial de búsquedas?" />
      </Row>
      <Row title="Progreso de lectura" description="Olvida en qué página ibas de cada libro.">
        <ClearButton what="lecturas" label="Borrar progreso" confirmText="¿Borrar el progreso de todos tus libros?" />
      </Row>
      <Row title="Libros guardados" description="Quita todas las estrellas.">
        <ClearButton what="favoritos" label="Vaciar guardados" confirmText="¿Quitar todos tus libros guardados?" />
      </Row>
    </Card>
  );
}

export function SessionSettings() {
  return (
    <Card id="sesiones" title="Sesiones" description="Si entraste desde una compu que no es tuya, cerrá la sesión en todos lados.">
      <form action={logoutEverywhere}>
        <button className={secondary}>Cerrar sesión en todos los dispositivos</button>
      </form>
    </Card>
  );
}

export function DangerZone() {
  const [result, action, pending] = useActionState<Result, FormData>(deleteAccount, {});
  const [open, setOpen] = useState(false);
  return (
    <Card
      id="eliminar"
      danger
      title="Eliminar cuenta"
      description="Se borran tu cuenta, tu progreso, tus guardados y tu historial. No se puede deshacer."
    >
      {open ? (
        <form action={action} className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            Escribí tu contraseña para confirmar
            <input name="clave" type="password" required autoComplete="current-password" className={input} />
          </label>
          <button disabled={pending} className="rounded-full bg-red-600 px-5 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60">
            Eliminar mi cuenta
          </button>
          <button type="button" className={secondary} onClick={() => setOpen(false)}>
            Cancelar
          </button>
          <Message result={result} />
        </form>
      ) : (
        <button type="button" className="rounded-full border border-red-500/60 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10" onClick={() => setOpen(true)}>
          Quiero eliminar mi cuenta
        </button>
      )}
    </Card>
  );
}
