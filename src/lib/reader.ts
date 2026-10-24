import lectura from "@/data/lectura.json";

export interface ReaderPage {
  n: number;
  parrafos: string[];
  imagenes: string[];
  /** Imagen de la página tal como está en el PDF. */
  original?: string;
}

export interface ReaderBook {
  slug: string;
  paginas: ReaderPage[];
}

export interface ReaderInfo {
  paginas: number;
  imagenes: number;
  original: boolean;
}

const index = lectura as Record<string, ReaderInfo>;

/** Datos del libro convertido con scripts/convertir_pdf.py, si existe. */
export function getReaderInfo(slug: string): ReaderInfo | undefined {
  return index[slug];
}

export function readableSlugs() {
  return Object.keys(index);
}
