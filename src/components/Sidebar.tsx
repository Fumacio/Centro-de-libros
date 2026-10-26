"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { categories } from "@/data/categories";
import { Icon, isIconName, type IconName } from "./Icons";

interface Props {
  loggedIn: boolean;
  /** Slugs de los libros que se pueden leer, para "Sorprendeme". */
  readable: string[];
  open: boolean;
  onClose: () => void;
}

type Section = "categorias" | "biblioteca" | "cuenta";

function useCollapsed() {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      setClosed(JSON.parse(localStorage.getItem("panel:cerrado") ?? "{}"));
    } catch {}
  }, []);
  const toggle = (s: Section) =>
    setClosed((prev) => {
      const next = { ...prev, [s]: !prev[s] };
      try {
        localStorage.setItem("panel:cerrado", JSON.stringify(next));
      } catch {}
      return next;
    });
  return [closed, toggle] as const;
}

/** Panel lateral: fijo en pantallas anchas, cajón que se abre con ☰ en el celular. */
export function Sidebar({ loggedIn, readable, open, onClose }: Props) {
  const pathname = usePathname();
  const [closed, toggle] = useCollapsed();

  useEffect(onClose, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const random = () => readable[Math.floor(Math.random() * readable.length)];

  const item = (href: string, icon: IconName | string, label: string, exact = true) => {
    // Los atajos a una sección de otra página (/perfil#guardados) no se marcan.
    const active = !href.includes("#") && (exact ? pathname === href : pathname.startsWith(href));
    return (
      <Link
        key={href}
        href={href}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
          active ? "bg-surface font-semibold" : "hover:bg-surface/70"
        }`}
      >
        {isIconName(icon) ? <Icon name={icon} /> : <span className="w-5 text-center">{icon}</span>}
        {label}
      </Link>
    );
  };

  const section = (id: Section, title: string, children: React.ReactNode) => (
    <div className="border-t border-line pt-3">
      <button
        type="button"
        onClick={() => toggle(id)}
        aria-expanded={!closed[id]}
        className="flex w-full items-center justify-between px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground"
      >
        {title}
        <Icon name="chevron" className={`h-4 w-4 transition ${closed[id] ? "-rotate-90" : ""}`} />
      </button>
      {!closed[id] && <div className="space-y-0.5 pb-3">{children}</div>}
    </div>
  );

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r border-line bg-background px-3 py-4 transition-transform lg:sticky lg:top-[65px] lg:z-0 lg:h-[calc(100vh-65px)] lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Panel de navegación"
      >
        <div className="mb-3 flex items-center justify-between px-3 lg:hidden">
          <span className="font-serif text-lg font-bold">📚 Centro de libros</span>
          <button type="button" onClick={onClose} aria-label="Cerrar panel">
            <Icon name="close" />
          </button>
        </div>

        <nav className="space-y-0.5 pb-3">
          {item(loggedIn ? "/para-ti" : "/", "home", "Inicio")}
          {item(loggedIn ? "/" : "/categorias", "explore", loggedIn ? "Explorar" : "Todas las categorías")}
          {readable.length > 0 && (
            <button
              type="button"
              onClick={() => (window.location.href = `/libros/${random()}`)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-surface/70"
            >
              <Icon name="shuffle" /> Sorprendeme
            </button>
          )}
        </nav>

        {section(
          "categorias",
          "Categorías",
          <>
            {item("/categorias", "grid", "Todas")}
            {categories.map((c) => item(`/categorias/${c.id}`, c.emoji, c.name))}
          </>,
        )}

        {loggedIn &&
          section(
            "biblioteca",
            "Mi biblioteca",
            <>
              {item("/perfil#leyendo", "book", "Seguir leyendo")}
              {item("/perfil#guardados", "star", "Guardados")}
              {item("/perfil#historial", "clock", "Historial")}
            </>,
          )}

        {section(
          "cuenta",
          "Cuenta",
          loggedIn ? (
            <>
              {item("/perfil", "user", "Perfil")}
              {item("/ajustes", "settings", "Ajustes")}
            </>
          ) : (
            <>
              {item("/ingresar", "login", "Iniciar sesión")}
              {item("/registro", "user", "Crear cuenta")}
              {item("/ajustes", "settings", "Ajustes")}
            </>
          ),
        )}
      </aside>
    </>
  );
}
