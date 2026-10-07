"""Builds the sign artwork's Helvetica Neue LT Pro faces from the font package.

The signs use Helvetica Neue LT Pro (55 Roman, 56 Italic, 75 Bold, 95 Black), the cut UNBC's own
documents are set in (e.g. the ORI "Ready Roadmap"). The package lives in the UNBC logo kit
(vendor/unbc-logo/fonts/source/, every weight and width), which builds the same four faces the
same way for the lockup. The package's copies each lack a table:

  * Roman, Italic and Bold have no kerning. Their letters have exactly the advance widths of the
    older Helvetica Neue faces in Fonts/ (only rare symbols such as ® differ), and Linotype's
    kerning is the same in both releases where they overlap, so the older faces' kerning pairs are
    copied in, limited to characters both fonts have.
  * Black has no ligature table. Its fi and fl glyphs are there (U+FB01, U+FB02); a 'liga'
    feature for them is added, as the other three faces already have.

It writes Fonts/HelveticaNeueLTPro-*.otf for the browser (preview and PNG), a TrueType copy of
Italic, Bold and Black (Fonts/HelveticaNeueLTPro-*.ttf) for the PDF export, since jsPDF can only
embed TrueType outlines, and src/sign/brandFontCoverage.js, the characters each face has (about
380; the older faces stand in for the rest). It also writes TrueType copies of the older Bold and
Black for the PDF export's fallback. Run from the repository root, with the logo kit checked out
(`git submodule update --init`):

    python3 tools/build_brand_fonts.py
"""

from pathlib import Path

from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont, newTable

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / 'Fonts'
SOURCE = ROOT / 'vendor' / 'unbc-logo' / 'fonts' / 'source'

# (source file, output name, older face to take kerning from or None, make a TrueType copy)
FACES = [
    ('HelveticaNeueLTProRoman.otf', 'HelveticaNeueLTPro-Roman', 'HelveticaNeueRoman.otf', False),
    ('HelveticaNeueLTProIt.otf', 'HelveticaNeueLTPro-Italic', 'HelveticaNeueItalic.ttf', True),
    ('HelveticaNeueLTProBd.otf', 'HelveticaNeueLTPro-Bold', 'HelveticaNeueBold.otf', True),
    ('HelveticaNeueLTProBlk.otf', 'HelveticaNeueLTPro-Black', None, True),
]

# The older faces LT Pro falls back to. The PDF export needs TrueType copies of Bold and Black
# (Italic is already TrueType; Roman goes out in jsPDF's standard Helvetica).
FALLBACK_TRUETYPE = [
    ('HelveticaNeueBold.otf', 'HelveticaNeueBold.ttf'),
    ('HelveticaNeueBlack.otf', 'HelveticaNeueBlack.ttf'),
]

# How far a converted quadratic curve may stray from the original cubic, in font units.
MAX_CURVE_ERROR = 0.5


def char_names(font):
    """Glyph name → its first code point."""
    names = {}
    for code, name in sorted(font.getBestCmap().items()):
        names.setdefault(name, code)
    return names


def kerning_pairs(font):
    """Every non-zero kerning pair in a font, as {(left char, right char): x-advance}."""
    chars = char_names(font)
    pairs = {}

    def add(left, right, value):
        if value and left in chars and right in chars:
            pairs.setdefault((chars[left], chars[right]), value)

    if 'GPOS' in font:
        table = font['GPOS'].table
        lookups = {index for record in table.FeatureList.FeatureRecord if record.FeatureTag == 'kern'
                   for index in record.Feature.LookupListIndex}
        order = font.getGlyphOrder()
        for index in sorted(lookups):
            lookup = table.LookupList.Lookup[index]
            for sub in lookup.SubTable:
                if lookup.LookupType == 9:
                    sub = sub.ExtSubTable
                if getattr(sub, 'LookupType', lookup.LookupType) != 2:
                    continue
                if sub.Format == 1:
                    for left, pair_set in zip(sub.Coverage.glyphs, sub.PairSet):
                        for record in pair_set.PairValueRecord:
                            add(left, record.SecondGlyph, getattr(record.Value1, 'XAdvance', 0))
                else:
                    first, second = sub.ClassDef1.classDefs, sub.ClassDef2.classDefs
                    for left in sub.Coverage.glyphs:
                        row = sub.Class1Record[first.get(left, 0)].Class2Record
                        for right in order:
                            add(left, right, getattr(row[second.get(right, 0)].Value1, 'XAdvance', 0))
    if 'kern' in font:
        for subtable in font['kern'].kernTables:
            for (left, right), value in subtable.kernTable.items():
                add(left, right, value)
    return pairs


