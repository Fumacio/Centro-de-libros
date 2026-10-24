"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReaderBook } from "@/lib/reader";
import {
  type BookAudio,
  type Narrate,
  narrateWithAudio,
  narrateWithSpeech,
  spanishVoices,
  speechSupported,
} from "@/lib/narration";

interface Props {
  slug: string;
  title: string;
  author: string;
  hasOriginal: boolean;
  hasAudio: boolean;
}

type Mode = "texto" | "original";

const FONT_SIZES = [16, 18, 20, 23, 26];
const RATES = [0.75, 1, 1.25, 1.5, 2];

/** Los títulos de capítulo llegan como párrafos cortos sin punto final. */
function isHeading(text: string) {
  return text.length < 60 && !/[.,;:!?»”"—–-]$/.test(text);
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento (modo privado): el lector sigue funcionando.
  }
}

export function Reader({ slug, title, author, hasOriginal, hasAudio }: Props) {
  const [book, setBook] = useState<ReaderBook | null>(null);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [fontStep, setFontStep] = useState(1);
  const [mode, setMode] = useState<Mode>("texto");
  const touchX = useRef<number | null>(null);
  const base = `/libros/${slug}`;

  // Audiolibro: párrafo que se está leyendo y desde cuál retomar.
  const [listening, setListening] = useState(false);
  const [para, setPara] = useState<number | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [bookAudio, setBookAudio] = useState<BookAudio | null>(null);
  const [restart, setRestart] = useState(0);
  const [canSpeak, setCanSpeak] = useState(false);
  const resumeFrom = useRef(0);
  const paraRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    setPage(load(`lectura:${slug}:pagina`, 0));
    resumeFrom.current = load(`lectura:${slug}:parrafo`, 0);
    setFontStep(load("lectura:letra", 1));
    setRate(load("audio:velocidad", 1));
    setVoiceName(load("audio:voz", ""));
    if (hasOriginal) setMode(load(`lectura:${slug}:modo`, "texto"));
    fetch(`${base}/libro.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setBook)
      .catch(() => setError(true));
    if (hasAudio) {
      fetch(`${base}/audio/audio.json`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then(setBookAudio)
        .catch(() => setBookAudio(null));
    }
  }, [slug, base, hasOriginal, hasAudio]);

  useEffect(() => {
    if (!speechSupported()) return;
    setCanSpeak(true);
    const update = () => setVoices(spanishVoices());
    update();
    speechSynthesis.addEventListener("voiceschanged", update);
    return () => speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);

  const total = book?.paginas.length ?? 0;

  const go = useCallback(
    (next: number) => {
      if (!total) return;
      const clamped = Math.max(0, Math.min(total - 1, next));
      setPage(clamped);
      setPara(null);
      resumeFrom.current = 0;
      save(`lectura:${slug}:pagina`, clamped);
      save(`lectura:${slug}:parrafo`, 0);
      window.scrollTo({ top: 0 });
    },
    [total, slug],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, page]);

  // Narra la página actual y, al terminar, pasa sola a la siguiente.
  useEffect(() => {
    if (!listening || !book) return;
    const current = book.paginas[Math.min(page, book.paginas.length - 1)];
    const pageAudio = bookAudio?.paginas[String(current.n)];
    let narrate: Narrate | null = null;
    if (pageAudio) narrate = narrateWithAudio(`${base}/audio/${pageAudio.archivo}`, pageAudio);
    else if (canSpeak) narrate = narrateWithSpeech;
    if (!narrate) {
      setListening(false);
      setAudioError(true);
      return;
    }

    return narrate(
      current.parrafos,
      Math.min(resumeFrom.current, Math.max(0, current.parrafos.length - 1)),
      { rate, voice: voices.find((v) => v.name === voiceName) },
      {
        onParagraph: (i) => {
          resumeFrom.current = i;
          setPara(i);
          save(`lectura:${slug}:parrafo`, i);
          paraRefs.current[i]?.scrollIntoView({ block: "center", behavior: "smooth" });
        },
        onEnd: () => {
          if (page >= book.paginas.length - 1) {
            setListening(false);
            setPara(null);
          } else {
            go(page + 1);
          }
        },
        onError: () => {
          setListening(false);
          setAudioError(true);
        },
      },
    );
    // voices queda afuera: cambia cuando el navegador termina de cargarlas, sin que el usuario elija otra.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening, page, book, bookAudio, rate, voiceName, restart, canSpeak, base, slug, go]);

  function toggleListening() {
    setAudioError(false);
    setListening((on) => !on);
  }

  function listenFrom(i: number) {
    resumeFrom.current = i;
    setPara(i);
    setAudioError(false);
    setListening(true);
    setRestart((n) => n + 1);
  }

  function changeRate(next: number) {
    setRate(next);
    save("audio:velocidad", next);
  }

  function changeVoice(next: string) {
    setVoiceName(next);
    save("audio:voz", next);
  }

  function changeFont(delta: number) {
    const next = Math.max(0, Math.min(FONT_SIZES.length - 1, fontStep + delta));
    setFontStep(next);
    save("lectura:letra", next);
  }

  function changeMode(next: Mode) {
    setMode(next);
    save(`lectura:${slug}:modo`, next);
  }

  if (error) {
    return <p className="text-center text-muted">No pudimos cargar este libro. Probá de nuevo más tarde.</p>;
  }
  if (!book) {
    return <p className="text-center text-muted">Cargando libro…</p>;
  }

  const current = book.paginas[Math.min(page, total - 1)];
  const usingGenerated = bookAudio !== null;
  const canListen = usingGenerated || canSpeak;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-background/95 px-4 py-2 backdrop-blur">
        <Link href={`/libros/${slug}`} className="min-w-0 truncate text-sm hover:text-accent">
          ← <span className="font-semibold">{title}</span> <span className="text-muted">· {author}</span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          {hasOriginal && (
            <div className="mr-2 flex overflow-hidden rounded-full border border-line">
              {(["texto", "original"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => changeMode(m)}
                  aria-pressed={mode === m}
                  className={`px-3 py-1 ${mode === m ? "bg-accent text-white" : ""}`}
                >
                  {m === "texto" ? "Texto" : "Página original"}
                </button>
              ))}
            </div>
          )}
          {mode === "texto" && (
            <>
              <button onClick={() => changeFont(-1)} className="rounded border border-line px-2 py-1" aria-label="Letra más chica">
                A−
              </button>
              <button onClick={() => changeFont(1)} className="rounded border border-line px-2 py-1" aria-label="Letra más grande">
                A+
              </button>
            </>
          )}
        </div>
      </div>

      <article
        className="min-h-[60vh] py-8"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 60) go(dx < 0 ? page + 1 : page - 1);
        }}
      >
        {mode === "original" && current.original ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${base}/pag/${current.original}`}
            alt={`Página ${current.n} de ${title}`}
            className="mx-auto w-full max-w-2xl rounded shadow-md"
          />
        ) : (
          <div className="font-serif leading-relaxed" style={{ fontSize: FONT_SIZES[fontStep] }}>
            {current.parrafos.map((p, i) => {
              const props = {
                ref: (el: HTMLElement | null) => {
                  paraRefs.current[i] = el;
                },
                onDoubleClick: () => canListen && listenFrom(i),
                title: canListen ? "Doble clic para escuchar desde acá" : undefined,
                className: `rounded transition-colors ${para === i ? "bg-accent/20" : ""}`,
              };
              return isHeading(p) ? (
                <h2 key={i} {...props} className={`mb-4 mt-6 text-center font-bold ${props.className}`}>
                  {p}
                </h2>
              ) : (
                <p key={i} {...props} className={`mb-4 text-pretty ${props.className}`}>
                  {p}
                </p>
              );
            })}
            {current.imagenes.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img}
                src={`${base}/img/${img}`}
                alt={`Ilustración de la página ${current.n}`}
                loading="lazy"
                className="mx-auto my-6 max-h-[70vh] rounded shadow"
              />
            ))}
          </div>
        )}
      </article>

      <nav className="flex items-center justify-between gap-3 border-t border-line py-4 text-sm">
        <button
          onClick={() => go(page - 1)}
          disabled={page === 0}
          className="rounded-full border border-line px-4 py-2 disabled:opacity-40"
        >
          ← Anterior
        </button>
        <label className="flex items-center gap-2 text-muted">
          Página
          <input
            type="number"
            min={1}
            max={total}
            value={page + 1}
            onChange={(e) => go(Number(e.target.value) - 1)}
            className="w-16 rounded border border-line bg-surface px-2 py-1 text-center text-foreground"
          />
          de {total}
        </label>
        <button
          onClick={() => go(page + 1)}
          disabled={page >= total - 1}
          className="rounded-full bg-accent px-4 py-2 text-white disabled:opacity-40"
        >
          Siguiente →
        </button>
      </nav>
      <div className="h-1 overflow-hidden rounded bg-surface">
        <div className="h-full bg-accent transition-all" style={{ width: `${((page + 1) / total) * 100}%` }} />
      </div>

      {canListen && (
        <div className="sticky bottom-0 z-10 -mx-4 mt-4 flex flex-wrap items-center gap-2 border-t border-line bg-background/95 px-4 py-2 text-sm backdrop-blur">
          <button
            onClick={toggleListening}
            className="rounded-full bg-accent px-4 py-2 text-white hover:opacity-90"
            aria-pressed={listening}
          >
            {listening ? "⏸ Pausar" : "🎧 Escuchar"}
          </button>
          <label className="flex items-center gap-1 text-muted">
            Velocidad
            <select
              value={rate}
              onChange={(e) => changeRate(Number(e.target.value))}
              className="rounded border border-line bg-surface px-1 py-1 text-foreground"
            >
              {RATES.map((r) => (
                <option key={r} value={r}>
                  {r}×
                </option>
              ))}
            </select>
          </label>
          {!usingGenerated && voices.length > 1 && (
            <label className="flex min-w-0 items-center gap-1 text-muted">
              Voz
              <select
                value={voiceName}
                onChange={(e) => changeVoice(e.target.value)}
                className="min-w-0 max-w-48 rounded border border-line bg-surface px-1 py-1 text-foreground"
              >
                <option value="">Automática</option>
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span className="ml-auto text-xs text-muted">
            {audioError
              ? "No se pudo reproducir el audio."
              : usingGenerated
                ? (bookAudio?.voz ?? "Audiolibro")
                : "Voz del navegador"}
          </span>
        </div>
      )}
    </div>
  );
}
