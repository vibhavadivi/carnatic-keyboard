"""
═══════════════════════════════════════════════════════════════════
  CARNATIC SWARA KEYBOARD  —  Python Edition
═══════════════════════════════════════════════════════════════════

Run with:  python carnatic_keyboard.py
Requires:  pip install pygame numpy

CONTROLS:
  Number/letter keys (shown on screen) → play that swara
  UP / DOWN arrows      → change sruthi (transpose all notes)
  TAB                   → toggle SWARA mode / RAGAM mode
  PAGE UP / PAGE DOWN    → next / previous ragam  (in RAGAM mode)
  ENTER                 → play arohanam            (in RAGAM mode)
  BACKSPACE             → play avarohanam          (in RAGAM mode)
  ESC                   → quit

In RAGAM mode, keys that belong to the current ragam are highlighted
green on screen. Keys outside the ragam still play (for vakra
phrases / visesha prayogams) but are shown dimmed.

TO ADD MORE RAGAMS: scroll to the RAGAMS list near the bottom of the
data section and copy the pattern. Comments explain the index system.
═══════════════════════════════════════════════════════════════════
"""

import pygame
import numpy as np
import sys

# ─── AUDIO SETUP ──────────────────────────────────────────────────
SAMPLE_RATE = 44100
pygame.mixer.pre_init(SAMPLE_RATE, -16, 1, 512)
pygame.init()
pygame.mixer.set_num_channels(8)  # allow a few overlapping notes

def make_tone(freq, duration_ms=550, volume=0.5):
    """Generate a sine wave tone with a short fade in/out envelope."""
    n = int(SAMPLE_RATE * duration_ms / 1000)
    t = np.linspace(0, duration_ms / 1000, n, False)
    wave = np.sin(freq * 2 * np.pi * t)

    fade_len = int(SAMPLE_RATE * 0.02)  # 20ms fade
    envelope = np.ones(n)
    envelope[:fade_len] = np.linspace(0, 1, fade_len)
    envelope[-fade_len:] = np.linspace(1, 0, fade_len)
    wave *= envelope

    audio = np.int16(wave * volume * 32767)

    # Match whatever channel count the mixer actually initialized with
    # (Windows often forces stereo even if mono was requested)
    _, _, mixer_channels = pygame.mixer.get_init()
    if mixer_channels == 2:
        audio = np.column_stack((audio, audio))

    return pygame.sndarray.make_sound(np.ascontiguousarray(audio))

def play_freq(freq, duration_ms=550):
    if freq <= 0:
        return
    sound = make_tone(freq, duration_ms)
    sound.play()

# ─── SWARA DATA ───────────────────────────────────────────────────
SWARA_SHORT = ["S", "R1", "R2/G1", "R3/G2", "G3",
               "M1", "M2", "P", "D1", "D2/N1", "D3/N2", "N3"]

SWARA_FULL = [
    "Shadjam", "Shuddha Rishabham",
    "Chatusruti Ri / Shuddha Ga", "Shatsruti Ri / Sadharana Ga",
    "Antara Gandharam", "Shuddha Madhyamam", "Prathi Madhyamam",
    "Panchamam", "Shuddha Dhaivatam",
    "Chatusruti Dha / Shuddha Ni", "Shatsruti Dha / Kaisiki Ni",
    "Kakali Nishadam"
]

# Group each semitone belongs to, for coloring
SWARA_GROUP = ["S", "R", "R", "R", "G", "M", "M", "P", "D", "D", "D", "N"]

SRUTHI_NAMES = ["C  (1 kattai)", "C# (1.5 kattai)", "D  (2 kattai)",
                "D# (2.5 kattai)", "E  (3 kattai)", "F  (3.5 kattai)",
                "F# (4 kattai)", "G  (4.5 kattai)", "G# (5 kattai)",
                "A  (5.5 kattai)", "A# (6 kattai)", "B  (6.5 kattai)"]

