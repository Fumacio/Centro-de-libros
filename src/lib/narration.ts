/**
 * Narración de una página del lector, párrafo por párrafo.
 *
 * Hay dos fuentes de voz:
 * - Audio generado (public/libros/<slug>/audio/), un archivo por página con la
 *   marca de tiempo donde empieza cada párrafo.
 * - La voz del navegador (Web Speech API), si el libro todavía no tiene audio.
 */

export interface PageAudio {
  /** Archivo dentro de public/libros/<slug>/audio/. */
  archivo: string;
  /** Segundo en el que empieza cada párrafo de la página. */
  marcas?: number[];
}

/** public/libros/<slug>/audio/audio.json */
export interface BookAudio {
  voz?: string;
  paginas: Record<string, PageAudio>;
}

export interface NarrationEvents {
  onParagraph: (index: number) => void;
  onEnd: () => void;
  onError: () => void;
}

export interface NarrationOptions {
  rate: number;
  voice?: SpeechSynthesisVoice;
}

/** Empieza a narrar desde un párrafo. Devuelve la función que la corta. */
export type Narrate = (
  parrafos: string[],
  from: number,
  options: NarrationOptions,
  events: NarrationEvents,
) => () => void;

// Chrome corta las frases largas a los ~15 segundos: se habla en pedazos cortos.
const MAX_CHUNK = 200;

function chunks(text: string): string[] {
  const sentences = text.match(/[^.!?…;:]+[.!?…;:»”"]*\s*/g) ?? [text];
  const out: string[] = [];
  let current = "";
  for (const s of sentences) {
    if (current && current.length + s.length > MAX_CHUNK) {
      out.push(current.trim());
      current = "";
    }
    if (s.length > MAX_CHUNK) {
      // Frase larga sin puntos: se corta en comas o espacios.
      for (const part of s.match(new RegExp(`.{1,${MAX_CHUNK}}(\\s|,|$)`, "g")) ?? [s]) out.push(part.trim());
    } else {
      current += s;
    }
  }
  if (current.trim()) out.push(current.trim());
  return out.filter(Boolean);
}

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Qué tan natural suena una voz. Las neuronales de Edge ("Online (Natural)") son las mejores, después
 * las de Google en Chrome; las de Windows ("Microsoft Helena") suenan robóticas.
 */
function voiceQuality(v: SpeechSynthesisVoice) {
  const lang = v.lang.toLowerCase();
  let score = /natural|online|neural/i.test(v.name) ? 20 : /google/i.test(v.name) ? 10 : 0;
  if (lang === "es-ar") score += 2;
  else if (lang === "es-419" || lang === "es-mx" || lang === "es-us") score += 1;
  return score;
}

/** Voces en español disponibles en el navegador, las más naturales primero. */
export function spanishVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return [];
  return speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("es"))
    .sort((a, b) => voiceQuality(b) - voiceQuality(a) || a.name.localeCompare(b.name));
}

export const narrateWithSpeech: Narrate = (parrafos, from, { rate, voice }, events) => {
  let cancelled = false;
  speechSynthesis.cancel();

  const queue = parrafos.slice(from).flatMap((p, i) => chunks(p).map((text) => ({ text, para: from + i })));
  if (!queue.length) {
    const t = setTimeout(events.onEnd, 0);
    return () => clearTimeout(t);
  }

  queue.forEach(({ text, para }, i) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? "es-ES";
    if (voice) u.voice = voice;
    u.rate = rate;
    u.onstart = () => !cancelled && events.onParagraph(para);
    if (i === queue.length - 1) u.onend = () => !cancelled && events.onEnd();
    u.onerror = (e) => {
      // "interrupted" y "canceled" son nuestras propias paradas.
      if (!cancelled && e.error !== "interrupted" && e.error !== "canceled") events.onError();
    };
    speechSynthesis.speak(u);
  });

  return () => {
    cancelled = true;
    speechSynthesis.cancel();
  };
};

/** Narra con el audio generado de la página. */
export function narrateWithAudio(src: string, page: PageAudio): Narrate {
  return (_parrafos, from, { rate }, events) => {
    const audio = new Audio(src);
    const marcas = page.marcas ?? [];
    audio.playbackRate = rate;
    audio.currentTime = marcas[from] ?? 0;

    let last = -1;
    audio.ontimeupdate = () => {
      let para = 0;
      while (para + 1 < marcas.length && audio.currentTime >= marcas[para + 1]) para++;
      if (para !== last) events.onParagraph((last = para));
    };
    audio.onended = events.onEnd;
    audio.onerror = events.onError;
    audio.play().catch(events.onError);

    return () => {
      audio.ontimeupdate = audio.onended = audio.onerror = null;
      audio.pause();
      audio.src = "";
    };
  };
}
