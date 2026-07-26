/*
 * Turns typed swara text and pasted/loaded notation text into note sequences,
 * and plays them back. Two independent formats:
 *
 *   parseSwaraString()   — the manual swara text box. Comma-separated; an
 *                          empty slot between commas repeats the previous note.
 *   parseNotationDocument() — printed notation (e.g. from a composition
 *                          sheet). Letters run together play consecutively;
 *                          a comma repeats the previous note.
 *
 * Both resolve ambiguous letters (r/g/d/n) via resolveSemitone(), using the
 * current ragam in RAGAM mode or DEFAULT_RAGAM_IDX in SWARA mode.
 */

function resolveSemitone(letter, digit, activeSet) {
    const candidates = SWARA_LETTER_MAP[letter];
    if (digit) {
        const i = parseInt(digit, 10) - 1;
        return (i >= 0 && i < candidates.length) ? candidates[i] : null;
    }
    if (candidates.length === 1) return candidates[0];
    const match = candidates.find(s => activeSet.has(s));
    return match !== undefined ? match : SWARA_DEFAULT_VARIANT[letter];
}

function currentResolutionRagam() {
    return mode === 1 ? RAGAMS[ragamIdx] : RAGAMS[DEFAULT_RAGAM_IDX];
}

// ─── SWARA TEXT BOX ─────────────────────────────────────────────────
function parseSwaraToken(token, activeSet) {
    let t = token.trim().toLowerCase();
    if (!t) return null;
    let octaveShift = 0;
    if (t.endsWith("'")) { octaveShift = 1; t = t.slice(0, -1); }
    else if (t.endsWith(".")) { octaveShift = -1; t = t.slice(0, -1); }

    const m = /^([srgmpdn])([1-3]?)$/.exec(t);
    if (!m) return null;
    const semitone = resolveSemitone(m[1], m[2], activeSet);
    return semitone === null ? null : { semitone, octaveShift };
}

// Commas separate swaras; an empty slot between commas (e.g. "s,,r") repeats
// the previous swara, matching the notation convention of a held/repeated beat.
function parseSwaraString(input) {
    const activeSet = ragamActiveSet(currentResolutionRagam());

    const notes = [];
    let last = null;
    for (const rawSegment of input.split(",")) {
        const segment = rawSegment.trim();
        if (!segment) {
            if (last) notes.push({ ...last });
            continue;
        }
        for (const tok of segment.split(/\s+/).filter(Boolean)) {
            const parsed = parseSwaraToken(tok, activeSet);
            if (parsed) { notes.push(parsed); last = parsed; }
        }
    }
    return notes;
}

function flashKeyForNote(semitone, octaveShift) {
    const idx = NOTE_INDEX_LOOKUP.get(`${semitone}_${octaveShift}`);
    if (idx !== undefined) flashKey(idx);
}

function playSwaraInput() {
    const notes = parseSwaraString(swaraInput.value);
    const interval = noteIntervalMs();
    const noteDur = Math.min(400, interval * 0.85);
    let t = 0;
    for (const { semitone, octaveShift } of notes) {
        setTimeout(() => {
            playNote(semitone, octaveShift, noteDur);
            flashKeyForNote(semitone, octaveShift);
        }, t);
        t += interval;
    }
}

// ─── NOTATION FILE PLAYER ──────────────────────────────────────────
// Reads traditional printed swaram notation, e.g. from a composition sheet:
//   P , , , | P M G , G , , , || R , S , | , , , , Ḍ , Ṇ , ||
// Notes run together with no separator (letters only) play consecutively;
// a comma repeats the previous note (a held/continued beat, as in printed
// notation); '|' bars, spaces, and anything unrecognized are ignored. Lines
// starting with '#' are comments. This intentionally only understands the
// swaram line itself — lyrics, section headers, and avartanam numbers must
// be excluded (or put behind '#') by whoever pastes the text.
function parseNotationDocument(text) {
    const activeSet = ragamActiveSet(currentResolutionRagam());

    const notes = []; // {semitone, octaveShift, isUpper}
    let last = null;
    for (const line of text.split(/\r?\n/)) {
        if (line.trim().startsWith("#")) continue;
        let i = 0;
        while (i < line.length) {
            const ch = line[i];
            if (ch === ",") {
                if (last) notes.push({ ...last });
                i++;
                continue;
            }

            const unicodeInfo = NOTATION_UNICODE_MAP[ch];
            if (unicodeInfo) {
                i++;
                let digit = "";
                if (i < line.length && /[1-3]/.test(line[i])) { digit = line[i]; i++; }
                const semitone = resolveSemitone(unicodeInfo.letter, digit, activeSet);
                if (semitone !== null) {
                    const note = { semitone, octaveShift: unicodeInfo.octaveShift, isUpper: unicodeInfo.isUpper };
                    notes.push(note);
                    last = note;
                }
                continue;
            }

            const letter = ch.toLowerCase();
            if ("srgmpdn".includes(letter)) {
                const isUpper = ch !== letter;
                i++;
                let digit = "";
                if (i < line.length && /[1-3]/.test(line[i])) { digit = line[i]; i++; }
                let octaveShift = 0;
                if (i < line.length && (line[i] === "'" || line[i] === ".")) {
                    octaveShift = line[i] === "'" ? 1 : -1;
                    i++;
                }
                const semitone = resolveSemitone(letter, digit, activeSet);
                if (semitone !== null) {
                    const note = { semitone, octaveShift, isUpper };
                    notes.push(note);
                    last = note;
                }
                continue;
            }
            i++; // skip bars, spaces, digits without a preceding letter, etc.
        }
    }
    return notes;
}

let notationTimeouts = [];
let fastNotesEnabled = false;

function stopNotationPlayback() {
    notationTimeouts.forEach(id => clearTimeout(id));
    notationTimeouts = [];
}

function playNotationText() {
    stopNotationPlayback();
    const notes = parseNotationDocument(notationTextArea.value);
    const interval = noteIntervalMs();
    let t = 0;
    for (const { semitone, octaveShift, isUpper } of notes) {
        // With "fast notes" on, lowercase letters (as printed for quick/ornamental
        // runs, e.g. "dp" inside "P M-G M P dp M G") take half the normal slot.
        const slot = (fastNotesEnabled && !isUpper) ? interval / 2 : interval;
        const noteDur = Math.min(400, slot * 0.85);
        const id = setTimeout(() => {
            playNote(semitone, octaveShift, noteDur);
            flashKeyForNote(semitone, octaveShift);
        }, t);
        notationTimeouts.push(id);
        t += slot;
    }
}
