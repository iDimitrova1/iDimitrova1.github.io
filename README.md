# Ganz Model Design — original-style remake, fixed red edition

This version keeps the restrained visual structure of the reference website while using semantic HTML5, responsive CSS, dependency-free JavaScript, native dialog galleries, and Vite for local development and production builds.

## Requested changes implemented

- The colour selector has been removed. Red is now the single fixed accent colour.
- The old multi-column footer lists have been moved into a fixed, clickable side drawer. The drawer contains accordion groups for every service and the contact details.
- Typography has been normalised to the reference site's compact Arial/Georgia treatment and increased where the previous remake was undersized.
- All six homepage category panels are complete clickable links. The “Прочети още” labels are removed.
- Each category has its own URL and photo gallery:
  - `/3d-ruter-freza/`
  - `/vakuum-formovane/`
  - `/kompozitni-materiali/`
  - `/kalapi-prototipi/`
  - `/izrabotka-na-maketi/`
  - `/interiorni-izdeliya/`
- The project tree was rebuilt cleanly. Duplicate JPEG slider files, prior-version directories, previews, and unused assets are not included.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

The website is also directly viewable through any static HTTP server:

```bash
python3 -m http.server 8080
```

## Production build

```bash
npm run build
npm run preview
```

The Vite multi-page configuration includes the homepage and all six category pages.

## Project structure

```text
.
├── index.html
├── 3d-ruter-freza/index.html
├── vakuum-formovane/index.html
├── kompozitni-materiali/index.html
├── kalapi-prototipi/index.html
├── izrabotka-na-maketi/index.html
├── interiorni-izdeliya/index.html
├── assets/
│   ├── icons/
│   └── images/
├── css/styles.css
├── js/app.js
├── package.json
├── vite.config.js
├── site.webmanifest
├── robots.txt
└── sitemap.xml
```

## Notes

The contact form validates locally and opens the visitor's configured email client with a prepared message. Connect it to a server or hosted form endpoint for direct delivery.

The gallery pages contain every relevant local photograph available in the supplied remake project. The live reference website's original image archive was not part of the supplied source package; additional licensed originals can be added to the category galleries without changing the layout or JavaScript.
