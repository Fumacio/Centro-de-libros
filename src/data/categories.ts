import type { Category } from "@/lib/types";

export const categories: Category[] = [
  { id: "clasicos", name: "Clásicos", emoji: "🏛️", description: "Las obras que marcaron la literatura." },
  { id: "aventura", name: "Aventura", emoji: "🧭", description: "Viajes, tesoros y peligros." },
  { id: "fantasia", name: "Fantasía", emoji: "✨", description: "Mundos mágicos e imposibles." },
  { id: "terror", name: "Terror", emoji: "🦇", description: "Monstruos, sombras y miedo." },
  { id: "misterio", name: "Misterio", emoji: "🔎", description: "Detectives y casos por resolver." },
  { id: "ciencia-ficcion", name: "Ciencia ficción", emoji: "🚀", description: "El futuro y la ciencia imaginada." },
  { id: "infantil", name: "Infantil", emoji: "🧸", description: "Para leer en familia." },
  { id: "fabulas", name: "Fábulas", emoji: "🦊", description: "Historias breves con moraleja." },
];

export function getCategory(id: string) {
  return categories.find((c) => c.id === id);
}
