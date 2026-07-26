/*
 * Shruti box: a continuous background drone (Sa, an optional second note,
 * and a low Sa for body) tuned to the current sruthi. Runs independently
 * of Swara/Ragam mode and keeps going across sruthi changes.
 */

const DRONE_SEMITONE = { pa: 7, ma1: 5, ma2: 6 };
let shrutiBoxOn = false;
let droneNodes = null;

function startShrutiBox() {
    const t0 = audioCtx.currentTime;

    function makeDroneOsc(freq, gainLevel) {
        const osc = audioCtx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(gainLevel, t0 + 0.6);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t0);
        return { osc, gain, level: gainLevel };
    }

    const sa = makeDroneOsc(getFreq(0, sruthiIdx, 0), masterVolume * 0.3);
    const saLow = makeDroneOsc(getFreq(0, sruthiIdx, -1), masterVolume * 0.18);

    const droneType = document.getElementById("droneSelect").value;
    let second = null;
    if (droneType !== "sa") {
        second = makeDroneOsc(getFreq(DRONE_SEMITONE[droneType], sruthiIdx, 0), masterVolume * 0.3);
    }

    droneNodes = { sa, saLow, second };
}

function stopShrutiBox() {
    if (!droneNodes) return;
    const t0 = audioCtx.currentTime;
    for (const node of [droneNodes.sa, droneNodes.saLow, droneNodes.second]) {
        if (!node) continue;
        node.gain.gain.cancelScheduledValues(t0);
        node.gain.gain.setValueAtTime(node.gain.gain.value, t0);
        node.gain.gain.linearRampToValueAtTime(0, t0 + 0.3);
        node.osc.stop(t0 + 0.32);
    }
    droneNodes = null;
}

function updateShrutiBoxPitch() {
    if (!droneNodes) return;
    const t0 = audioCtx.currentTime;
    droneNodes.sa.osc.frequency.linearRampToValueAtTime(getFreq(0, sruthiIdx, 0), t0 + 0.15);
    droneNodes.saLow.osc.frequency.linearRampToValueAtTime(getFreq(0, sruthiIdx, -1), t0 + 0.15);
    if (droneNodes.second) {
        const droneType = document.getElementById("droneSelect").value;
        droneNodes.second.osc.frequency.linearRampToValueAtTime(
            getFreq(DRONE_SEMITONE[droneType], sruthiIdx, 0), t0 + 0.15);
    }
}

function updateDroneVolume() {
    if (!droneNodes) return;
    const t0 = audioCtx.currentTime;
    droneNodes.sa.gain.gain.setValueAtTime(masterVolume * 0.3, t0);
    droneNodes.saLow.gain.gain.setValueAtTime(masterVolume * 0.18, t0);
    if (droneNodes.second) droneNodes.second.gain.gain.setValueAtTime(masterVolume * 0.3, t0);
}
