#!/usr/bin/env python3
"""Limpia el texto de un libro ya convertido (public/libros/<slug>/libro.json).

Uso:
    python3 scripts/limpiar_libro.py <slug> [--desde N] [--hasta N] [--quitar N,N]
                                     [--quitar-imagen archivo.jpg] [--cabo-roto]

Siempre:
  - quita los cuadraditos que deja el PDF donde una palabra se cortaba con guion
    al final de la línea ("guir□nalda" → "guirnalda");
  - une las palabras cortadas entre una página y la siguiente ("hu-" + "biera");
  - quita encabezados que se repiten arriba de cada página ("C apítulo 3 • …",
    el nombre de la editorial pegado al texto);
  - cambia el guion doble "––" por la raya "—";
  - saca las páginas que quedaron vacías.

Con opciones (los números son los de la página en el PDF, el campo "n"):
  --desde / --hasta   primera y última página que se leen; lo de antes (portada,
                      créditos, índice) y lo de después (colofón, contratapa) se borra
  --quitar            otras páginas a borrar
  --quitar-imagen     imágenes sueltas a borrar (logos, sellos)
  --cabo-roto         el libro tiene versos con la última sílaba cortada a
                      propósito (Don Quijote): el corte queda como "boquirru-"

Se puede correr más de una vez sobre el mismo libro.
"""

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
INDICE = RAIZ / "src" / "data" / "lectura.json"

MINUS = "a-záéíóúüñ"
# pdftotext marca con \x02 el guion de una palabra cortada al final de la línea.
CORTE = "\x02"
# Palabras que llevan guion de verdad aunque caigan al final de una línea.
CON_GUION = re.compile(rf"\b(no){CORTE}(?=muert|vivo|nato)", re.I)
ENCABEZADO_CAPITULO = re.compile(r"^C ?apítulo\s+\d+\s*([•.]\s*\S.*)?$")


def limpiar_texto(texto: str, cabo_roto: bool = False) -> str:
    texto = CON_GUION.sub(r"\1-", texto)
    if cabo_roto:
        texto = re.sub(rf"{CORTE}\s*", "- ", texto)
    else:
        texto = re.sub(rf"(?<=\w){CORTE}\s*(?=\w)", "", texto)
        texto = texto.replace(CORTE, "-")
    texto = texto.replace("––", "—")
    # Títulos con letras separadas por el diseño: "C apítulo", "W endy".
    texto = re.sub(r"\bC apítulo\b", "Capítulo", texto)
    return re.sub(r"\s+", " ", texto).strip()


def es_titulo(texto: str) -> bool:
    return len(texto) < 60 and not re.search(r"[.,;:]$", texto) and not texto[:1].isdigit()


def quitar_encabezados(paginas: list[dict]) -> None:
    # "Capítulo 3 • ¡Vámonos!" arriba de la página es encabezado. "Capítulo 3"
    # seguido de su título es el comienzo real del capítulo y se queda.
    for p in paginas:
        quedan = []
        for i, t in enumerate(p["parrafos"]):
            m = ENCABEZADO_CAPITULO.match(t)
            if m:
                siguiente = p["parrafos"][i + 1] if i + 1 < len(p["parrafos"]) else ""
                if m.group(1) or not es_titulo(siguiente):
                    continue
                t = re.sub(r"^C ?apítulo", "Capítulo", t)
            quedan.append(t)
        p["parrafos"] = quedan

    # Una palabra pegada al principio de muchas páginas ("LibrosEnRed convicciones…")
    # es el nombre de la editorial o del libro en el encabezado.
    primeras = Counter()
    for p in paginas:
        if p["parrafos"]:
            m = re.match(rf"(\S{{6,}}) (?=[{MINUS}])", p["parrafos"][0])
            if m:
                primeras[m.group(1)] += 1
    minimo = max(5, len(paginas) // 10)
    for palabra, veces in primeras.items():
        if veces < minimo:
            continue
        for p in paginas:
            p["parrafos"] = [re.sub(rf"^{re.escape(palabra)}\s+", "", t) for t in p["parrafos"]]
            p["parrafos"] = [t for t in p["parrafos"] if t != palabra]


def unir_cortes_entre_paginas(paginas: list[dict]) -> None:
    con_texto = [p for p in paginas if p["parrafos"]]
    for a, b in zip(con_texto, con_texto[1:]):
        ultimo, primero = a["parrafos"][-1], b["parrafos"][0]
        if re.search(rf"[{MINUS}]-$", ultimo) and re.match(rf"[{MINUS}]", primero):
            resto, _, despues = primero.partition(" ")
            a["parrafos"][-1] = ultimo[:-1] + resto
            if despues:
                b["parrafos"][0] = despues
            else:
                b["parrafos"].pop(0)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slug")
    ap.add_argument("--desde", type=int)
    ap.add_argument("--hasta", type=int)
    ap.add_argument("--quitar", default="", help="números de página separados por coma")
    ap.add_argument("--quitar-imagen", action="append", default=[])
    ap.add_argument("--cabo-roto", action="store_true")
    args = ap.parse_args()

    carpeta = RAIZ / "public" / "libros" / args.slug
    archivo = carpeta / "libro.json"
    if not archivo.exists():
        sys.exit(f"No existe {archivo.relative_to(RAIZ)}. Primero convertí el PDF.")
    libro = json.loads(archivo.read_text(encoding="utf-8"))
    paginas: list[dict] = libro["paginas"]

    quitar = {int(n) for n in args.quitar.split(",") if n.strip()}
    fuera = [
        p
        for p in paginas
        if p["n"] in quitar or (args.desde and p["n"] < args.desde) or (args.hasta and p["n"] > args.hasta)
    ]
    paginas = [p for p in paginas if p not in fuera]

    for p in paginas:
        p["parrafos"] = [t for t in (limpiar_texto(t, args.cabo_roto) for t in p["parrafos"]) if t]
        p["imagenes"] = [i for i in p["imagenes"] if i not in args.quitar_imagen]
    quitar_encabezados(paginas)
    if not args.cabo_roto:
        unir_cortes_entre_paginas(paginas)
    vacias = [p for p in paginas if not p["parrafos"] and not p["imagenes"]]
    paginas = [p for p in paginas if p not in vacias]

    # Borra las imágenes que ya no usa ninguna página.
    usadas = {i for p in paginas for i in p["imagenes"]} | {p.get("original") for p in paginas}
    for sub in ("img", "pag"):
        if (carpeta / sub).is_dir():
            for f in (carpeta / sub).iterdir():
                if f.name not in usadas:
                    f.unlink()

    libro["paginas"] = paginas
    archivo.write_text(json.dumps(libro, ensure_ascii=False), encoding="utf-8")

    indice = json.loads(INDICE.read_text(encoding="utf-8"))
    info = indice.setdefault(args.slug, {})
    info["paginas"] = len(paginas)
    info["imagenes"] = sum(len(p["imagenes"]) for p in paginas)
    INDICE.write_text(json.dumps(indice, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{args.slug}: {len(paginas)} páginas ({len(fuera) + len(vacias)} quitadas)")


if __name__ == "__main__":
    main()
