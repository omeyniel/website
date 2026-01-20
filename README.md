# meyniel.ca

Personal website for meyniel.ca, hosted as a static site (GitHub Pages).

## Contents
- `index.html`: Home page.
- `darwin.html`: "Sur les epaules de Darwin" archive page.
- `tetris/`: Mini game.
- `pdfedit-src/`: Source for the PDF editor (Next.js).
- `pdfedit/`: Published static output for `/pdfedit/` (generated).
- `assets/`: Shared styles and images.
- `data/`: Content data used by pages.

## PDF Editor
The PDF editor is a Next.js app exported as static files and served from `/pdfedit/`.

Build and publish the static output:
```bash
/workspaces/website/build-pdfedit.sh
```

After running the script, commit and push the updated `pdfedit/` folder.

## Local preview
You can preview the static site with a local server:
```bash
cd /workspaces/website
python3 -m http.server 8000
```
Then open `http://localhost:8000/` and `http://localhost:8000/pdfedit/`.
