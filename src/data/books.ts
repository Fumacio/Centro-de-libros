import type { Book } from "@/lib/types";

const gutenberg = (id: number) => ({
  name: "Project Gutenberg" as const,
  url: `https://www.gutenberg.org/ebooks/${id}`,
  gutenbergId: id,
});

const gutenbergCover = (id: number) =>
  `https://www.gutenberg.org/cache/epub/${id}/pg${id}.cover.medium.jpg`;

export const books: Book[] = [
  {
    slug: "don-quijote",
    title: "Don Quijote de la Mancha",
    author: "Miguel de Cervantes",
    year: 1605,
    language: "es",
    categories: ["clasicos", "aventura"],
    description:
      "Un hidalgo que leyó demasiados libros de caballerías sale a recorrer La Mancha junto a Sancho Panza para deshacer entuertos.",
    cover: gutenbergCover(2000),
    color: "#8a3b12",
    source: gutenberg(2000),
    illustrated: false,
  },
  {
    slug: "lazarillo-de-tormes",
    title: "La vida de Lazarillo de Tormes",
    author: "Anónimo",
    year: 1554,
    language: "es",
    categories: ["clasicos"],
    description:
      "Lázaro cuenta su vida al servicio de varios amos, sobreviviendo a fuerza de ingenio. La novela picaresca por excelencia.",
    cover: gutenbergCover(320),
    color: "#5c4a1f",
    source: gutenberg(320),
    edition: "Edición de Burgos, 1554",
    illustrated: false,
  },
  {
    slug: "alicia-en-el-pais-de-las-maravillas",
    title: "Alicia en el país de las maravillas",
    originalTitle: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    year: 1865,
    language: "es",
    categories: ["infantil", "fantasia", "clasicos"],
    description:
      "Alicia persigue a un conejo blanco y cae a un mundo absurdo de gatos que sonríen, reinas furiosas y fiestas de té interminables.",
    cover: gutenbergCover(11),
    color: "#2f6f8f",
    source: gutenberg(11),
    edition: "Ediciones del Sur, 2003. Ilustraciones de John Tenniel",
    illustrated: true,
  },
  {
    slug: "frankenstein",
    title: "Frankenstein",
    originalTitle: "Frankenstein; or, The Modern Prometheus",
    author: "Mary Shelley",
    year: 1818,
    language: "es",
    categories: ["terror", "ciencia-ficcion", "clasicos"],
    description:
      "Víctor Frankenstein da vida a una criatura y luego la abandona. Una historia sobre la ambición, la soledad y la responsabilidad.",
    cover: gutenbergCover(84),
    color: "#2e3b2c",
    source: gutenberg(84),
    edition: "LibrosEnRed",
    illustrated: false,
  },
  {
    slug: "las-aventuras-de-sherlock-holmes",
    title: "Las aventuras de Sherlock Holmes",
    originalTitle: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    year: 1892,
    language: "es",
    categories: ["misterio"],
    description:
      "Doce casos del detective más famoso de Baker Street, narrados por su inseparable amigo, el doctor Watson.",
    cover: gutenbergCover(1661),
    color: "#3b2f4a",
    source: gutenberg(1661),
    illustrated: true,
  },
  {
    slug: "la-maquina-del-tiempo",
    title: "La máquina del tiempo",
    originalTitle: "The Time Machine",
    author: "H. G. Wells",
    year: 1895,
    language: "es",
    categories: ["ciencia-ficcion", "clasicos"],
    description:
      "Un inventor viaja al año 802.701 y descubre una humanidad dividida en dos especies muy distintas.",
    cover: gutenbergCover(35),
    color: "#1f4e5c",
    source: gutenberg(35),
    edition: "Freeditorial",
    illustrated: false,
  },
  {
    slug: "dracula",
    title: "Drácula",
    originalTitle: "Dracula",
    author: "Bram Stoker",
    year: 1897,
    language: "es",
    categories: ["terror", "clasicos"],
    description:
      "A través de cartas y diarios se reconstruye la llegada del conde Drácula a Inglaterra y la lucha para detenerlo.",
    cover: gutenbergCover(345),
    color: "#5a1220",
    source: gutenberg(345),
    edition: "Biblioteca Digital ILCE",
    illustrated: false,
  },
  {
    slug: "la-isla-del-tesoro",
    title: "La isla del tesoro",
    originalTitle: "Treasure Island",
    author: "Robert Louis Stevenson",
    year: 1883,
    language: "es",
    categories: ["aventura", "infantil"],
    description:
      "Jim Hawkins encuentra el mapa de un tesoro pirata y se embarca en la Hispaniola, sin saber que Long John Silver viaja a bordo.",
    cover: gutenbergCover(120),
    color: "#1e5a3a",
    source: gutenberg(120),
    edition: "Adaptación de Andrea Braverman, Santillana, 2020",
    illustrated: true,
  },
  {
    slug: "peter-pan",
    title: "Peter Pan",
    originalTitle: "Peter and Wendy",
    author: "J. M. Barrie",
    year: 1911,
    language: "es",
    categories: ["infantil", "fantasia", "aventura"],
    description:
      "Wendy y sus hermanos vuelan con Peter Pan al País de Nunca Jamás, donde los niños no crecen y el capitán Garfio acecha.",
    cover: gutenbergCover(16),
    color: "#2c5b8a",
    source: gutenberg(16),
    edition: "Adaptación de Andrea Braverman, Santillana, 2020",
    illustrated: true,
  },
  {
    slug: "fabulas-de-esopo",
    title: "Fábulas de Esopo",
    originalTitle: "Aesop's Fables",
    author: "Esopo",
    year: -600,
    language: "es",
    categories: ["fabulas", "infantil", "clasicos"],
    description:
      "La liebre y la tortuga, la zorra y las uvas y decenas de fábulas breves que enseñan con animales que hablan.",
    cover: gutenbergCover(21),
    color: "#7a5a12",
    source: gutenberg(21),
    edition: "Ministerio de Educación de la Provincia de Santa Fe, 2018",
    illustrated: false,
  },
];

export function getBook(slug: string) {
  return books.find((b) => b.slug === slug);
}
