# DatasetName — project page

Static website framework for a dual-view egocentric CV dataset. Deploy directly
to GitHub Pages (no build step).

## Structure

```
.
├── index.html          # single-page site
├── css/style.css       # all styles
├── js/main.js          # dual-video player + scroll reveal + counters
└── assets/
    ├── videos/         # ego_a.mp4, ego_b.mp4, ... (see assets/README.md)
    └── images/         # posters + scan thumbnails
```

## Sections

1. **Hero** — title, authors, CTAs, animated stats strip.
2. **Overview** — lede + feature list.
3. **Dual-View** *(signature)* — side-by-side synchronized ego videos, with
   play/pause, seek, resync, and session switcher.
4. **Scene & Object Scans** — two-card layout with metadata tags.
5. **Three Tasks** — T1 / T2 / T3 benchmark cards.
6. **Download** — file bundle cards.
7. **Citation** — BibTeX block with copy button.

## Placeholders to edit

Search `index.html` for these and replace:

- `DatasetName` — your dataset name
- Author names, affiliations
- Stat counts (`data-count` attributes)
- Session labels in `.sessions`
- Video / image paths (see `assets/README.md`)
- BibTeX entry
- Links (`href="#"`) for paper / code / video / download bundles

## Local preview

```
python3 -m http.server 8000
# open http://localhost:8000
```

(A plain `file://` open also works, but videos load more reliably over HTTP.)

## Deploy to GitHub Pages

Push to `main`, then in repo settings set **Pages → Source → Deploy from branch → main / (root)**.
