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

    const reverseLookupMode = ref(false)
    const targetNotes = ref<string[]>([])

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
            const data = await res.json()
            const notes: string[] = data.notes // e.g. ['C', 'E', 'G']

            reverseLookupMode.value = true
            // Clear existing selection?
            selectedPositions.value = []

            // We need to tell the component which notes to highlight.
            // We can reuse selectedPositions if we want them to appear "selected" (solid color).
            // But prompt says "silhouetted" (watermarked).
            // And "Reverse Lookup" means we show ALL positions.
            // So we shouldn't populate selectedPositions (which implies specific fret/string coords).
            // instead we need a way to say "Highlight all Cs, Es, Gs".

            // Let's add a state for targetNotes
            targetNotes.value = notes
        } catch (e) {
            console.error(e)
        }
    }

    function reset() {
        selectedPositions.value = []
        currentChord.value = null
        reverseLookupMode.value = false
    }



    return {
        selectedPositions,
        currentChord,
        togglePosition,
        reset,

        reverseLookup,
        reverseLookupMode,
        targetNotes
    }
})
