#!/usr/bin/env python3
"""Convierte el PDF de un libro en páginas para el lector de la app.

Uso:
    python3 scripts/convertir_pdf.py <slug> <archivo.pdf> [--paginas-como-imagen]

Genera public/libros/<slug>/:
    libro.json        texto de cada página, en párrafos, y sus imágenes
    img/              ilustraciones extraídas del PDF (JPEG)
    pag/              (opcional) cada página renderizada como imagen

Y actualiza src/data/lectura.json con el número de páginas del libro.

Necesita poppler-utils (pdftotext, pdfimages, pdftoppm, pdfinfo) y Pillow.
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
INDICE = RAIZ / "src" / "data" / "lectura.json"

# Imágenes más chicas que esto suelen ser adornos, líneas o logos.
MIN_LADO = 120
MAX_ANCHO = 1000


def run(*args: str) -> str:
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def contar_paginas(pdf: Path) -> int:
    info = run("pdfinfo", str(pdf))
    m = re.search(r"^Pages:\s+(\d+)", info, re.M)
    if not m:
        sys.exit("No pude leer la cantidad de páginas del PDF.")
    return int(m.group(1))


NUMERO_DE_PAGINA = re.compile(r"[\divxlcIVXLC\-–— ]{1,8}")


def unir(lineas: list[str]) -> str:
    texto = ""
    for linea in lineas:
        if texto.endswith("-") and linea[:1].islower():
            texto = texto[:-1] + linea  # pala-\nbra
        else:
            texto = f"{texto} {linea}" if texto else linea
    return re.sub(r"\s+", " ", texto).strip()


def parrafos_de_pagina(pdf: Path, n: int) -> list[str]:
    """Lee los bloques de texto de la página con sus coordenadas y arma párrafos.

    pdftotext suele dar un bloque por párrafo. Cuando junta varios, se corta
    también donde una línea termina antes del margen o la siguiente tiene sangría.
    """
    xml = run("pdftotext", "-f", str(n), "-l", str(n), "-bbox-layout", str(pdf), "-")
    xml = re.sub(r"<!DOCTYPE[^>]*>", "", xml)
    xml = re.sub(r'\sxmlns="[^"]+"', "", xml, count=1)
    raiz = ET.fromstring(xml)
    salida = []
    for bloque in raiz.iter("block"):
        bx0, bx1 = float(bloque.get("xMin")), float(bloque.get("xMax"))
        ancho = max(bx1 - bx0, 1)
        actual: list[str] = []
        prev_x1 = None
        for linea in bloque.iter("line"):
            palabras = [w.text or "" for w in linea.iter("word")]
            texto = " ".join(p for p in palabras if p).strip()
            if not texto:
                continue
            x0, x1 = float(linea.get("xMin")), float(linea.get("xMax"))
            sangria = x0 - bx0 > ancho * 0.03
            corta = prev_x1 is not None and bx1 - prev_x1 > ancho * 0.15
            if actual and (sangria or corta):
                salida.append(unir(actual))
                actual = []
            actual.append(texto)
            prev_x1 = x1
        if actual:
            salida.append(unir(actual))
    return [p for p in salida if p and not NUMERO_DE_PAGINA.fullmatch(p)]


def guardar_jpeg(origen: Path, destino: Path) -> bool:
    try:
        with Image.open(origen) as im:
            if min(im.size) < MIN_LADO:
                return False
            im = im.convert("RGB")
            if im.width > MAX_ANCHO:
                im = im.resize((MAX_ANCHO, round(im.height * MAX_ANCHO / im.width)))
            im.save(destino, "JPEG", quality=80, optimize=True)
            return True
    except OSError:
        return False


def imagenes_de_pagina(pdf: Path, n: int, carpeta: Path, tmp: Path) -> list[str]:
    for f in tmp.iterdir():
        f.unlink()
    subprocess.run(
        ["pdfimages", "-f", str(n), "-l", str(n), "-png", str(pdf), str(tmp / "i")],
        check=True,
        capture_output=True,
    )
    nombres = []
    for i, f in enumerate(sorted(tmp.iterdir())):
        nombre = f"p{n:04d}-{i}.jpg"
        if guardar_jpeg(f, carpeta / nombre):
            nombres.append(nombre)
    return nombres


def renderizar_pagina(pdf: Path, n: int, carpeta: Path, tmp: Path) -> str:
    base = tmp / "render"
    subprocess.run(
        ["pdftoppm", "-f", str(n), "-l", str(n), "-r", "110", "-jpeg", "-singlefile", str(pdf), str(base)],
        check=True,
        capture_output=True,
    )
    nombre = f"{n:04d}.jpg"
    guardar_jpeg(base.with_suffix(".jpg"), carpeta / nombre)
    return nombre


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slug", help="slug del libro en src/data/books.ts, p. ej. don-quijote")
    ap.add_argument("pdf", type=Path)
    ap.add_argument(
        "--paginas-como-imagen",
        action="store_true",
        help="también guarda cada página como imagen (modo 'original', ocupa más espacio)",
    )
    args = ap.parse_args()

    if not re.fullmatch(r"[a-z0-9-]+", args.slug):
        sys.exit("El slug solo puede tener minúsculas, números y guiones.")

    destino = RAIZ / "public" / "libros" / args.slug
    if destino.exists():
        shutil.rmtree(destino)
    (destino / "img").mkdir(parents=True)
    if args.paginas_como_imagen:
        (destino / "pag").mkdir()

    total = contar_paginas(args.pdf)
    paginas = []
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t) / "imgs"
        tmp.mkdir()
        for n in range(1, total + 1):
            pagina = {
                "n": n,
                "parrafos": parrafos_de_pagina(args.pdf, n),
                "imagenes": imagenes_de_pagina(args.pdf, n, destino / "img", tmp),
            }
            if args.paginas_como_imagen:
                pagina["original"] = renderizar_pagina(args.pdf, n, destino / "pag", Path(t))
            # Las páginas en blanco no aportan nada al lector.
            if pagina["parrafos"] or pagina["imagenes"] or args.paginas_como_imagen:
                paginas.append(pagina)
            print(f"\rPágina {n}/{total}", end="", flush=True)
    print()

    (destino / "libro.json").write_text(
        json.dumps({"slug": args.slug, "paginas": paginas}, ensure_ascii=False),
        encoding="utf-8",
    )
    if not any((destino / "img").iterdir()):
        (destino / "img").rmdir()

    indice = json.loads(INDICE.read_text(encoding="utf-8")) if INDICE.exists() else {}
    indice[args.slug] = {
        "paginas": len(paginas),
        "imagenes": sum(len(p["imagenes"]) for p in paginas),
        "original": args.paginas_como_imagen,
    }
    INDICE.write_text(json.dumps(indice, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Listo: {len(paginas)} páginas en {destino.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
