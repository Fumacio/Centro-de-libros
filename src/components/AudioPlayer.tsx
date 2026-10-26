"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Clave del libro para recordar dónde quedó. */
  slug: string;
  src: string;
  className?: string;
}

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

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
    // Sin almacenamiento (modo privado): el reproductor sigue funcionando.
  }
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "--:--";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Reproductor del audiolibro: un archivo por libro, recuerda la posición y la velocidad. */
export function AudioPlayer({ slug, src, className = "" }: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(NaN);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState(false);
  const positionKey = `audio:${slug}:posicion`;
  const lastSaved = useRef(0);

  useEffect(() => {
    setRate(load("audio:velocidad", 1));
    // Si el audio cargó antes de que React se conecte, el evento ya pasó.
    if (audio.current && audio.current.readyState >= 1) onLoadedMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = rate;
  }, [rate]);

  function savePosition(t: number) {
    lastSaved.current = t;
    save(positionKey, t);
  }

  function onLoadedMetadata() {
    const el = audio.current!;
    setDuration(el.duration);
    const saved = load(positionKey, 0);
    // Si había terminado, empieza de nuevo.
    if (saved > 0 && (!Number.isFinite(el.duration) || saved < el.duration - 5)) {
      el.currentTime = saved;
      setTime(saved);
    }
    el.playbackRate = rate;
  }

  function onTimeUpdate() {
    const t = audio.current!.currentTime;
    setTime(t);
    if (Math.abs(t - lastSaved.current) >= 5) savePosition(t);
  }

  function toggle() {
    const el = audio.current;
    if (!el) return;
    setError(false);
    if (el.paused) el.play().catch(() => setError(true));
    else el.pause();
  }

  function seek(t: number) {
    const el = audio.current;
    if (!el) return;
    const max = Number.isFinite(el.duration) ? el.duration : t;
    el.currentTime = Math.max(0, Math.min(max, t));
    setTime(el.currentTime);
    savePosition(el.currentTime);
  }

  function changeRate(next: number) {
    setRate(next);
    save("audio:velocidad", next);
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-sm ${className}`}>
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onDurationChange={() => setDuration(audio.current!.duration)}
        onTimeUpdate={onTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          savePosition(audio.current!.currentTime);
        }}
        onEnded={() => savePosition(0)}
        onError={() => {
          setPlaying(false);
          setError(true);
        }}
      />
      <div className="flex items-center gap-1">
        <button
          onClick={() => seek(time - 15)}
          className="rounded-full border border-line px-2 py-1"
          aria-label="Retroceder 15 segundos"
        >
          ↺ 15
        </button>
        <button
          onClick={toggle}
          className="rounded-full bg-accent px-4 py-2 text-white hover:opacity-90"
          aria-pressed={playing}
        >
          {playing ? "⏸ Pausar" : "🎧 Escuchar"}
        </button>
        <button
          onClick={() => seek(time + 30)}
          className="rounded-full border border-line px-2 py-1"
          aria-label="Adelantar 30 segundos"
        >
          30 ↻
        </button>
      </div>
      <div className="flex min-w-48 flex-1 items-center gap-2">
        <span className="w-14 text-right text-xs tabular-nums text-muted">{formatTime(time)}</span>
        <input
          type="range"
          min={0}
          max={Number.isFinite(duration) ? duration : 0}
          step={1}
          value={time}
          onChange={(e) => seek(Number(e.target.value))}
          disabled={!Number.isFinite(duration)}
          aria-label="Posición del audio"
          className="h-1 flex-1 accent-accent"
        />
        <span className="w-14 text-xs tabular-nums text-muted">{formatTime(duration)}</span>
      </div>
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
      {error && <span className="w-full text-xs text-muted">No se pudo reproducir el audio.</span>}
    </div>
  );
}
