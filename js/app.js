/*
 * App shell: global state (sruthi/mode/ragam), the on-screen keyboard
 * (build/render/trigger), the ragam-driven actions, and all DOM wiring.
 * Loads last, after every data/audio/parser/metronome/shruti-box module.
 */

// ─── STATE ──────────────────────────────────────────────────────────
let sruthiIdx = 0;
let mode = 0; // 0 = SWARA, 1 = RAGAM
let ragamIdx = 0;

// ─── BUILD KEY ELEMENTS ─────────────────────────────────────────────
const keysEl = document.getElementById("keys");
const keyEls = [];
let prevGroup = null;
for (let i = 0; i < NUM_KEYS; i++) {
    const [semitone] = NOTE_RANGE[i];
    const group = SWARA_GROUP[semitone];

    const div = document.createElement("div");
    div.className = "key";
    if (prevGroup !== null && group !== prevGroup) div.classList.add("group-gap");
    prevGroup = group;

    const kc = document.createElement("div");
    kc.className = "kc";
    kc.textContent = KEY_CHARS[i].toUpperCase();

    const lab = document.createElement("div");
    lab.className = "lab";
    lab.textContent = swaraLabelForNote(i);

    const full = document.createElement("div");
    full.className = "full";
    full.textContent = SWARA_FULL[semitone];

    div.appendChild(kc);
    div.appendChild(lab);
    div.appendChild(full);
    keysEl.appendChild(div);
    keyEls.push(div);

    div.addEventListener("mousedown", () => triggerNote(i));
    div.addEventListener("touchstart", (e) => { e.preventDefault(); triggerNote(i); }, {passive: false});
}

function triggerNote(idx) {
    const [semitone, octave] = NOTE_RANGE[idx];
    const freq = getFreq(semitone, sruthiIdx, octave);
    playNote(semitone, octave, 550);
    flashKey(idx);

    const label = swaraLabelForNote(idx);
    let inRagam = "";
    if (mode === 1) {
        const active = ragamActiveSet(RAGAMS[ragamIdx]);
        inRagam = active.has(semitone) ? "  [in ragam]" : "  [outside ragam]";
    }
    console.log(`${label}  ${SWARA_FULL[semitone]}  ${freq.toFixed(2)} Hz${inRagam}`);
}

let flashTimer = null;
function flashKey(idx) {
    keyEls.forEach(el => el.classList.remove("pressed"));
    keyEls[idx].classList.add("pressed");
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => keyEls[idx].classList.remove("pressed"), 250);
}

// ─── RENDER (mode/sruthi/ragam dependent styling) ───────────────────
function render() {
    document.getElementById("modeLabel").textContent = mode === 0 ? "SWARA MODE" : "RAGAM MODE";
    document.getElementById("modeBtn").className = mode === 0 ? "mode-swara" : "mode-ragam";
    document.getElementById("sruthiLabel").textContent = SRUTHI_NAMES[sruthiIdx];

    const ragamControls = document.getElementById("ragamControls");
    const ragamPanel = document.getElementById("ragamPanel");
    ragamControls.style.display = mode === 1 ? "inline" : "none";
    ragamPanel.style.display = mode === 1 ? "block" : "none";

    let ragamActive = null;
    if (mode === 1) {
        const ragam = RAGAMS[ragamIdx];
        ragamActive = ragamActiveSet(ragam);
        document.getElementById("ragamLabel").textContent = ragam.name;
        document.getElementById("ragamMelakarta").textContent =
            ragam.melakarta > 0 ? `Melakarta #${ragam.melakarta}` : "Janya ragam";
        document.getElementById("ragamAro").textContent =
            ragam.arohanam.map(s => s === 12 ? "S'" : SWARA_SHORT[s]).join(" ");
        document.getElementById("ragamAva").textContent =
            ragam.avarohanam.map(s => s === 12 ? "S'" : SWARA_SHORT[s]).join(" ");
    }

    for (let i = 0; i < NUM_KEYS; i++) {
        const [semitone] = NOTE_RANGE[i];
        const el = keyEls[i];
        const isActive = mode === 1 && ragamActive.has(semitone);
        el.classList.toggle("active", isActive);

        const kc = el.querySelector(".kc");
        const lab = el.querySelector(".lab");
        const full = el.querySelector(".full");
        let color;
        if (isActive) color = "var(--green)";
        else if (mode === 1) color = "var(--dim)";
        else color = GROUP_COLORS[SWARA_GROUP[semitone]] || "var(--text)";
        kc.style.color = color;
        lab.style.color = color;
        full.style.color = color;
    }
}

// ─── ACTIONS ─────────────────────────────────────────────────────────
function changeSruthi(delta) {
    sruthiIdx = (sruthiIdx + delta + 12) % 12;
    playNote(0, 0, 300);
    updateShrutiBoxPitch();
    render();
}

function toggleMode() {
    mode = 1 - mode;
    render();
}

function changeRagam(delta) {
    ragamIdx = (ragamIdx + delta + RAGAMS.length) % RAGAMS.length;
    render();
}

// Arohanam/avarohanam play in tempo with the metronome's BPM (see js/metronome.js),
// so practice stays in one consistent pulse.
function playSequence(semitones) {
    const interval = noteIntervalMs();
    const noteDur = Math.min(400, interval * 0.85);
    let t = 0;
    for (const s of semitones) {
        const octShift = s === 12 ? 1 : 0;
        const realS = s === 12 ? 0 : s;
        setTimeout(() => {
            playNote(realS, octShift, noteDur);
        }, t);
        t += interval;
    }
}

function playArohanam() { playSequence(RAGAMS[ragamIdx].arohanam); }
function playAvarohanam() { playSequence(RAGAMS[ragamIdx].avarohanam); }

