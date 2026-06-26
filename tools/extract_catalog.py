#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extrator do CATÁLOGO IELENPET 2026.pdf -> dados (products.js) + imagens WebP (assets/produtos/).

Uso (por lote):
    python tools/extract_catalog.py --pages 5-10
    python tools/extract_catalog.py --pages 5-10 --brand-section "Peixes"
    python tools/extract_catalog.py --pages 5-10 --dry-run
    python tools/extract_catalog.py --pages 5-10 --reset   # zera master+imagens antes

O catálogo é uma grade de ~4 colunas; cada célula tem, de cima p/ baixo:
    [imagem]  ->  [NOME]  ->  uma ou mais linhas "{tamanho} - {código}"
A marca aparece como marca d'água grande no topo da página.

- Variantes do MESMO produto (mesma marca + mesmo nome) são agrupadas num único card;
  cada variante guarda seu tamanho, código e imagem.
- Imagens: extraídas compondo a transparência (SMask) sobre fundo BRANCO e salvas em WebP,
  evitando o "fundo preto" que aparecia ao salvar PNGs com canal alpha cru.
- Seção: vem de um mapa marca->seção curado a partir do índice (pág. 3), com fallback.

Master acumulado: tools/out/products_data.json (lista de produtos agrupados). O products.js é
regenerado a partir do master a cada execução, então rodar lote a lote é seguro.
"""
import argparse
import json
import os
import re
import shutil

import fitz  # PyMuPDF
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "CATÁLOGO IELENPET 2026.pdf")
OUT_DIR = os.path.join(ROOT, "tools", "out")
IMG_DIR = os.path.join(ROOT, "assets", "produtos")
MASTER = os.path.join(OUT_DIR, "products_data.json")
PRODUCTS_JS = os.path.join(ROOT, "products.js")

# Mapa marca (marca d'água da página) -> seção. Curado a partir do índice da pág. 3,
# que não tem layout regular o bastante para parse automático confiável. Expandir por lote.
BRAND_SECTION = {
    "ALCON": "Peixes",      # inclui a linha LABCON (tratamento de aquário)
    "LABCON": "Peixes",
    "ÁGUIA": "Pássaros",    # alpiste / sementes para aves
    "DIPIL": "Agropecuária",   # defensivos (baraticida etc.)
    "BIOCARB": "Agropecuária", # glifosato / defensivos
    "AGROINCA": "Agropecuária",
    "R.A MASSAS": "Peixes",    # massas alimentares para peixes
}

# Palavras da marca d'água que na verdade são SEÇÕES (divisórias), não marcas.
SECTION_WORDS = {
    "RAÇÕES": "Rações", "MEDICAMENTOS": "Medicamentos", "PETISCOS": "Petiscos",
    "GATOS": "Gatos", "CÃES": "Cães", "ROEDORES": "Roedores", "PÁSSAROS": "Pássaros",
    "GAIOLAS": "Gaiolas", "DIVERSOS": "Diversos", "AGROPECUÁRIA": "Agropecuária",
    "ACESSÓRIOS": "Acessórios", "HIGIENE": "Higiene", "AVES": "Aves", "PEIXES": "Peixes",
    "BRINQUEDOS": "Brinquedos",
}

CODE_RE = re.compile(r"\b(\d{4,6})\b")
VARIANT_RE = re.compile(r"^(.*?)\s*[-–]\s*(\d{4,6})\s*$")


def resolve_brand_section(watermark, fallback_section):
    """A partir da marca d'água, separa marca x seção.
    - 'RAÇÕES BIOBASE' -> seção 'Rações', marca 'Biobase'
    - 'MEDICAMENTOS'   -> seção 'Medicamentos', marca 'Medicamentos'
    - 'CHEMITEC'       -> marca 'Chemitec', seção via mapa curado/fallback
    """
    toks = watermark.split()
    sec = [SECTION_WORDS[t] for t in toks if t in SECTION_WORDS]
    brand_toks = [t for t in toks if t not in SECTION_WORDS]
    if sec:
        section = sec[0]
        brand = titlecase(" ".join(brand_toks)) if brand_toks else section
        return brand, section
    brand = titlecase(watermark)
    return brand, BRAND_SECTION.get(watermark, fallback_section or "")


def fix_text(s: str) -> str:
    return re.sub(r"\s+", " ", s.replace("�", "")).strip()


def titlecase(name: str) -> str:
    small = {"DE", "DA", "DO", "E", "C/", "P/"}
    out = []
    for w in name.split():
        if w.upper() in small and out:
            out.append(w.lower())
        elif re.fullmatch(r"\d+[A-Za-z]*", w):
            out.append(w.upper())
        else:
            out.append(w.capitalize())
    return " ".join(out)


def group_key(brand, name):
    return f"{brand}|{name}".upper()


def page_brand(page) -> str:
    best, best_sz = "", 0
    for blk in page.get_text("dict").get("blocks", []):
        for line in blk.get("lines", []):
            for sp in line.get("spans", []):
                if sp["bbox"][1] < 120 and sp["size"] > best_sz and sp["text"].strip():
                    best_sz, best = sp["size"], sp["text"].strip()
    return fix_text(best).upper()


def cluster_centers(values, tol=45):
    vals = sorted(values)
    groups, cur = [], [vals[0]]
    for v in vals[1:]:
        if v - cur[-1] <= tol:
            cur.append(v)
        else:
            groups.append(cur); cur = [v]
    groups.append(cur)
    return [sum(g) / len(g) for g in groups]


def save_image_white_webp(doc, xref, smask_xref, code):
    """Compõe a imagem (com transparência) sobre fundo branco e salva como WebP."""
    pix = fitz.Pixmap(doc, xref)
    if pix.colorspace and pix.colorspace.n >= 4:  # CMYK -> RGB
        pix = fitz.Pixmap(fitz.csRGB, pix)
    base = Image.frombytes("RGB" if not pix.alpha else "RGBA",
                           (pix.width, pix.height), pix.samples)
    alpha = None
    if smask_xref:
        m = fitz.Pixmap(doc, smask_xref)
        alpha = Image.frombytes("L", (m.width, m.height), m.samples)
        if alpha.size != base.size:
            alpha = alpha.resize(base.size)
    elif base.mode == "RGBA":
        alpha = base.split()[-1]

    canvas = Image.new("RGB", base.size, (255, 255, 255))
    canvas.paste(base.convert("RGB"), mask=alpha)  # mask=None => cola direto
    path = os.path.join(IMG_DIR, f"{code}.webp")
    canvas.save(path, "WEBP", quality=82, method=6)
    return f"assets/produtos/{code}.webp"


def build_lines(page):
    """Reconstrói linhas visuais: agrupa palavras por y e separa colunas por lacuna em x.
    Resolve as linhas que o PyMuPDF funde entre colunas (ex.: '30G - X | 10G - Y')."""
    ws = page.get_text("words")
    ws.sort(key=lambda w: ((w[1] + w[3]) / 2, w[0]))
    rows = []
    for w in ws:
        yc = (w[1] + w[3]) / 2
        if rows and abs(yc - rows[-1]["yc"]) <= 4:
            rows[-1]["words"].append(w)
        else:
            rows.append({"yc": yc, "words": [w]})
    out = []
    for row in rows:
        wl = sorted(row["words"], key=lambda w: w[0])
        seg = [wl[0]]
        for w in wl[1:]:
            if w[0] - seg[-1][2] > 22:        # lacuna horizontal -> nova coluna
                out.append(seg); seg = [w]
            else:
                seg.append(w)
        out.append(seg)
    lines = []
    for seg in out:
        x0 = min(w[0] for w in seg); x1 = max(w[2] for w in seg)
        y0 = min(w[1] for w in seg)
        lines.append({"xc": (x0 + x1) / 2, "y0": y0,
                      "text": fix_text(" ".join(w[4] for w in seg))})
    return lines


def extract_page(page, fallback_section):
    """Pareamento ancorado no CÓDIGO: cada linha (nome/variante) é atribuída à imagem
    imediatamente acima dela, na mesma coluna. Garante 1 código -> 1 imagem (sem colisão)."""
    watermark = page_brand(page) or "IELENPET"
    brand, section = resolve_brand_section(watermark, fallback_section)

    imgs = []
    for img in page.get_images(full=True):
        for r in page.get_image_rects(img[0]):
            if 25 < r.width < 250 and 25 < r.height < 300:
                imgs.append({"xref": img[0], "smask": img[1], "y0": r.y0,
                             "xc": (r.x0 + r.x1) / 2, "name": [], "variants": {}})
    if not imgs:
        return brand, []

    col_centers = cluster_centers([im["xc"] for im in imgs], tol=45)
    for im in imgs:
        im["col"] = min(range(len(col_centers)), key=lambda i: abs(col_centers[i] - im["xc"]))
    by_col = {}
    for im in imgs:
        by_col.setdefault(im["col"], []).append(im)

    def owner_for(xc, y0):
        # dono = imagem da mesma coluna cujo TOPO está claramente acima da linha
        # (margem de 8pt evita capturar a imagem da linha de baixo, cujo topo fica
        # logo após o código — causa de fusões nas páginas densas de medicamentos).
        col = min(range(len(col_centers)), key=lambda i: abs(col_centers[i] - xc))
        cands = [im for im in by_col.get(col, []) if im["y0"] <= y0 - 8]
        return max(cands, key=lambda im: im["y0"]) if cands else None

    for ln in build_lines(page):
        txt = ln["text"]
        m = VARIANT_RE.match(txt)
        size = code = None
        if m:
            size, code = m.group(1), m.group(2)
        elif CODE_RE.search(txt) and len(txt) <= 8:
            size, code = "UN", CODE_RE.search(txt).group(1)
        owner = owner_for(ln["xc"], ln["y0"])
        if owner is None:
            continue
        if code:
            size = re.sub(r"\bUN\b", "", size or "").strip(" -–").upper() or "UN"
            owner["variants"].setdefault(code, {"size": size, "code": code})
        else:
            owner["name"].append((ln["y0"], txt))

    cells = []
    for im in imgs:
        if not im["variants"]:
            continue
        seen, clean = set(), []
        for _, n in sorted(im["name"]):
            if n and n not in seen:
                seen.add(n); clean.append(n)
        name = titlecase(fix_text(" ".join(clean)) or brand)
        cells.append({
            "name": name, "brand": titlecase(brand), "section": section,
            "page": page.number + 1,
            "variants": sorted(im["variants"].values(), key=lambda v: v["code"]),
            "xref": im["xref"], "smask": im["smask"],
        })
    return brand, cells


def parse_pages(spec):
    out = []
    for part in spec.split(","):
        if "-" in part:
            a, b = part.split("-"); out.extend(range(int(a), int(b) + 1))
        else:
            out.append(int(part))
    return out


def write_products_js(master):
    items = []
    for prod in master.values():
        variants = sorted(prod["variants"].values(), key=lambda v: v["code"])
        items.append({
            "code": variants[0]["code"],
            "name": prod["name"], "brand": prod["brand"], "section": prod["section"],
            "image": variants[0]["image"],
            "variants": variants,
            "pages": sorted(prod["pages"]),
        })
    items.sort(key=lambda p: (p["pages"][0], p["name"], p["code"]))
    for i, p in enumerate(items):
        p["id"] = i + 1  # identificador único e estável p/ links (código pode colidir)
    body = json.dumps(items, ensure_ascii=False, indent=1)
    with open(PRODUCTS_JS, "w", encoding="utf-8") as f:
        f.write("// Gerado por tools/extract_catalog.py — não editar à mão.\n")
        f.write(f"window.IELEN_PRODUCTS = {body};\n")
    return len(items)


def write_review(master, pages):
    path = os.path.join(OUT_DIR, f"review-{pages[0]}-{pages[-1]}.html")
    rows = []
    for prod in master.values():
        if not any(pg in pages for pg in prod["pages"]):
            continue
        variants = sorted(prod["variants"].values(), key=lambda v: v["code"])
        vs = ", ".join(f"{v['size']}={v['code']}" for v in variants)
        rows.append(
            f"<tr><td><img src='../../{variants[0]['image']}' style='height:70px;background:#fff'></td>"
            f"<td>{prod['name']}</td><td>{prod['brand']}</td><td>{prod['section']}</td>"
            f"<td>{vs}</td><td>{sorted(prod['pages'])}</td></tr>")
    html = ("<meta charset=utf-8><style>td{border:1px solid #ccc;padding:6px;font:13px sans-serif}"
            "</style><table><tr><th>img<th>nome<th>marca<th>seção<th>variantes<th>págs</tr>"
            + "".join(rows) + "</table>")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    return path


def load_master():
    """Master em disco é a lista achatada; reconstrói o dict agrupado em memória."""
    master = {}
    if not os.path.exists(MASTER):
        return master
    for p in json.load(open(MASTER, encoding="utf-8")):
        k = group_key(p["brand"], p["name"])
        master[k] = {
            "name": p["name"], "brand": p["brand"], "section": p["section"],
            "pages": set(p.get("pages", [])),
            "variants": {v["code"]: v for v in p["variants"]},
        }
    return master


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pages", required=True)
    ap.add_argument("--brand-section", default="")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--reset", action="store_true", help="zera master + imagens antes de extrair")
    args = ap.parse_args()

    os.makedirs(OUT_DIR, exist_ok=True)
    if args.reset and not args.dry_run:
        shutil.rmtree(IMG_DIR, ignore_errors=True)
        if os.path.exists(MASTER):
            os.remove(MASTER)
    os.makedirs(IMG_DIR, exist_ok=True)

    pages = parse_pages(args.pages)
    master = load_master()
    doc = fitz.open(PDF)

    new_cells = 0
    for pno in pages:
        brand, cells = extract_page(doc[pno - 1], args.brand_section)
        print(f"  pág {pno}: marca={brand!r}  células={len(cells)}")
        for c in cells:
            new_cells += 1
            primary = c["variants"][0]["code"]
            image = (f"assets/produtos/{primary}.webp" if args.dry_run
                     else save_image_white_webp(doc, c["xref"], c["smask"], primary))
            k = group_key(c["brand"], c["name"])
            prod = master.setdefault(k, {"name": c["name"], "brand": c["brand"],
                                         "section": c["section"], "pages": set(), "variants": {}})
            prod["pages"].add(c["page"])
            for v in c["variants"]:
                prod["variants"].setdefault(v["code"], {"size": v["size"], "code": v["code"], "image": image})

    products = len(master)
    print(f"\nLote: {new_cells} células -> {products} produtos agrupados no total.")

    if args.dry_run:
        for prod in list(master.values())[:20]:
            vs = ", ".join(f"{v['size']}={v['code']}" for v in prod["variants"].values())
            print(f"  {prod['name']} | {prod['brand']} | {prod['section']} | {vs}")
        return

    # grava master achatado
    flat = []
    for prod in master.values():
        flat.append({"name": prod["name"], "brand": prod["brand"], "section": prod["section"],
                     "pages": sorted(prod["pages"]),
                     "variants": sorted(prod["variants"].values(), key=lambda v: v["code"])})
    json.dump(flat, open(MASTER, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    total = write_products_js(master)
    review = write_review(master, pages)
    print(f"products.js regenerado: {total} produtos.")
    print(f"Relatório: {review}")


if __name__ == "__main__":
    main()
