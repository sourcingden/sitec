# Denys Dinkevych — sourcing by day, DJ by night

Personal site with two sides that share one template:

- **Sourcing** (`?side=day`, light): headline, proof numbers, a working **Boolean builder** (LinkedIn + Google X-ray strings, runs in the browser), methods, track record, writing.
- **DJ** (`?side=night`, dark): diskevich mix credits, the *mixes spotlight* SoundCloud playlist (loads only on click), booking.

Link LinkedIn to `https://sourcingden.github.io/sitec/?side=day` and SoundCloud to `https://sourcingden.github.io/sitec/?side=night`. Without the parameter the site opens the visitor's last side, or day.

The hero art (`engraving.js`) is ~30k dots dithered from two images: the portrait by day and the Flammarion engraving (1888, public domain) by night. Switching sides flies the dots from one picture into the other; they also run from the cursor, scatter on tap, and pulse at 124 bpm at night.

## Files
- `index.html`: content. Side-specific parts carry `data-only="day"` or `data-only="night"`.
- `styles.css`, `main.js` (side switching, clock, player), `boolean.js` (builder; pure functions testable in Node), `engraving.js` (dots).
- `assets/portrait.webp`, `assets/flammarion.webp` (dot sources), `assets/avatar.webp`, `og.png`.

## Editing
- Numbers, jobs and text: edit `index.html`.
- New dot picture: replace the file in `assets/` (700×564, high contrast) and tune `mid`/`spread` in the canvas `data-images` attribute (lower `spread` = harsher contrast).
