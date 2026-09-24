# sourcingdenis / diskevich

Personal hub: sourcing by day, DJ by night.

- **Dithered engraving hero** (`engraving.js`): the Flammarion engraving (1888, public domain) broken into ~28k dots with Atkinson dithering. Dots run from the cursor or finger, a tap scatters them and they rebuild; in dark mode they pulse at 124 bpm. The image is `assets/flammarion.webp`.
- **Sections**: Sourcing playbooks, Dashboards & AI in hiring, DJ mixes. Entries expand in place.
- **SoundCloud player** loads only when a visitor clicks "Load player", so no third-party content loads until then.
- Light/dark theme follows the system and can be switched with the corner toggle. Dark mode has parallax stars.

Static site, no build: `index.html`, `styles.css`, `main.js`, `engraving.js`, `assets/`, `og.png`.

To swap the picture, replace `assets/flammarion.webp` (keep it high-contrast; update the `aspect-ratio` in `styles.css` and the `width`/`height` on the fallback `<img>` if the proportions change).

Live at **https://sourcingden.github.io/sitec/**, served by GitHub Pages.

To add an entry, copy an existing `<p class="entry">…</p>` (plus its `<div class="fold">` if it expands) in `index.html`.