SRUTHI_BASE = [130.81, 138.59, 146.83, 155.56, 164.81, 174.61,
               185.00, 196.00, 207.65, 220.00, 233.08, 246.94]

def get_freq(semitone, sruthi_idx, octave=0):
    """semitone: 0-11 chromatic position. octave: shift relative to base."""
    return SRUTHI_BASE[sruthi_idx] * (2 ** (semitone / 12 + octave))

# ─── NOTE RANGE: lower Pa to upper Pa ─────────────────────────────
# Each entry: (semitone 0-11, octave shift relative to middle Sa)
NOTE_RANGE = []
# Lower octave: P D1 D2/N1 D3/N2 N3  (octave -1)
for s in [7, 8, 9, 10, 11]:
    NOTE_RANGE.append((s, -1))
# Middle octave: S through N3 (octave 0) — full 12
for s in range(12):
    NOTE_RANGE.append((s, 0))
# Upper octave: S through P (octave 1)
for s in [0, 1, 2, 3, 4, 5, 6, 7]:
    NOTE_RANGE.append((s, 1))

NUM_KEYS = len(NOTE_RANGE)  # 25 keys, lower Pa to upper Pa

# ─── COMPUTER KEY MAPPING ──────────────────────────────────────────
# 25 keys assigned low to high across number row + qwerty row + a few more
KEY_CHARS = list("1234567890qwertyuiopasdfg")
KEY_CODES = [getattr(pygame, f"K_{c}") for c in KEY_CHARS]

# ─── RAGAM DATA ────────────────────────────────────────────────────
# Semitone indices 0-11, 12 = upper Sa. -1 terminated (kept for clarity,
# not strictly needed in Python but mirrors the embedded C version).
RAGAMS = [
    {"name": "Mayamalavagowla", "melakarta": 15,
     "arohanam": [0,1,4,5,7,8,11,12], "avarohanam": [12,11,8,7,5,4,1,0]},
    {"name": "Shankarabharanam", "melakarta": 29,
     "arohanam": [0,2,4,5,7,9,11,12], "avarohanam": [12,11,9,7,5,4,2,0]},
    {"name": "Kalyani", "melakarta": 65,
     "arohanam": [0,2,4,6,7,9,11,12], "avarohanam": [12,11,9,7,6,4,2,0]},
    {"name": "Mohana", "melakarta": 0,
     "arohanam": [0,2,4,7,9,12], "avarohanam": [12,9,7,4,2,0]},
    {"name": "Bhairavi", "melakarta": 0,
     "arohanam": [0,2,3,5,7,9,10,12], "avarohanam": [12,10,9,7,5,3,2,0]},
    {"name": "Malayamarutam", "melakarta": 0,
     "arohanam": [0,1,4,5,7,8,11,12], "avarohanam": [12,11,8,7,5,1,0]},
    {"name": "Hamsadhvani", "melakarta": 0,
     "arohanam": [0,2,4,7,11,12], "avarohanam": [12,11,7,4,2,0]},
    {"name": "Abhogi", "melakarta": 0,
     "arohanam": [0,2,3,5,9,12], "avarohanam": [12,9,5,3,2,0]},
    {"name": "Hindolam", "melakarta": 0,
     "arohanam": [0,3,5,8,10,12], "avarohanam": [12,10,8,5,3,0]},
    {"name": "Kambhoji", "melakarta": 0,
     "arohanam": [0,2,4,5,7,9,12], "avarohanam": [12,11,9,7,5,4,2,0]},
    {"name": "Todi", "melakarta": 0,
     "arohanam": [0,1,3,6,7,8,11,12], "avarohanam": [12,11,8,7,6,3,1,0]},
    {"name": "Bilahari", "melakarta": 0,
     "arohanam": [0,2,4,7,9,12], "avarohanam": [12,11,9,7,4,2,0]},
    {"name": "Saveri", "melakarta": 0,
     "arohanam": [0,1,5,7,8,12], "avarohanam": [12,11,8,7,5,1,0]},
    {"name": "Varali", "melakarta": 0,
     "arohanam": [0,1,3,6,7,8,11,12], "avarohanam": [12,11,8,7,6,3,1,0]},
    {"name": "Kharaharapriya", "melakarta": 22,
     "arohanam": [0,2,3,5,7,9,10,12], "avarohanam": [12,10,9,7,5,3,2,0]},
    {"name": "Natabhairavi", "melakarta": 20,
     "arohanam": [0,2,3,5,7,8,10,12], "avarohanam": [12,10,8,7,5,3,2,0]},
    {"name": "Harikambhoji", "melakarta": 28,
     "arohanam": [0,2,4,5,7,9,10,12], "avarohanam": [12,10,9,7,5,4,2,0]},
    {"name": "Hanumatodi", "melakarta": 8,
     "arohanam": [0,1,3,5,7,8,11,12], "avarohanam": [12,11,8,7,5,3,1,0]},
    {"name": "Shanmukhapriya", "melakarta": 56,
     "arohanam": [0,2,3,6,7,8,10,12], "avarohanam": [12,10,8,7,6,3,2,0]},
    # ── Add more ragams here — same pattern ──
    # {"name": "YourRagam", "melakarta": 0,
    #  "arohanam": [...], "avarohanam": [...]},
]

