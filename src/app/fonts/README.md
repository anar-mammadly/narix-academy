# Bricolage Grotesque AZ

Static instances of [Bricolage Grotesque](https://github.com/ateliertriay/bricolage)
(SIL Open Font License 1.1, see `OFL-BricolageGrotesque.txt`) with two added glyphs
the upstream font lacks: **ə** (U+0259) and **Ə** (U+018F), drawn as a 180° rotated "e".
Renamed to "Bricolage Grotesque AZ" as the OFL requires for modified versions.

Instances: 400 / 500 (opsz 14), 600 (opsz 24), 700 (opsz 36), subset to Latin + Latin Extended.

Rebuild (needs `pip install fonttools brotli`):

```bash
curl -L -o /tmp/bricolage.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf"
python3 scripts/build-font.py /tmp/bricolage.ttf src/app/fonts
```
