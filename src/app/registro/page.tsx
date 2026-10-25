import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Crear cuenta · Centro de libros" };

export default async function Page({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const { volver } = await searchParams;
  if (await getCurrentUser()) redirect(volver?.startsWith("/") && !volver.startsWith("//") ? volver : "/para-ti");
  return <AuthForm mode="registro" next={volver} />;
}