def ragam_active_set(ragam):
    """Return set of semitone indices (0-11) active in this ragam."""
    active = set()
    for s in ragam["arohanam"] + ragam["avarohanam"]:
        active.add(s % 12)  # fold upper Sa (12) back to 0
    return active

# ─── PYGAME WINDOW ─────────────────────────────────────────────────
WIDTH, HEIGHT = 1400, 500
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Carnatic Swara Keyboard")
clock = pygame.time.Clock()

FONT_BIG   = pygame.font.SysFont("consolas", 28, bold=True)
FONT_MED   = pygame.font.SysFont("consolas", 18)
FONT_SMALL = pygame.font.SysFont("consolas", 14)
FONT_KEY   = pygame.font.SysFont("consolas", 22, bold=True)

COL_BG        = (12, 14, 20)
COL_PANEL     = (22, 26, 36)
COL_TEXT      = (230, 230, 235)
COL_DIM       = (90, 95, 110)
COL_GOLD      = (255, 200, 90)
COL_GREEN     = (90, 220, 130)
COL_GREEN_BG  = (20, 55, 35)
COL_ORANGE    = (255, 150, 60)
COL_KEY_BG    = (35, 40, 52)
COL_KEY_BORDER= (60, 66, 82)

GROUP_COLORS = {
    "S": (255, 210, 120),
    "R": (140, 190, 255),
    "G": (150, 220, 190),
    "M": (255, 150, 150),
    "P": (255, 210, 120),
    "D": (200, 160, 255),
    "N": (255, 180, 220),
}

# ─── STATE ──────────────────────────────────────────────────────────
sruthi_idx = 0
mode = 0          # 0 = SWARA, 1 = RAGAM
ragam_idx = 0
pressed_key = None
pressed_timer = 0

def swara_label_for_note(idx):
    semitone, octave = NOTE_RANGE[idx]
    short = SWARA_SHORT[semitone]
    if octave < 0:
        short += "."   # dot below convention = lower octave
    elif octave > 0:
        short += "'"   # apostrophe = upper octave
    return short

