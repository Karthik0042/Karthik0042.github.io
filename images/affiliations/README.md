# Affiliation logos

Logos shown in the fixed footer bar on every page.

Put these files in this folder (exact names, lowercase):

| File            | Affiliation                          |
|-----------------|--------------------------------------|
| `iitm.png`      | IIT Madras                           |
| `wadhwani.png`  | Wadhwani School of Data Science & AI |
| `harvard.png`   | Harvard University                   |

Tips:
- PNG with a transparent background works best (SVG also works: change the extension in `_data/affiliations.yml` to match).
- Logos are shown about 40px tall on a light tile, so wide wordmarks and square crests both look fine.
- To add another affiliation: add the image here and a new entry in `_data/affiliations.yml`.
- Until a file is present, the footer shows the name as a text badge, so nothing breaks.
