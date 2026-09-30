# Denys Dinkevych — sourcing, and diskevich by night

Live: **https://sourcingden.github.io/sitec/** (GitHub Pages, static, no build step, no trackers, no third-party requests on load).

## Pages
| Path | What |
|---|---|
| `/` | Sourcing: hero, track record, a live Boolean builder, cases, method, experience, writing, contact. |
| `/tools/` | Free sourcing tools, all running in the browser: Boolean & X-ray builder (fields are kept in the URL, so a search can be shared), email pattern generator, outreach message checker. |
| `/cases/` | Case studies with interactive demo dashboards (invented numbers). |
| `/cv/` | One-page CV. The PDF in `assets/cv/` is printed from this page. |
| `/dj/` | diskevich: mixes, gigs (upcoming and past), quotes, press kit with bio, photos and the `.zip`. |
| `/press/`, `/?side=night` | Old links; they forward to `/dj/`. |
| `/404.html` | "Not found" page with dots. |

## Editing
- **Career text, numbers, jobs:** `index.html`, and the same facts in `cv/index.html`. After editing the CV, rebuild the PDF by printing `/cv/` to `assets/cv/denys-dinkevych-cv.pdf` (A4; the page has print styles).
- **DJ facts:** `press.json` — used by `/dj/`. Empty values hide their block, so to show gigs, a rider, genres, BPM or a YouTube link, just fill them in:
  ```json
  "gigs": [{ "date": "2026-10-12", "venue": "Closer", "city": "Kyiv" }],
  "rider": ["2 × CDJ-3000", "DJM-V10 or A&H Xone:96", "Booth monitors"],
  "genres": ["House", "Tech house"],
  "links": { "youtube": "https://youtube.com/@..." }
  ```
  After editing the bio, rebuild the zip so it matches (see `assets/press/`).
- **Gigs** come from Resident Advisor (https://ra.co/dj/diskevich). To refresh them, ask RA's public GraphQL API and copy up to five into `press.json` → `gigs` (any order: the page splits them into upcoming and past in the browser, by date):
  ```sh
  curl -s https://ra.co/graphql -H 'content-type: application/json' \
    --data '{"query":"{ artist(slug:\"diskevich\"){ upcoming: events(type: LATEST, limit: 5){ date title contentUrl venue{ name area{ name } } } past: events(type: PREVIOUS, limit: 5){ date title contentUrl venue{ name area{ name } } } } }"}'
  ```
- **Press photos** live in `assets/press/photos/` (full JPG + `-web.webp` preview) and are listed in `press.json` → `photos`.
- **Hero dots:** `engraving.js` dithers `assets/portrait-hero.webp` on `/` (a cropped, mirrored `portrait.webp`, so the face looks towards the text) and `assets/vinyl.webp` on `/dj/` (spins at 33⅓ rpm via `"spin": 200` degrees per second); tune `mid`/`spread` in the canvas `data-images` attribute.

## Code
- `styles.css` — one stylesheet: tokens (light for sourcing, dark for diskevich), then components, then breakpoints.
- `site.js` — shared: mobile menu, clock, copy buttons (`data-copy="<id>"`).
- `dj/dj.js` — YouTube and SoundCloud players on `/dj/` (both load only on click; the video shows a local thumbnail from `assets/video/` until then).
- `boolean.js`, `tools/email-patterns/email.js`, `tools/outreach-check/outreach.js` — pure functions, testable in Node (`require()` them).
- `cases/cases.js` — demo dashboards. `press.js` — renders `press.json`.
- Fonts are self-hosted in `assets/fonts/` (SIL Open Font License).
