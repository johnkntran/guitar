from typing import List, Dict, Optional, Tuple, Set

# Notes in chromatic scale
NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

# Map sharps to flats for display preferences (simple approach: output sharps by default as requested in prompt examples)
# The prompt uses sharps (G#, D#), so we'll stick to sharps primarily.

# Intervals in semitones
INTERVALS = {
    0: "R",
    1: "m2",
    2: "2",
    3: "m3",
    4: "3",
    5: "4",
    6: "b5",
    7: "5",
    8: "#5",
    9: "6",
    10: "m7",
    11: "7",
}

# Chord definitions (intervals from root)
CHORD_DEFINITIONS = {
    "Major": frozenset([0, 4, 7]),
    "Minor": frozenset([0, 3, 7]),
    "Diminished": frozenset([0, 3, 6]),
    "Augmented": frozenset([0, 4, 8]),
    "Sus2": frozenset([0, 2, 7]),
    "Sus4": frozenset([0, 5, 7]),
    "Major 7th": frozenset([0, 4, 7, 11]),
    "Minor 7th": frozenset([0, 3, 7, 10]),
    "Dominant 7th": frozenset([0, 4, 7, 10]),
    "Diminished 7th": frozenset([0, 3, 6, 9]),
    "Half-Diminished 7th": frozenset([0, 3, 6, 10]), # m7b5
    "Add9": frozenset([0, 4, 7, 2]), # Treated as 2 for set calculation (mod 12)
    "Minor Add9": frozenset([0, 3, 7, 2]),
    "Major 6th": frozenset([0, 4, 7, 9]),
    "Minor 6th": frozenset([0, 3, 7, 9]),
}

def get_note_index(note: str) -> int:
    try:
        return NOTES.index(note)
    except ValueError:
        # Handle flats if passed
        note_map = {"Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#"}
        if note in note_map:
            return NOTES.index(note_map[note])
        return -1

def get_intervals(root_index: int, note_indices: Set[int]) -> Set[int]:
    intervals = set()
    for note_idx in note_indices:
        interval = (note_idx - root_index) % 12
        intervals.add(interval)
    return intervals

def identify_chord(notes: List[str]) -> Dict:
    """
    Identifies chords from a list of note names.
    Returns a dictionary with the primary match and candidates.
    """
    unique_notes = list(set(notes))
    if len(unique_notes) < 3:
        return {"found": False, "message": "Select at least 3 unique notes."}

    note_indices = {get_note_index(n) for n in unique_notes}
    if -1 in note_indices:
         return {"found": False, "message": "Invalid notes provided."}

    candidates = []

    # Try every note as the root
    for potential_root_idx in note_indices:
        current_intervals = get_intervals(potential_root_idx, note_indices)

        for chord_name, required_intervals in CHORD_DEFINITIONS.items():
            # Check if required intervals match the current intervals
            # Note: The set of notes from user might contain *more* notes or be exact.
            # For this simple app, we look for exact matches of chord tones.
            # However, prompt says "don't need to consider chords with more than 4 unique notes"
            # and "support all 3 and 4-note chord combinations".

            if current_intervals == required_intervals:
                root_name = NOTES[potential_root_idx]
                candidates.append({
                    "root": root_name,
                    "chord": chord_name,
                    "name": f"{root_name} {chord_name}",
                    "bass": notes[0] if notes else "" # Assumes input list is ordered by pitch if strictly checking bass for inversions, but here we just store candidates first.
                })

    if not candidates:
        return {"found": False, "message": "No specific chord found for these notes."}

    # Sort candidates.
    # Logic: "preferentially identify the chord whose bass note corresponds to the lowest note on the fretboard"
    # The input `notes` list comes from the frontend. We will assume the frontend sends them ordered
    # (or we can just determine the "bass" note as the first one if we assume string 6 to 1 order?
    # Actually, the user selects notes. We need to know which is the lowest.
    # The prompt says "lowest note on the fretboard".
    # We'll assume the API receives notes with some indication of lowest, OR we just check if the candidate root matches the lowest note provided in the list.

    # Let's assume the frontend sends the "lowest pitch note" as the first element of the list,
    # or better, simply prioritizes the candidate where root == lowest_note.

    lowest_note = notes[0] # Simplification: Assume simplest case where first note is lowest.
    # Ideally, the frontend should send {string, fret, note} objects, but for this generic function we take strings.
    # Let's Refine this: Use the first note in the list as the 'bass' note.

    primary_match = None
    sorted_candidates = []

    # Filter for root position matches (bass note == root)
    root_position_matches = [c for c in candidates if c['root'] == lowest_note]
    other_matches = [c for c in candidates if c['root'] != lowest_note]

    if root_position_matches:
        primary_match = root_position_matches[0]
        # Valid inversions are the others
        sorted_candidates = root_position_matches[1:] + other_matches
    else:
        # If no root position match, then it's an inversion/slash chord.
        # Pick the first one found as primary (or valid logic for "best" inversion?)
        primary_match = candidates[0]
        primary_match["name"] = f"{primary_match['name']}/{lowest_note}" # Slash chord notation
        sorted_candidates = candidates[1:]

    return {
        "found": True,
        "primary": primary_match,
        "alternatives": sorted_candidates
    }

def get_chord_notes(chord_name: str) -> List[str]:
    """
    Reverse lookup: 'C Major' -> ['C', 'E', 'G']
    """
    parts = chord_name.split(" ", 1)
    if len(parts) < 2:
        return []

    root_str = parts[0]
    type_str = parts[1]

    # Handle slash chords for reverse lookup?
    # Complexity: The prompt asks for "picker for named chord".
    # We'll assume standard root positions for the picker to keep it simple.

    root_idx = get_note_index(root_str)
    if root_idx == -1 or type_str not in CHORD_DEFINITIONS:
        return []

    intervals = CHORD_DEFINITIONS[type_str]
    note_names = []
    for interval in intervals:
        note_idx = (root_idx + interval) % 12
        note_names.append(NOTES[note_idx])

    return note_names

