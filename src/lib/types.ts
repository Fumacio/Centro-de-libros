export type CategoryId =
  | "clasicos"
  | "aventura"
  | "fantasia"
  | "terror"
  | "misterio"
  | "ciencia-ficcion"
  | "infantil"
  | "fabulas";

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  emoji: string;
}

export interface BookSource {
  /** De dónde sale el texto (dominio público). */
  name: "Project Gutenberg" | "Wikisource" | "Internet Archive";
  url: string;
  gutenbergId?: number;
}

export interface Book {
  slug: string;
  title: string;
  originalTitle?: string;
  author: string;
  year: number;
  /** Idioma del texto que se lee en la app (ISO 639-1). */
  language: "es" | "en" | "de" | "fr";
  categories: CategoryId[];
  description: string;
  /** URL de la portada. Si falla, se dibuja una portada generada. */
  cover?: string;
  /** Color base para la portada generada. */
  color: string;
  source: BookSource;
  /** Edición de la que sale el texto que se lee en la app. */
  edition?: string;
  /** El original tiene ilustraciones (modo páginas con imágenes). */
  illustrated: boolean;
  /** Ruta al audiolibro cuando exista (paso 3). */
  audio?: string;
}
