import type { Metadata } from "next";
import { cookies } from "next/headers";
import { FavoritesProvider } from "@/components/Favorites";
import { Shell } from "@/components/Shell";
import { UserNav } from "@/components/UserNav";
import { getFavorites } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { readableSlugs } from "@/lib/reader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Centro de libros",
  description: "Clásicos de la literatura para leer y escuchar.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const favorites = user ? await getFavorites(user.id) : [];
  const theme = (await cookies()).get("tema")?.value;

  return (
    <html lang="es" data-theme={theme === "claro" || theme === "oscuro" ? theme : undefined}>
      <body className="min-h-screen antialiased">
        <FavoritesProvider initial={favorites} loggedIn={Boolean(user)}>
          <Shell loggedIn={Boolean(user)} readable={readableSlugs()} userNav={<UserNav />}>
            {children}
          </Shell>
        </FavoritesProvider>
      </body>
    </html>
  );
}
