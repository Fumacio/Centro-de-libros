import Link from "next/link";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import {
  AccountSettings,
  AppearanceSettings,
  DangerZone,
  PrivacySettings,
  ReadingSettings,
  SessionSettings,
} from "./forms";

export const metadata = { title: "Ajustes · Centro de libros" };

const secciones = [
  { id: "cuenta", label: "Cuenta", cuenta: true },
  { id: "apariencia", label: "Apariencia" },
  { id: "lectura", label: "Lectura y audio" },
  { id: "privacidad", label: "Privacidad", cuenta: true },
  { id: "sesiones", label: "Sesiones", cuenta: true },
  { id: "eliminar", label: "Eliminar cuenta", cuenta: true },
];

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const theme = (await cookies()).get("tema")?.value ?? "sistema";

  return (
    <div className="grid gap-8 md:grid-cols-[180px_1fr]">
      <aside className="md:sticky md:top-24 md:self-start">
        <h1 className="font-serif text-3xl font-bold">Ajustes</h1>
        <nav className="mt-4 flex flex-wrap gap-2 text-sm md:flex-col md:gap-1">
          {secciones
            .filter((s) => user || !s.cuenta)
            .map((s) => (
              <a key={s.id} href={`#${s.id}`} className="rounded-lg px-3 py-1.5 text-muted hover:bg-surface hover:text-foreground">
                {s.label}
              </a>
            ))}
        </nav>
      </aside>

      <div className="space-y-6">
        {!user && (
          <p className="rounded-xl border border-line bg-surface/50 p-4 text-sm">
            <Link href="/ingresar?volver=/ajustes" className="text-accent underline">
              Iniciá sesión
            </Link>{" "}
            para cambiar los datos de tu cuenta, tu contraseña y tu privacidad. La apariencia y la lectura se pueden
            ajustar sin cuenta.
          </p>
        )}
        {user && <AccountSettings nombre={user.nombre} email={user.email} />}
        <AppearanceSettings initial={theme} />
        <ReadingSettings />
        {user && (
          <>
            <PrivacySettings historial={user.guardarHistorial} />
            <SessionSettings />
            <DangerZone />
          </>
        )}
      </div>
    </div>
  );
}