// ─── INSTRUMENT SELECT UI ─────────────────────────────────────────────
const instrumentSelect = document.getElementById("instrumentSelect");
for (const inst of INSTRUMENTS) {
    const opt = document.createElement("option");
    opt.value = inst.id;
    opt.textContent = inst.label;
    instrumentSelect.appendChild(opt);
}
instrumentSelect.value = INSTRUMENTS[0].id;
instrumentSelect.addEventListener("change", () => {
    loadInstrument(instrumentSelect.value);
});

// ─── VOLUME SLIDER ─────────────────────────────────────────────────────
const volumeSlider = document.getElementById("volumeSlider");
volumeSlider.value = Math.round(masterVolume * 100);
volumeSlider.addEventListener("input", () => {
    masterVolume = volumeSlider.value / 100;
    updateDroneVolume();
});

// ─── METRONOME UI ──────────────────────────────────────────────────────
const metronomeBtn = document.getElementById("metronomeBtn");
const bpmInput = document.getElementById("bpmInput");
metronomeBtn.addEventListener("click", () => {
    audioCtx.resume();
    metronomeOn = !metronomeOn;
    metronomeBtn.textContent = `Metronome: ${metronomeOn ? "ON" : "OFF"}`;
    metronomeBtn.classList.toggle("toggle-on", metronomeOn);
    if (metronomeOn) startMetronome(); else stopMetronome();
});
bpmInput.addEventListener("input", () => {
    bpm = Math.min(300, Math.max(20, parseInt(bpmInput.value, 10) || 80));
});

const notesPerBeatInput = document.getElementById("notesPerBeatInput");
notesPerBeatInput.addEventListener("input", () => {
    notesPerBeat = Math.min(8, Math.max(1, parseInt(notesPerBeatInput.value, 10) || 1));
});

const fastNotesCheckbox = document.getElementById("fastNotesCheckbox");
fastNotesCheckbox.addEventListener("change", () => {
    fastNotesEnabled = fastNotesCheckbox.checked;
});

// ─── SHRUTI BOX UI ─────────────────────────────────────────────────────
const shrutiBoxBtn = document.getElementById("shrutiBoxBtn");
const droneSelect = document.getElementById("droneSelect");
shrutiBoxBtn.addEventListener("click", () => {
    audioCtx.resume();
    shrutiBoxOn = !shrutiBoxOn;
    shrutiBoxBtn.textContent = `Shruti Box: ${shrutiBoxOn ? "ON" : "OFF"}`;
    shrutiBoxBtn.classList.toggle("toggle-on", shrutiBoxOn);
    if (shrutiBoxOn) startShrutiBox(); else stopShrutiBox();
});
droneSelect.addEventListener("change", () => {
    if (shrutiBoxOn) { stopShrutiBox(); startShrutiBox(); }
});

// ─── WIRE UP BUTTONS ──────────────────────────────────────────────────
document.getElementById("modeBtn").addEventListener("click", toggleMode);
document.getElementById("sruthiUp").addEventListener("click", () => changeSruthi(1));
document.getElementById("sruthiDown").addEventListener("click", () => changeSruthi(-1));
document.getElementById("ragamNext").addEventListener("click", () => changeRagam(1));
document.getElementById("ragamPrev").addEventListener("click", () => changeRagam(-1));
document.getElementById("playAro").addEventListener("click", playArohanam);
document.getElementById("playAva").addEventListener("click", playAvarohanam);

const swaraInput = document.getElementById("swaraInput");
document.getElementById("playSwarasBtn").addEventListener("click", playSwaraInput);
swaraInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); playSwaraInput(); }
});

// ─── NOTATION FILE PLAYER UI ─────────────────────────────────────────
const notationTextArea = document.getElementById("notationTextArea");
const notationFileInput = document.getElementById("notationFileInput");
document.getElementById("loadNotationFileBtn").addEventListener("click", () => notationFileInput.click());
notationFileInput.addEventListener("change", () => {
    const file = notationFileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { notationTextArea.value = reader.result; };
    reader.readAsText(file);
});
document.getElementById("playNotationBtn").addEventListener("click", playNotationText);
document.getElementById("stopNotationBtn").addEventListener("click", stopNotationPlayback);

// ─── KEYBOARD LISTENER ─────────────────────────────────────────────────
window.addEventListener("keydown", (e) => {
    // Don't hijack typing/native controls (text input, volume slider, instrument select)
    if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
    if (e.repeat) return;
    const key = e.key;

    if (key === "ArrowUp") { e.preventDefault(); changeSruthi(1); return; }
    if (key === "ArrowDown") { e.preventDefault(); changeSruthi(-1); return; }
    if (key === "Tab") { e.preventDefault(); toggleMode(); return; }
    if (key === "PageUp" && mode === 1) { e.preventDefault(); changeRagam(1); return; }
    if (key === "PageDown" && mode === 1) { e.preventDefault(); changeRagam(-1); return; }
    if (key === "Enter" && mode === 1) { e.preventDefault(); playArohanam(); return; }
    if (key === "Backspace" && mode === 1) { e.preventDefault(); playAvarohanam(); return; }

    const ci = KEY_CHARS.indexOf(key.toLowerCase());
    if (ci !== -1) {
        e.preventDefault();
        triggerNote(ci);
    }
});

// ─── AUDIO UNLOCK OVERLAY (browsers block audio before user gesture) ──
const overlay = document.getElementById("startOverlay");
overlay.addEventListener("click", () => {
    audioCtx.resume().then(() => {
        overlay.style.display = "none";
        loadInstrument(instrumentSelect.value);
    });
});

render();