# ─── DRAW ────────────────────────────────────────────────────────────
def draw():
    screen.fill(COL_BG)

    # ── Header ──
    title = FONT_BIG.render("CARNATIC SWARA KEYBOARD", True, COL_GOLD)
    screen.blit(title, (20, 15))

    mode_text = "SWARA MODE" if mode == 0 else "RAGAM MODE"
    mode_col = COL_TEXT if mode == 0 else COL_GREEN
    mt = FONT_MED.render(f"[{mode_text}]  (TAB to toggle)", True, mode_col)
    screen.blit(mt, (20, 55))

    sruthi_text = FONT_MED.render(
        f"Sruthi: {SRUTHI_NAMES[sruthi_idx]}   (↑/↓ to change)",
        True, COL_TEXT)
    screen.blit(sruthi_text, (400, 55))

    if mode == 1:
        ragam = RAGAMS[ragam_idx]
        rtext = FONT_MED.render(
            f"Ragam: {ragam['name']}  (PgUp/PgDn to change, Enter=Aro, Backspace=Ava)",
            True, COL_GREEN)
        screen.blit(rtext, (800, 55))

    # ── Ragam info panel ──
    y_info = 85
    if mode == 1:
        ragam = RAGAMS[ragam_idx]
        aro = " ".join("S'" if s == 12 else SWARA_SHORT[s] for s in ragam["arohanam"])
        ava = " ".join("S'" if s == 12 else SWARA_SHORT[s] for s in ragam["avarohanam"])
        mk = f"Melakarta #{ragam['melakarta']}" if ragam['melakarta'] > 0 else "Janya ragam"

        pygame.draw.rect(screen, COL_PANEL, (20, y_info, WIDTH - 40, 70), border_radius=6)
        screen.blit(FONT_SMALL.render(mk, True, COL_DIM), (32, y_info + 8))
        screen.blit(FONT_MED.render(f"Arohanam:   {aro}", True, COL_TEXT), (32, y_info + 26))
        screen.blit(FONT_MED.render(f"Avarohanam: {ava}", True, COL_TEXT), (32, y_info + 46))
        keys_top = y_info + 90
    else:
        keys_top = y_info + 10

    # ── Keys ──
    ragam_active = ragam_active_set(RAGAMS[ragam_idx]) if mode == 1 else None

    key_w = (WIDTH - 40) / NUM_KEYS
    key_h = 260
    gap_after_group = 6  # extra gap when swara group changes

    x = 20
    prev_group = None
    for i in range(NUM_KEYS):
        semitone, octave = NOTE_RANGE[i]
        group = SWARA_GROUP[semitone]
        if prev_group is not None and group != prev_group:
            x += gap_after_group
        prev_group = group

        is_active = (mode == 1 and semitone in ragam_active)
        is_pressed = (pressed_key == i and pressed_timer > 0)

        if is_pressed:
            bg = COL_GOLD
            border = (255, 255, 255)
            txt_col = (20, 20, 20)
        elif is_active:
            bg = COL_GREEN_BG
            border = COL_GREEN
            txt_col = COL_GREEN
        else:
            bg = COL_KEY_BG
            border = COL_KEY_BORDER
            txt_col = GROUP_COLORS.get(group, COL_TEXT) if mode == 0 else COL_DIM

        rect = pygame.Rect(int(x), keys_top, int(key_w) - 3, key_h)
        pygame.draw.rect(screen, bg, rect, border_radius=6)
        pygame.draw.rect(screen, border, rect, width=2, border_radius=6)

        # Computer key label (top)
        kc = KEY_CHARS[i].upper()
        kc_surf = FONT_KEY.render(kc, True, txt_col)
        screen.blit(kc_surf, (rect.centerx - kc_surf.get_width() // 2, keys_top + 12))

        # Swara short label (middle)
        label = swara_label_for_note(i)
        lab_surf = FONT_MED.render(label, True, txt_col)
        screen.blit(lab_surf, (rect.centerx - lab_surf.get_width() // 2, keys_top + 50))

        # Full name (rotated-ish, just small text stacked, bottom)
        full = SWARA_FULL[semitone]
        words = full.split()
        wy = keys_top + key_h - 90
        for w in words:
            ws = FONT_SMALL.render(w, True, txt_col)
            screen.blit(ws, (rect.centerx - ws.get_width() // 2, wy))
            wy += 16

        x += key_w

    # ── Footer ──
    footer = FONT_SMALL.render(
        "ESC = quit   |   Green = in ragam   |   Gold = just played   |   "
        "Group colors: S/P gold, R blue, G teal, M red, D purple, N pink",
        True, COL_DIM)
    screen.blit(footer, (20, HEIGHT - 24))

    pygame.display.flip()

# ─── MAIN LOOP ───────────────────────────────────────────────────────
def main():
    global sruthi_idx, mode, ragam_idx, pressed_key, pressed_timer

    print("═" * 50)
    print("  CARNATIC SWARA KEYBOARD")
    print("═" * 50)
    print(f"Loaded {len(RAGAMS)} ragams")
    print("Controls: number/letter keys = play notes")
    print("  UP/DOWN = sruthi | TAB = mode | PgUp/PgDn = ragam")
    print("  ENTER = arohanam | BACKSPACE = avarohanam | ESC = quit")
    print("═" * 50)

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False

                elif event.key == pygame.K_UP:
                    sruthi_idx = (sruthi_idx + 1) % 12
                    play_freq(SRUTHI_BASE[sruthi_idx], 300)
                    print(f"Sruthi: {SRUTHI_NAMES[sruthi_idx]}")

                elif event.key == pygame.K_DOWN:
                    sruthi_idx = (sruthi_idx - 1) % 12
                    play_freq(SRUTHI_BASE[sruthi_idx], 300)
                    print(f"Sruthi: {SRUTHI_NAMES[sruthi_idx]}")

                elif event.key == pygame.K_TAB:
                    mode = 1 - mode
                    print(f"Mode: {'RAGAM' if mode else 'SWARA'}")
                    if mode == 1:
                        r = RAGAMS[ragam_idx]
                        print(f"Ragam: {r['name']}")

                elif event.key == pygame.K_PAGEUP and mode == 1:
                    ragam_idx = (ragam_idx + 1) % len(RAGAMS)
                    print(f"Ragam: {RAGAMS[ragam_idx]['name']}")

                elif event.key == pygame.K_PAGEDOWN and mode == 1:
                    ragam_idx = (ragam_idx - 1) % len(RAGAMS)
                    print(f"Ragam: {RAGAMS[ragam_idx]['name']}")

                elif event.key == pygame.K_RETURN and mode == 1:
                    r = RAGAMS[ragam_idx]
                    print(f"Playing arohanam: {r['name']}")
                    for s in r["arohanam"]:
                        oct_shift = 1 if s == 12 else 0
                        real_s = 0 if s == 12 else s
                        play_freq(get_freq(real_s, sruthi_idx, oct_shift), 400)
                        pygame.time.wait(420)

                elif event.key == pygame.K_BACKSPACE and mode == 1:
                    r = RAGAMS[ragam_idx]
                    print(f"Playing avarohanam: {r['name']}")
                    for s in r["avarohanam"]:
                        oct_shift = 1 if s == 12 else 0
                        real_s = 0 if s == 12 else s
                        play_freq(get_freq(real_s, sruthi_idx, oct_shift), 400)
                        pygame.time.wait(420)

                elif event.key in KEY_CODES:
                    idx = KEY_CODES.index(event.key)
                    semitone, octave = NOTE_RANGE[idx]
                    freq = get_freq(semitone, sruthi_idx, octave)
                    play_freq(freq, 550)
                    pressed_key = idx
                    pressed_timer = 15
                    label = swara_label_for_note(idx)
                    in_ragam = ""
                    if mode == 1:
                        active = ragam_active_set(RAGAMS[ragam_idx])
                        in_ragam = "  [in ragam]" if semitone in active else "  [outside ragam]"
                    print(f"{label}  {SWARA_FULL[semitone]}  {freq:.2f} Hz{in_ragam}")

        if pressed_timer > 0:
            pressed_timer -= 1

        draw()
        clock.tick(60)

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()