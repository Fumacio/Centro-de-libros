import Link from "next/link";
import { logout } from "@/app/cuenta/actions";
import { getCurrentUser } from "@/lib/auth";

export async function UserNav() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <>
        <Link href="/ingresar" className="hover:text-accent">
          Iniciar sesión
        </Link>
        <Link href="/registro" className="rounded-full bg-accent px-3 py-1 text-white hover:opacity-90">
          Crear cuenta
        </Link>
      </>
    );
  }
  return (
    <>
      <Link href="/perfil" className="flex items-center gap-2 hover:text-accent" title="Tu perfil">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-accent font-semibold text-white">
          {user.nombre.trim().charAt(0).toUpperCase()}
        </span>
        <span className="hidden sm:inline">{user.nombre}</span>
      </Link>
      <form action={logout}>
        <button className="rounded-full border border-line px-3 py-1 hover:border-accent">Salir</button>
      </form>
    </>
  );
}
