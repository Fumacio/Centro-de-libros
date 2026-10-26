"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./Icons";
import { Sidebar } from "./Sidebar";

/** Encabezado + panel lateral + contenido. */
export function Shell({
  loggedIn,
  readable,
  userNav,
  children,
}: {
  loggedIn: boolean;
  readable: string[];
  userNav: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-20 h-[65px] border-b border-line bg-background/95 backdrop-blur">
        <nav className="flex h-full items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <button type="button" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir panel">
              <Icon name="menu" className="h-6 w-6" />
            </button>
            <Link href="/" className="font-serif text-xl font-bold">
              📚 Centro de libros
            </Link>
          </div>
          <div className="flex items-center gap-4 text-sm">{userNav}</div>
        </nav>
      </header>
      <div className="flex">
        <Sidebar loggedIn={loggedIn} readable={readable} open={open} onClose={() => setOpen(false)} />
        <div className="min-w-0 flex-1">
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-muted">
            Clásicos de la literatura para leer y escuchar. Cada libro indica de qué edición sale su texto.
          </footer>
        </div>
      </div>
    </>
  );
}