def add_kerning(font, donor):
    cmap = font.getBestCmap()
    lines = [
        f'  pos {cmap[left]} {cmap[right]} {value};'
        for (left, right), value in sorted(kerning_pairs(donor).items())
        if left in cmap and right in cmap
    ]
    addOpenTypeFeaturesFromString(font, 'languagesystem DFLT dflt;\nlanguagesystem latn dflt;\n'
                                  'feature kern {\n' + '\n'.join(lines) + '\n} kern;\n', tables=['GPOS'])
    return len(lines)


def add_ligatures(font):
    cmap = font.getBestCmap()
    rules = [f'  sub {cmap[ord(first)]} {cmap[ord(second)]} by {cmap[code]};'
             for first, second, code in [('f', 'i', 0xFB01), ('f', 'l', 0xFB02)] if code in cmap]
    addOpenTypeFeaturesFromString(font, 'languagesystem DFLT dflt;\nlanguagesystem latn dflt;\n'
                                  'feature liga {\n' + '\n'.join(rules) + '\n} liga;\n', tables=['GSUB'])
    return len(rules)


def to_truetype(font):
    """Converts CFF outlines to quadratic glyf outlines in place."""
    glyph_set = font.getGlyphSet()
    glyphs = {}
    for name in font.getGlyphOrder():
        pen = TTGlyphPen(glyph_set)
        glyph_set[name].draw(Cu2QuPen(pen, MAX_CURVE_ERROR, reverse_direction=True))
        glyphs[name] = pen.glyph()
    font['loca'] = newTable('loca')
    glyf = font['glyf'] = newTable('glyf')
    glyf.glyphOrder = font.getGlyphOrder()
    glyf.glyphs = glyphs
    del font['CFF ']
    if 'VORG' in font:
        del font['VORG']
    font['head'].glyphDataFormat = 0
    maxp = font['maxp']
    maxp.tableVersion = 0x00010000
    for field in ('maxZones', 'maxTwilightPoints', 'maxStorage', 'maxFunctionDefs',
                  'maxInstructionDefs', 'maxStackElements', 'maxSizeOfInstructions',
                  'maxComponentElements'):
        setattr(maxp, field, 0)
    maxp.maxZones = 1
    post = font['post']
    post.formatType = 2.0
    post.extraNames = []
    post.mapping = {}
    post.glyphOrder = font.getGlyphOrder()
    font.sfntVersion = '\x00\x01\x00\x00'


def coverage_ranges(font):
    """The code points a font maps, as [first, last] runs."""
    runs = []
    for code in sorted(font.getBestCmap()):
        if runs and code == runs[-1][1] + 1:
            runs[-1][1] = code
        else:
            runs.append([code, code])
    return runs


def write_coverage(coverage):
    lines = [
        '// Generated by tools/build_brand_fonts.py — do not edit by hand.',
        '// The characters each Helvetica Neue LT Pro face has, as [first, last] code point runs. The',
        '// PDF export sets text the face can\'t draw in the older Helvetica Neue faces instead.',
        'export const BRAND_FACE_COVERAGE = {'
    ]
    for face, runs in coverage.items():
        lines.append(f'  {face}: {runs},')
    lines.append('}')
    (ROOT / 'src' / 'sign' / 'brandFontCoverage.js').write_text('\n'.join(lines) + '\n')


def main():
    coverage = {}
    for source, output, donor, truetype in FACES:
        font = TTFont(SOURCE / source)
        if donor:
            added = add_kerning(font, TTFont(FONTS / donor))
            print(f'{output}: {added} kerning pairs from {donor}')
        if 'GSUB' not in font:
            print(f'{output}: {add_ligatures(font)} ligatures')
        font.save(FONTS / f'{output}.otf')
        coverage[output.split('-')[-1].lower()] = coverage_ranges(font)
        if truetype:
            ttf = TTFont(FONTS / f'{output}.otf')
            to_truetype(ttf)
            ttf.save(FONTS / f'{output}.ttf')
            print(f'{output}: TrueType copy for the PDF export')
    write_coverage(coverage)
    for source, output in FALLBACK_TRUETYPE:
        font = TTFont(FONTS / source)
        to_truetype(font)
        font.save(FONTS / output)
        print(f'{output}: TrueType copy of {source} for the PDF export')


if __name__ == '__main__':
    main()
