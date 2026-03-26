# meyniel.ca

Personal website for meyniel.ca, hosted as a static site (GitHub Pages).

## Contents
- `index.html`: Home page with site intro and contact form.
- `tetris/`: Tetris game (desktop + mobile controls).
- `mancala/`: Mancala (Kalah) game versus Touchatoutix with animations.
- `pdfedit-src/`: Source for the PDF editor (Next.js).
- `pdfedit/`: Published static output for `/pdfedit/` (generated).
- `assets/`: Shared styles and images.

## PDF Editor
The PDF editor is a Next.js app exported as static files and served from `/pdfedit/`.

Build and publish the static output:
```bash
/workspaces/website/build-pdfedit.sh
```

After running the script, commit and push the updated `pdfedit/` folder.

## Publishing a clean public snapshot
If you need a public copy of the site without the private repository history, create a new repository from the current working tree rather than pushing this repository's Git history.

## Local preview
You can preview the static site with a local server:
```bash
cd /workspaces/website
python3 -m http.server 8000
```
Then open `http://localhost:8000/` and `http://localhost:8000/pdfedit/`.
