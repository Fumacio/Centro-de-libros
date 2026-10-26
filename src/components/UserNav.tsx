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
      <Link href="/para-ti" className="hover:text-accent">
        Para ti
      </Link>
      <form action={logout} className="flex items-center gap-2">
        <span className="hidden text-muted sm:inline">{user.nombre}</span>
        <button className="rounded-full border border-line px-3 py-1 hover:border-accent">Salir</button>
      </form>
    </>
  );
}
