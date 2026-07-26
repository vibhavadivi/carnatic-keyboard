# Carnatic Swara Keyboard

A browser-based Carnatic swara/ragam keyboard: on-screen + computer-keyboard play, ragam-aware swara text input, a printed-notation player, metronome, and a shruti box. Open `index.html` directly, or host it as a static site — no build step, no server required.

## Project structure

```
index.html          markup shell only
css/style.css        all styles
js/data/
  swara-data.js       swara/sruthi/note tables + pure helpers
  ragams.js           ragam catalogue — see "Adding a ragam" below
  instruments.js      instrument catalogue — see "Adding an instrument" below
js/audio.js           Web Audio engine: synth, Karplus-Strong strings, soundfont loading, playNote()
js/parser.js          swara text box + notation file parsing/playback
js/metronome.js       BPM/notes-per-beat state and the click scheduler
js/shruti-box.js      continuous drone
js/app.js             global state, on-screen keyboard, ragam actions, all DOM wiring (loads last)
```

Everything is plain `<script src>` tags sharing one global scope (no bundler, no ES modules) — this keeps `index.html` double-clickable from disk (`file://`) as well as deployable as-is. `js/app.js` must load last since it wires up the DOM using functions/data defined in every other file.

### Adding a ragam

Add an entry to `js/data/ragams.js`. Each ragam is just `name`, `melakarta` (0 for janya), `arohanam`, and `avarohanam` as semitone indices (0 = Sa … 11 = Ni3, 12 = upper Sa) — the file's header comment has the full cheat sheet. Nothing else needs to change; ragam-note highlighting, the arohanam/avarohanam player, and swara-letter resolution all derive from these two arrays automatically.

### Adding an instrument

Add an entry to `js/data/instruments.js` with a unique `id` and a `type`:
- `"soundfont"` — a real sampled instrument streamed from the soundfont-player CDN; `name` must be a valid General MIDI instrument name (full list linked in the file).
- `"karplus"` — a synthesized plucked string; `preset` selects the voicing in `js/audio.js`'s `playPluckedNote()`.
- `"sine"` — the built-in synth fallback.

It'll appear in the Instrument dropdown automatically.

## Run locally

Double-click `index.html`, or `start index.html` from this folder.

## Host it for free

Still a fully static site (just more files) — deploys the same way. Pick one:

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

- Instrument sounds (sitar, violin, flute, shehnai) load from a CDN (`unpkg.com`) at runtime, so the hosted site needs outbound internet access to that domain — no bundling required. Veena and tanpura are synthesized locally (no sample library exists for them).
- Browsers block audio until a user gesture, hence the "click to enable audio" overlay on load.
