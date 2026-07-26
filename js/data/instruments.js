/*
 * Instrument catalogue for the Instrument dropdown. To add a new one, add an
 * entry with a unique id and one of these types:
 *
 *   "soundfont" — a real sampled instrument, streamed on demand from the
 *                 soundfont-player CDN (see index.html). `name` must be a
 *                 valid General MIDI instrument name — see the full list at
 *                 https://unpkg.com/soundfont-player@0.12.0/instruments.json
 *   "karplus"   — a synthesized plucked string (Karplus-Strong), for
 *                 instruments with no free sample library (e.g. veena,
 *                 tanpura). `preset` selects the voicing in js/audio.js's
 *                 playPluckedNote() — currently "tanpura" (two detuned
 *                 strings for the buzzing "jwari" shimmer) or anything else
 *                 (a single plain plucked string, used for veena).
 *   "sine"      — the built-in sine-wave synth fallback, no extra fields.
 */
const INSTRUMENTS = [
    {id: "sitar",   label: "Sitar",   type: "soundfont", name: "sitar"},
    {id: "violin",  label: "Violin",  type: "soundfont", name: "violin"},
    {id: "flute",   label: "Flute",   type: "soundfont", name: "flute"},
    {id: "shanai",  label: "Shehnai", type: "soundfont", name: "shanai"},
    {id: "veena",   label: "Veena (synthesized)",   type: "karplus", preset: "veena"},
    {id: "tanpura", label: "Tanpura (synthesized)", type: "karplus", preset: "tanpura"},
    {id: "sine",    label: "Synth (sine)", type: "sine"},

    // ── Add more instruments here — same pattern ──
];
