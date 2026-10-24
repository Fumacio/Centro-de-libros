"use client";

import { useState } from "react";
import type { Book } from "@/lib/types";

interface Props {
  book: Book;
  className?: string;
}

/** Portada real si carga; si no, una portada generada con título y autor. */
export function BookCover({ book, className = "" }: Props) {
  const [failed, setFailed] = useState(!book.cover);

  return (
    <div
      className={`relative aspect-[2/3] overflow-hidden rounded-md shadow-md ${className}`}
      style={{ background: `linear-gradient(160deg, ${book.color}, #111)` }}
    >
      {failed ? (
        <div className="flex h-full flex-col justify-between p-3 text-white">
          <span className="text-[10px] uppercase tracking-widest opacity-70">{book.author}</span>
          <span className="font-serif text-lg leading-tight">{book.title}</span>
          <span className="h-0.5 w-8 bg-white/60" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.cover}
          alt={`Portada de ${book.title}`}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
