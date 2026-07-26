/*
 * Ragam catalogue. To add a new ragam, copy an entry below and fill in:
 *
 *   name       — display name.
 *   melakarta  — melakarta number for a janaka (parent) ragam, or 0 for a
 *                janya (derived) ragam.
 *   arohanam   — ascending scale as semitone indices, 0 = Sa ... 11 = Ni3,
 *                12 = upper Sa. Repeat a semitone for vakra (zig-zag) phrases.
 *   avarohanam — descending scale, same indexing, typically arohanam reversed
 *                (but can differ — that's what makes many janya ragams janya).
 *
 * Semitone index cheat sheet (see js/data/swara-data.js SWARA_SHORT):
 *   0=S  1=R1  2=R2/G1  3=R3/G2  4=G3  5=M1  6=M2  7=P  8=D1  9=D2/N1  10=D3/N2  11=N3
 *
 * ragamActiveSet() below derives which semitones belong to a ragam directly
 * from arohanam+avarohanam — nothing else needs to be kept in sync.
 */
const RAGAMS = [
    {name: "Mayamalavagowla", melakarta: 15,
     arohanam: [0,1,4,5,7,8,11,12], avarohanam: [12,11,8,7,5,4,1,0]},
    {name: "Shankarabharanam", melakarta: 29,
     arohanam: [0,2,4,5,7,9,11,12], avarohanam: [12,11,9,7,5,4,2,0]},
    {name: "Kalyani", melakarta: 65,
     arohanam: [0,2,4,6,7,9,11,12], avarohanam: [12,11,9,7,6,4,2,0]},
    {name: "Mohana", melakarta: 0,
     arohanam: [0,2,4,7,9,12], avarohanam: [12,9,7,4,2,0]},
    {name: "Bhairavi", melakarta: 0,
     arohanam: [0,2,3,5,7,9,10,12], avarohanam: [12,10,9,7,5,3,2,0]},
    {name: "Malayamarutam", melakarta: 0,
     arohanam: [0,1,4,5,7,8,11,12], avarohanam: [12,11,8,7,5,1,0]},
    {name: "Hamsadhvani", melakarta: 0,
     arohanam: [0,2,4,7,11,12], avarohanam: [12,11,7,4,2,0]},
    {name: "Abhogi", melakarta: 0,
     arohanam: [0,2,3,5,9,12], avarohanam: [12,9,5,3,2,0]},
    {name: "Hindolam", melakarta: 0,
     arohanam: [0,3,5,8,10,12], avarohanam: [12,10,8,5,3,0]},
    {name: "Kambhoji", melakarta: 0,
     arohanam: [0,2,4,5,7,9,12], avarohanam: [12,11,9,7,5,4,2,0]},
    {name: "Todi", melakarta: 0,
     arohanam: [0,1,3,6,7,8,11,12], avarohanam: [12,11,8,7,6,3,1,0]},
    {name: "Bilahari", melakarta: 0,
     arohanam: [0,2,4,7,9,12], avarohanam: [12,11,9,7,4,2,0]},
    {name: "Saveri", melakarta: 0,
     arohanam: [0,1,5,7,8,12], avarohanam: [12,11,8,7,5,1,0]},
    {name: "Varali", melakarta: 0,
     arohanam: [0,1,3,6,7,8,11,12], avarohanam: [12,11,8,7,6,3,1,0]},
    {name: "Kharaharapriya", melakarta: 22,
     arohanam: [0,2,3,5,7,9,10,12], avarohanam: [12,10,9,7,5,3,2,0]},
    {name: "Natabhairavi", melakarta: 20,
     arohanam: [0,2,3,5,7,8,10,12], avarohanam: [12,10,8,7,5,3,2,0]},
    {name: "Harikambhoji", melakarta: 28,
     arohanam: [0,2,4,5,7,9,10,12], avarohanam: [12,10,9,7,5,4,2,0]},
    {name: "Hanumatodi", melakarta: 8,
     arohanam: [0,1,3,5,7,8,11,12], avarohanam: [12,11,8,7,5,3,1,0]},
    {name: "Shanmukhapriya", melakarta: 56,
     arohanam: [0,2,3,6,7,8,10,12], avarohanam: [12,10,8,7,6,3,2,0]},

    // ── Add more ragams here — same pattern ──
];

// Used to resolve bare letters (r, g, d, n) in SWARA mode, where there's no
// "current ragam" on screen — Shankarabharanam is the natural/major-scale ragam.
const DEFAULT_RAGAM_IDX = 1; // Shankarabharanam

function ragamActiveSet(ragam) {
    const active = new Set();
    for (const s of [...ragam.arohanam, ...ragam.avarohanam]) active.add(s % 12);
    return active;
}
