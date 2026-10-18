import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.subset import Subsetter, Options

src, out = sys.argv[1], sys.argv[2]
INSTANCES = [(400, 14), (500, 14), (600, 24), (700, 36)]
# Latin + Latin Extended-A/B (covers Azerbaijani), punctuation, currency, arrows used in copy.
UNICODES = list(range(0x20, 0x7F)) + list(range(0xA0, 0x250)) + [0x259, 0x18F] + list(range(0x2000, 0x2070)) + [0x20AC, 0x20BC, 0x2122, 0x2190, 0x2192, 0x2191, 0x2193, 0x2212]

for wght, opsz in INSTANCES:
    f = TTFont(src)
    f = instantiateVariableFont(f, {"wght": wght, "opsz": opsz, "wdth": 100}, updateFontNames=False)
    glyf, hmtx, cmap = f["glyf"], f["hmtx"], f.getBestCmap()
    xh, cap = f["OS/2"].sxHeight, f["OS/2"].sCapHeight
    e = cmap[ord("e")]
    aw, lsb = hmtx[e]

    def add(name, code, scale, dy):
        pen = TTGlyphPen(f.getGlyphSet())
        # 180° rotation (+ optional scale) of "e": x' = -s*x + s*aw, y' = -s*y + dy
        pen.addComponent(e, (-scale, 0, 0, -scale, round(aw * scale), dy))
        g = pen.glyph()
        glyf[name] = g
        g.recalcBounds(glyf)
        hmtx[name] = (round(aw * scale), g.xMin if hasattr(g, "xMin") else 0)
        for t in f["cmap"].tables:
            if t.isUnicode():
                t.cmap[code] = name

    add("schwa", 0x259, 1, xh)
    add("Schwa", 0x18F, cap / xh, cap)
    f.setGlyphOrder(list(glyf.glyphOrder))

    # Rename: modified fonts must not reuse the original name.
    fam = "Bricolage Grotesque AZ"
    for rec in f["name"].names:
        if rec.nameID in (1, 16): rec.string = fam
        elif rec.nameID == 4: rec.string = f"{fam} {wght}"
        elif rec.nameID == 6: rec.string = f"BricolageGrotesqueAZ-{wght}"
    f["OS/2"].usWeightClass = wght

    opts = Options(); opts.flavor = "woff2"; opts.layout_features = ["*"]; opts.name_IDs = ["*"]; opts.notdef_outline = True
    sub = Subsetter(opts); sub.populate(unicodes=UNICODES); sub.subset(f)
    f.flavor = "woff2"
    path = f"{out}/bricolage-az-{wght}.woff2"
    f.save(path)
    chk = TTFont(path).getBestCmap()
    missing = [c for c in "ƏəĞğİıŞşÇçÖöÜü" if ord(c) not in chk]
    print(path.split("/")[-1], "glyphs", len(TTFont(path).getGlyphOrder()), "missing:", missing or "none")
