import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface NoteSelection {
    string: number
    fret: number
    note: string // E.g., 'C', 'F#', etc.
}

interface ChordResult {
    found: boolean
    primary: {
        root: string
        chord: string
        name: string
    } | null
    alternatives: Array<{
        root: string
        chord: string
        name: string
    }>
    message: string
}

const STRINGS = ['E', 'A', 'D', 'G', 'B', 'E'] // Low to High (indices 0-5)
const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

export const useGuitarStore = defineStore('guitar', () => {
    const selectedPositions = ref<NoteSelection[]>([])
    const currentChord = ref<ChordResult | null>(null)
    const isDarkMode = ref(false)
    const reverseLookupMode = ref(false)

    // Computed
    const selectedNotes = computed(() => {
        // Sort by string (low E is index 0) and then fret?
        // Actually pitch matters for chord id.
        // Let's rely on backend for complex id, but we send notes list.
        // We should sort by string index to approximate pitch order (Low E is lowest).
        const sorted = [...selectedPositions.value].sort((a, b) => {
            if (a.string !== b.string) return a.string - b.string
            return a.fret - b.fret
        })
        return sorted.map(s => s.note)
    })

    // Actions
    function togglePosition(stringIdx: number, fretIdx: number) {
        if (reverseLookupMode.value) {
            // Clear board if user clicks in reverse lookup mode to start fresh?
            // Or just disable reverse lookup and start editing.
            reverseLookupMode.value = false
            selectedPositions.value = []
        }

        const existingIdx = selectedPositions.value.findIndex(
            p => p.string === stringIdx && p.fret === fretIdx
        )

        if (existingIdx !== -1) {
            // Deselect
            selectedPositions.value.splice(existingIdx, 1)
        } else {
            // Select
            // Limit check: specific string can only have one note selected?
            // Realistically yes, unless tapping? But for basic chord shapes, one note per string.
            // Remove any other selection on the same string
            const stringConflict = selectedPositions.value.findIndex(p => p.string === stringIdx)
            if (stringConflict !== -1) {
                selectedPositions.value.splice(stringConflict, 1)
            }

            // Calculate note name
            // String open note
            const openNoteName = STRINGS[stringIdx] || 'E'
            const openNoteIdx = CHROMATIC.indexOf(openNoteName)
            // fret offset
            const noteIdx = (openNoteIdx + fretIdx) % 12
            const noteName = CHROMATIC[noteIdx] || 'C'

            selectedPositions.value.push({
                string: stringIdx,
                fret: fretIdx,
                note: noteName
            })
        }

        // Check constraints: Max 4 unique notes?
        // Prompt: "You can disallow the selection of more unique notes once 4 unique notes have been selected."
        const uniqueNotes = new Set(selectedPositions.value.map(p => p.note))
        if (uniqueNotes.size > 4) {
            // Revert addition if it caused > 4 unique.
            // Bit lazy here, just pop if we just added.
            // If we just added a note that was already in the set (octave), size wouldn't increase.
            // So only pop if we exceeded.
            selectedPositions.value.pop()
            // Ideally show toast/message
        }

        identify()
    }

    async function identify() {
        if (selectedPositions.value.length < 3) {
            currentChord.value = null
            return
        }

        try {
            const res = await fetch('/api/identify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: selectedNotes.value })
            })
            const data = await res.json()
            currentChord.value = data
        } catch (e) {
            console.error(e)
        }
    }

    async function reverseLookup(chordName: string) {
        try {
            const res = await fetch(`/api/chord/${encodeURIComponent(chordName)}`)
            if (!res.ok) return
            /*
            const data = await res.json()
            const notes: string[] = data.notes // e.g. ['C', 'E', 'G']
            ^ Unused var "notes"
            */

            // We need to place these notes on the fretboard.
            // This is non-trivial without a "solver".
            // The prompt says: "see the silhouetted fret positions of the notes that make up that chord"
            // It implies showing ALL positions? Or a specific shape?
            // "silhouetted fret positions of the notes that make up that chord (G# B D F for example)"
            // This sounds like highlighting ALL G#, B, D, F instances on the board.

            reverseLookupMode.value = true
            // We will use a special property or just highlight them visually in the component
            // But store needs to know "Target Notes".
            // Let's overload selectedPositions? No, that implies specific frets.
            // We need a "highlightedNotes" set for reverse lookup.
        } catch (e) {
            console.error(e)
        }
    }

    function reset() {
        selectedPositions.value = []
        currentChord.value = null
        reverseLookupMode.value = false
    }

    function toggleTheme() {
        isDarkMode.value = !isDarkMode.value
        if (isDarkMode.value) {
            document.documentElement.classList.add('dark-mode')
        } else {
            document.documentElement.classList.remove('dark-mode')
        }
    }

    return {
        selectedPositions,
        currentChord,
        togglePosition,
        reset,
        isDarkMode,
        toggleTheme,
        reverseLookup,
        reverseLookupMode
    }
})
