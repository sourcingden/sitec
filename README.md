# Denys Dinkevych — sourcing by day, DJ by night

Live: **https://sourcingden.github.io/sitec/** (GitHub Pages, static, no build step, no trackers, no third-party requests on load).

## Pages
| Path | What |
|---|---|
| `/` | Home with two sides. `?side=day` (Sourcing) and `?side=night` (DJ) — link LinkedIn to the first, SoundCloud to the second. |
| `/tools/` | Free sourcing tools, all running in the browser: Boolean & X-ray builder, email pattern generator, outreach message checker. |
| `/cases/` | Case studies with interactive demo dashboards (invented numbers). |
| `/press/` | DJ press kit: bio, quotes, mixes, press photos, downloadable `.zip`. |
| `/404.html` | "Not found" page with dots. |

## Editing
- **Career text, numbers, jobs:** `index.html` (side-specific parts carry `data-only="day"` / `data-only="night"`).
- **DJ facts:** `press.json` — used by the night side and `/press/`. Empty values hide their block, so to show gigs, a rider, genres, BPM or a YouTube link, just fill them in:
  ```json
  "gigs": [{ "date": "2026-10-12", "venue": "Closer", "city": "Kyiv" }],
  "rider": ["2 × CDJ-3000", "DJM-V10 or A&H Xone:96", "Booth monitors"],
  "genres": ["House", "Tech house"],
  "links": { "youtube": "https://youtube.com/@..." }
  ```
  After editing the bio, rebuild the zip so it matches (see `assets/press/`).
- **Hero dots:** `engraving.js` dithers `assets/portrait.webp` (day) and `assets/flammarion.webp` (night); tune `mid`/`spread` in the canvas `data-images` attribute.

## Code
- `site.js` — shared: clock, copy buttons (`data-copy="<id>"`).
- `main.js` — side switching, stars, SoundCloud player (loads only on click).
- `boolean.js`, `tools/email-patterns/email.js`, `tools/outreach-check/outreach.js` — pure functions, testable in Node (`require()` them).
- `cases/cases.js` — demo dashboards. `press.js` — renders `press.json`.
- Fonts are self-hosted in `assets/fonts/` (SIL Open Font License).
