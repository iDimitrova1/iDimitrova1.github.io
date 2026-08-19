# Ganz Model Design — original-style responsive remake

A close visual reconstruction of the public `ganz-md.com` website, rebuilt with semantic HTML5, modern CSS, dependency-free JavaScript, and Vite 8 for local development and production builds.

The interface intentionally preserves the character of the original GK inStyle-era site: the narrow black utility bar, centered Ganz masthead, hairline navigation, large numbered slideshow, six image-based service links, A+/A/A− article controls, restrained editorial typography, grouped footer links, and the Color I–IX selector.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local address printed by Vite.

The source is also a conventional static website. It can be previewed with any local HTTP server, for example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Production build

```bash
npm run build
npm run preview
```

Vite writes the deployable build to `dist/`.

## Project structure

```text
.
├── index.html
├── css/styles.css
├── js/app.js
├── assets/
│   ├── icons/
│   └── images/
├── package.json
├── site.webmanifest
├── robots.txt
└── sitemap.xml
```

## Included behavior

- Responsive desktop, tablet, and mobile layouts
- Four-item original-style navigation and compact mobile selector
- Ten-image carousel with 0–9 controls, previous/next controls, autoplay, pause, keyboard navigation, swipe gestures, and reduced-motion support
- Six original-style service image modules
- A+/A/A− readable-text controls with saved preference
- Color I–IX accent schemes with saved preference
- Project gallery with a native `<dialog>` lightbox
- Contact form validation that prepares a populated `mailto:` message
- Local WebP/JPEG assets, Open Graph metadata, web manifest, sitemap, and LocalBusiness structured data

## Contact form

The form has no server dependency. After validation, it opens the visitor's configured email client with the recipient, subject, sender details, and message populated. Replace the handler in `js/app.js` with a backend or hosted form endpoint when direct delivery is required.

## Deployment notes

- Keep the canonical URL, sitemap, contact details, and social profiles synchronized with the live domain.
- Serve the site over HTTPS.
- Retain both WebP and JPEG slideshow files when support for older browsers is required.
