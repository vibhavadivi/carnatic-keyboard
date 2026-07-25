# Carnatic Swara Keyboard

A browser-based Carnatic swara/ragam keyboard. Open `index.html` directly, or host it as a static site — no build step, no server required.

## Run locally

Double-click `index.html`, or `start index.html` from this folder.

## Host it for free

Any static host works since it's a single `index.html`. Pick one:

**GitHub Pages**
1. Push this folder to a GitHub repo.
2. Repo Settings → Pages → set source to the `main` branch (root).
3. Your site is live at `https://<username>.github.io/<repo>/`.

**Netlify (drag and drop)**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag this folder in. It deploys instantly with a public URL.

**Vercel**
1. `npx vercel` from this folder (or import the repo at vercel.com).
2. Accept the defaults — it's a static site, no build command needed.

## Notes

- Instrument sounds (sitar, violin, flute, shehnai) load from a CDN (`unpkg.com`) at runtime, so the hosted site needs outbound internet access to that domain — no bundling required.
- Browsers block audio until a user gesture, hence the "click to enable audio" overlay on load.
