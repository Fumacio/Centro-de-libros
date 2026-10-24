import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Centro de libros",
  description: "Libros de dominio público para leer y escuchar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <header className="border-b border-line">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-serif text-xl font-bold">
              📚 Centro de libros
            </Link>
            <Link href="/categorias" className="text-sm hover:text-accent">
              Categorías
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-muted">
          Todos los libros son de dominio público. Textos de Project Gutenberg.
        </footer>
      </body>
    </html>
  );
}
