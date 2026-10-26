import Link from "next/link";
import { redirect } from "next/navigation";
import { getBook } from "@/data/books";
import { getCategory } from "@/data/categories";
import { BookCard } from "@/components/BookCard";
import { ContinueReading } from "@/components/ContinueReading";
import { getHistory, getSearchHistory } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Perfil · Centro de libros" };

const fecha = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" });
const hora = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?volver=/perfil");
  const [history, searches] = await Promise.all([getHistory(user.id), getSearchHistory(user.id)]);

  const reading = history.progress.flatMap((p) => {
    const book = getBook(p.libro);
    return book ? [{ ...p, book }] : [];
  });
  const finished = reading.filter((r) => r.total && r.pagina + 1 >= r.total);
  const inProgress = reading.filter((r) => !finished.includes(r));
  const favorites = history.favorites.flatMap((slug) => getBook(slug) ?? []);
  const pages = reading.reduce((n, r) => n + r.pagina + 1, 0);

  const stats = [
    { label: "Leyendo", value: inProgress.length },
    { label: "Terminados", value: finished.length },
    { label: "Guardados", value: favorites.length },
    { label: "Páginas leídas", value: pages },
  ];

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap items-center gap-5 rounded-2xl border border-line bg-surface/50 p-6">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-accent font-serif text-4xl font-bold text-white">
          {user.nombre.trim().charAt(0).toUpperCase()}
        </span>
        <div className="flex-1">
          <h1 className="font-serif text-3xl font-bold">{user.nombre}</h1>
          <p className="text-muted">{user.email}</p>
          <p className="text-sm text-muted">Lector desde el {fecha.format(user.creado)}</p>
        </div>
        <Link href="/ajustes" className="rounded-full border border-line px-4 py-2 text-sm hover:border-accent">
          Editar perfil
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line p-4">
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </section>

      <section id="leyendo" className="scroll-mt-24">
        <h2 className="font-serif text-2xl font-bold">Seguir leyendo</h2>
        {inProgress.length ? (
          <ContinueReading items={inProgress} />
        ) : (
          <Empty>Todavía no empezaste ningún libro.</Empty>
        )}
      </section>

      {finished.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl font-bold">Terminados</h2>
          <ContinueReading items={finished} />
        </section>
      )}

      <section id="guardados" className="scroll-mt-24">
        <h2 className="font-serif text-2xl font-bold">Guardados</h2>
        {favorites.length ? (
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {favorites.map((book) => (
              <BookCard key={book.slug} book={book} />
            ))}
          </div>
        ) : (
          <Empty>Pasá el cursor sobre un libro y tocá la estrella para guardarlo.</Empty>
        )}
      </section>

      <section id="historial" className="scroll-mt-24">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl font-bold">Historial de búsquedas</h2>
          <Link href="/ajustes#privacidad" className="text-sm text-accent hover:underline">
            Administrar
          </Link>
        </div>
        {!user.guardarHistorial && (
          <p className="mt-2 text-sm text-muted">El historial está pausado: tus búsquedas nuevas no se guardan.</p>
        )}
        {searches.length ? (
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
            {searches.map((s, i) => {
              const params = new URLSearchParams();
              if (s.texto) params.set("q", s.texto);
              if (s.categoria) params.set("cat", s.categoria);
              return (
                <li key={i}>
                  <Link href={`/?${params}`} className="flex items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-surface/70">
                    <span>
                      {s.texto || "Sin texto"}
                      {s.categoria && <span className="text-muted"> · {getCategory(s.categoria)?.name ?? s.categoria}</span>}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{hora.format(s.creado)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>No hay búsquedas guardadas.</Empty>
        )}
      </section>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">{children}</p>;
}
