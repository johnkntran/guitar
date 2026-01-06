import math

NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

def identify_pitch(hz: float):
    if hz <= 0:
         return None

    # Formula: n = 12 * log2(f / 440) + 69
    # 69 is A4 (440Hz).
    midi_number = 12 * math.log2(hz / 440) + 69

    rounded_midi = round(midi_number)

    # Cents difference: 100 * (actual - rounded)
    cents = (midi_number - rounded_midi) * 100

    # Calculate Note Name and Octave
    note_index = rounded_midi % 12
    octave = (rounded_midi // 12) - 1

    note_name = NOTES[note_index]
    full_note_name = f"{note_name}{octave}"

    # Calculate "perfect" Hz for the rounded note
    perfect_hz = 440 * (2 ** ((rounded_midi - 69) / 12))

    return {
        "note": full_note_name,
        "hz": hz,
        "perfect_hz": perfect_hz,
        "cents": cents,
        "octave": octave,
        "midi": rounded_midi
    }
