/*
 * Audio engine: the Web Audio context, the sine-wave fallback synth, the
 * Karplus-Strong plucked-string synth (veena/tanpura), soundfont instrument
 * loading/caching, and playNote() — the single entry point every other
 * module calls to actually make sound.
 */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playFreqSynth(freq, durationMs = 550, volume = 0.5) {
    if (!freq || freq <= 0) return;
    const t0 = audioCtx.currentTime;
    const dur = durationMs / 1000;
    const fade = 0.02;

    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + fade);
    gain.gain.setValueAtTime(volume, t0 + Math.max(dur - fade, fade));
    gain.gain.linearRampToValueAtTime(0, t0 + dur);

    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
}

// ─── INSTRUMENT LOADING (soundfont samples, cached by name) ────────
const instrumentCache = new Map();       // soundfont name -> loaded instrument
let currentInstrumentConfig = INSTRUMENTS[0];
let currentInstrument = null;            // loaded soundfont object (type === "soundfont" only)

function setInstrumentStatus(text, isLoading) {
    const el = document.getElementById("instrumentStatus");
    el.textContent = text;
    el.classList.toggle("loading", !!isLoading);
}

function loadInstrument(id) {
    const config = INSTRUMENTS.find(i => i.id === id) || INSTRUMENTS[0];
    currentInstrumentConfig = config;
    currentInstrument = null;

    if (config.type !== "soundfont") {
        setInstrumentStatus("");
        return;
    }
    if (instrumentCache.has(config.name)) {
        currentInstrument = instrumentCache.get(config.name);
        setInstrumentStatus("");
        return;
    }
    setInstrumentStatus("loading…", true);
    Soundfont.instrument(audioCtx, config.name).then((inst) => {
        instrumentCache.set(config.name, inst);
        if (currentInstrumentConfig === config) {
            currentInstrument = inst;
            setInstrumentStatus("");
        }
    }).catch(() => {
        setInstrumentStatus("failed to load — using synth", false);
    });
}

// Karplus-Strong plucked string: a noise burst decaying through a short
// feedback delay line. Approximates a plucked-string timbre for veena/tanpura
// since no free sample library exists for either instrument.
function pluckedStringBuffer(freq, durationSec, decay) {
    const sr = audioCtx.sampleRate;
    const totalSamples = Math.max(1, Math.floor(sr * durationSec));
    const N = Math.max(2, Math.round(sr / freq));
    const buffer = audioCtx.createBuffer(1, totalSamples, sr);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < N; i++) data[i] = Math.random() * 2 - 1;
    for (let i = N; i < totalSamples; i++) {
        data[i] = decay * 0.5 * (data[i - N] + data[i - N + 1]);
    }
    return buffer;
}

function playPluckedNote(freq, durationMs, volume, preset) {
    const t0 = audioCtx.currentTime;
    const holdSec = durationMs / 1000;
    const tailSec = holdSec + 1.2; // let the pluck ring out past the nominal duration

    let buffer;
    if (preset === "tanpura") {
        // Two slightly detuned strings summed for tanpura's characteristic "jwari" shimmer.
        const a = pluckedStringBuffer(freq, tailSec, 0.9985);
        const b = pluckedStringBuffer(freq * 1.004, tailSec, 0.9985);
        buffer = audioCtx.createBuffer(1, a.length, audioCtx.sampleRate);
        const out = buffer.getChannelData(0), da = a.getChannelData(0), db = b.getChannelData(0);
        for (let i = 0; i < out.length; i++) out[i] = (da[i] + db[i]) * 0.5;
    } else {
        buffer = pluckedStringBuffer(freq, tailSec, 0.9955);
    }

    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.setValueAtTime(volume, t0 + holdSec);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + tailSec);
    src.connect(gain).connect(audioCtx.destination);
    src.start(t0);
    src.stop(t0 + tailSec);
}

// Note names line up exactly: SRUTHI_BASE is standard 12-TET starting at C3,
// so sruthiIdx + semitone maps straight onto chromatic note names with no detuning.
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteName(semitone, octaveShift) {
    const chromatic = sruthiIdx + semitone;
    const octave = 3 + octaveShift + Math.floor(chromatic / 12);
    const pitchClass = ((chromatic % 12) + 12) % 12;
    return NOTE_NAMES[pitchClass] + octave;
}

let masterVolume = 0.7;

function playNote(semitone, octaveShift, durationMs = 550, volume = 1) {
    const vol = volume * masterVolume;
    const freq = getFreq(semitone, sruthiIdx, octaveShift);
    if (currentInstrumentConfig.type === "soundfont" && currentInstrument) {
        currentInstrument.play(noteName(semitone, octaveShift), audioCtx.currentTime, {
            duration: durationMs / 1000,
            gain: vol,
        });
    } else if (currentInstrumentConfig.type === "karplus") {
        playPluckedNote(freq, durationMs, vol, currentInstrumentConfig.preset);
    } else {
        playFreqSynth(freq, durationMs, vol);
    }
}
