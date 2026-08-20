# Ganz Model Design — revised services and projects navigation

This package is a responsive static remake of the Ganz Model Design website using semantic HTML5, modern CSS, dependency-free JavaScript, native dialog galleries, and a Vite multi-page configuration.

## Latest requested changes

- The fixed **Меню** control is now a normal horizontal button on the upper-left edge. The icon and the word “Меню” share the same horizontal orientation.
- The side drawer is reorganized into two clear groups:
  - **Услуги:** 3Д рутер / фреза, Вакуум формоване, Композитни изделия, Скулптуриране.
  - **Проекти:** Калъпи и прототипи, Кино и реклама, Макети, Интериор, Конструктивни детайли, Орнаменти.
- The composite-material links include the requested subcategories: Стъклопласт, Карбон, and Отливки от полимери.
- The homepage now contains separate **Услуги** and **Проекти** category grids with the same organization as the side menu.
- Every top-level category opens a dedicated page with a local photo gallery.
- The former combined `izrabotka-na-maketi/` page was replaced by separate `kino-reklama/` and `maketi/` pages and removed from the package.

## Pages

### Услуги

- `/3d-ruter-freza/`
- `/vakuum-formovane/`
- `/kompozitni-materiali/`
- `/skulpturirane/`

### Проекти

- `/kalapi-prototipi/`
- `/kino-reklama/`
- `/maketi/`
- `/interiorni-izdeliya/`
- `/konstruktivni-detayli/`
- `/ornamenti/`

## Run locally

```bash
python3 -m http.server 8080
```

For Vite development and production builds, use Node.js 20.19+ or 22.12+:

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Project structure

```text
.
├── index.html
├── 3d-ruter-freza/index.html
├── vakuum-formovane/index.html
├── kompozitni-materiali/index.html
├── skulpturirane/index.html
├── kalapi-prototipi/index.html
├── kino-reklama/index.html
├── maketi/index.html
├── interiorni-izdeliya/index.html
├── konstruktivni-detayli/index.html
├── ornamenti/index.html
├── assets/
├── css/styles.css
├── js/app.js
├── package.json
├── vite.config.js
├── site.webmanifest
├── robots.txt
└── sitemap.xml
```
