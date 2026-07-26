/*
 * Metronome: BPM state, tempo helpers used by every sequence player
 * (arohanam/avarohanam, swara text box, notation player), and the click
 * scheduler itself. Runs independently of Swara/Ragam mode.
 */

// notesPerBeat subdivides each beat (e.g. 4 for a fast piece with 4 notes
// per talam count) without changing the metronome's click rate.
let bpm = 80;
let notesPerBeat = 1;

function beatMs() { return 60000 / bpm; }
function noteIntervalMs() { return beatMs() / notesPerBeat; }

let metronomeOn = false;
let nextBeatTime = 0;
let metronomeTimerId = null;
let beatCount = 0;
const METRONOME_LOOKAHEAD_MS = 25;
const METRONOME_SCHEDULE_AHEAD_SEC = 0.1;

function scheduleMetronomeClick(time, accented) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = accented ? 1500 : 1000;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.5 * masterVolume + 0.0001, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(time);
    osc.stop(time + 0.06);

    const delayMs = Math.max(0, (time - audioCtx.currentTime) * 1000);
    setTimeout(() => {
        const dot = document.getElementById("beatDot");
        dot.classList.add("pulse");
        setTimeout(() => dot.classList.remove("pulse"), 100);
    }, delayMs);
}

function metronomeSchedulerTick() {
    while (nextBeatTime < audioCtx.currentTime + METRONOME_SCHEDULE_AHEAD_SEC) {
        scheduleMetronomeClick(nextBeatTime, beatCount % 4 === 0);
        beatCount++;
        nextBeatTime += 60 / bpm;
    }
}

function startMetronome() {
    beatCount = 0;
    nextBeatTime = audioCtx.currentTime + 0.05;
    metronomeSchedulerTick();
    metronomeTimerId = setInterval(metronomeSchedulerTick, METRONOME_LOOKAHEAD_MS);
}

function stopMetronome() {
    clearInterval(metronomeTimerId);
    metronomeTimerId = null;
}
