/*
 * Swara/sruthi/note tables shared by every module. Pure data plus a few
 * small pure helpers that operate directly on it — no DOM, no audio.
 */

// ─── SWARA DATA ───────────────────────────────────────────────────
const SWARA_SHORT = ["S", "R1", "R2/G1", "R3/G2", "G3",
               "M1", "M2", "P", "D1", "D2/N1", "D3/N2", "N3"];

const SWARA_FULL = [
    "Shadjam", "Shuddha Rishabham",
    "Chatusruti Ri / Shuddha Ga", "Shatsruti Ri / Sadharana Ga",
    "Antara Gandharam", "Shuddha Madhyamam", "Prathi Madhyamam",
    "Panchamam", "Shuddha Dhaivatam",
    "Chatusruti Dha / Shuddha Ni", "Shatsruti Dha / Kaisiki Ni",
    "Kakali Nishadam"
];

const SWARA_GROUP = ["S", "R", "R", "R", "G", "M", "M", "P", "D", "D", "D", "N"];

const GROUP_COLORS = {
    S: "#ffd278", R: "#8cbeff", G: "#96dcbe",
    M: "#ff9696", P: "#ffd278", D: "#c8a0ff", N: "#ffb4dc",
};

const SRUTHI_NAMES = ["C  (1 kattai)", "C# (1.5 kattai)", "D  (2 kattai)",
                "D# (2.5 kattai)", "E  (3 kattai)", "F  (3.5 kattai)",
                "F# (4 kattai)", "G  (4.5 kattai)", "G# (5 kattai)",
                "A  (5.5 kattai)", "A# (6 kattai)", "B  (6.5 kattai)"];

const SRUTHI_BASE = [130.81, 138.59, 146.83, 155.56, 164.81, 174.61,
               185.00, 196.00, 207.65, 220.00, 233.08, 246.94];

function getFreq(semitone, sruthiIdx, octave = 0) {
    return SRUTHI_BASE[sruthiIdx] * Math.pow(2, semitone / 12 + octave);
}

// ─── NOTE RANGE: lower Pa to upper Pa ─────────────────────────────
const NOTE_RANGE = [];
for (const s of [7, 8, 9, 10, 11]) NOTE_RANGE.push([s, -1]);
for (let s = 0; s < 12; s++) NOTE_RANGE.push([s, 0]);
for (const s of [0, 1, 2, 3, 4, 5, 6, 7]) NOTE_RANGE.push([s, 1]);

const NUM_KEYS = NOTE_RANGE.length; // 25

const NOTE_INDEX_LOOKUP = new Map();
NOTE_RANGE.forEach(([semitone, octave], i) => NOTE_INDEX_LOOKUP.set(`${semitone}_${octave}`, i));

function swaraLabelForNote(idx) {
    const [semitone, octave] = NOTE_RANGE[idx];
    let short = SWARA_SHORT[semitone];
    if (octave < 0) short += ".";
    else if (octave > 0) short += "'";
    return short;
}

// ─── COMPUTER KEY MAPPING ──────────────────────────────────────────
const KEY_CHARS = "1234567890qwertyuiopasdfg".split("");

// ─── SWARA TEXT / NOTATION PARSING TABLES ─────────────────────────
// Each letter's candidate semitones, in variant order (1st, 2nd, 3rd).
const SWARA_LETTER_MAP = {
    s: [0], r: [1, 2, 3], g: [2, 3, 4], m: [5, 6],
    p: [7], d: [8, 9, 10], n: [9, 10, 11],
};
// Fallback variant per letter when the resolution ragam doesn't contain any
// candidate for that letter — matches Shankarabharanam (R2 G3 M1 P D2 N3).
const SWARA_DEFAULT_VARIANT = { s: 0, r: 2, g: 4, m: 5, p: 7, d: 9, n: 11 };

// Precomposed dot-above/dot-below letters as printed in notation sheets:
// Ḍ/Ṇ = D/N in the lower octave, Ṡ/Ṙ/Ġ/Ṁ = S/R/G/M in the upper octave.
const NOTATION_UNICODE_MAP = {
    "Ḍ": { letter: "d", octaveShift: -1, isUpper: true }, "ḍ": { letter: "d", octaveShift: -1, isUpper: false },
    "Ṇ": { letter: "n", octaveShift: -1, isUpper: true }, "ṇ": { letter: "n", octaveShift: -1, isUpper: false },
    "Ṡ": { letter: "s", octaveShift: 1, isUpper: true },  "ṡ": { letter: "s", octaveShift: 1, isUpper: false },
    "Ṙ": { letter: "r", octaveShift: 1, isUpper: true },  "ṙ": { letter: "r", octaveShift: 1, isUpper: false },
    "Ġ": { letter: "g", octaveShift: 1, isUpper: true },  "ġ": { letter: "g", octaveShift: 1, isUpper: false },
    "Ṁ": { letter: "m", octaveShift: 1, isUpper: true },  "ṁ": { letter: "m", octaveShift: 1, isUpper: false },
};
