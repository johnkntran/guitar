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

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

export interface Tuning {
    name: string
    midiBases: number[] // 6 values, low E string to high E string
}

export const TUNINGS: Record<string, Tuning> = {
    'Standard': { name: 'Standard', midiBases: [40, 45, 50, 55, 59, 64] },
    'Drop D': { name: 'Drop D', midiBases: [38, 45, 50, 55, 59, 64] },
    'Double Drop D': { name: 'Double Drop D', midiBases: [38, 45, 50, 55, 59, 62] },
    'DADGAD': { name: 'DADGAD', midiBases: [38, 45, 50, 55, 57, 62] },
    'Open G': { name: 'Open G', midiBases: [38, 43, 50, 55, 59, 62] },
    'Open D': { name: 'Open D', midiBases: [38, 45, 50, 54, 57, 62] },
}

export const SCALE_TYPES = {
    'Major': [0, 2, 4, 5, 7, 9, 11],
    'Minor': [0, 2, 3, 5, 7, 8, 10],
    'Major Pentatonic': [0, 2, 4, 7, 9],
    'Minor Pentatonic': [0, 3, 5, 7, 10],
    'Blues': [0, 3, 5, 6, 7, 10],
}

export const useGuitarStore = defineStore('guitar', () => {
    const selectedPositions = ref<NoteSelection[]>([])
    const currentChord = ref<ChordResult | null>(null)
    const currentTuning = ref<Tuning>(TUNINGS['Standard']!)

    // Scale Explorer State
    const isScaleEnabled = ref(false)
    const selectedScaleRoot = ref('C')
    const selectedScaleType = ref<keyof typeof SCALE_TYPES>('Major')

    const reverseLookupMode = ref(false)
    const targetNotes = ref<string[]>([])

    // Computed
    const scaleNotes = computed(() => {
        if (!isScaleEnabled.value) return []
        const rootIdx = CHROMATIC.indexOf(selectedScaleRoot.value)
        const intervals = SCALE_TYPES[selectedScaleType.value]
        return intervals.map(interval => CHROMATIC[(rootIdx + interval) % 12]!)
    })

    const stringsLabels = computed(() => {
        return currentTuning.value.midiBases.map(midi => CHROMATIC[midi % 12]!)
    })
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
            // String base midi
            const baseMidi = currentTuning.value.midiBases[stringIdx] ?? 40
            // fret offset
            const noteIdx = (baseMidi + fretIdx) % 12
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

    function setTuning(tuning: Tuning) {
        currentTuning.value = tuning
        // Re-calculate all selected notes based on new tuning
        selectedPositions.value = selectedPositions.value.map(pos => {
            const baseMidi = tuning.midiBases[pos.string] ?? 40
            const noteIdx = (baseMidi + pos.fret) % 12
            return {
                ...pos,
                note: CHROMATIC[noteIdx]!
            }
        })
        identify()
    }



    return {
        selectedPositions,
        currentChord,
        togglePosition,
        reset,
        identify,
        currentTuning,
        setTuning,
        stringsLabels,

        isScaleEnabled,
        selectedScaleRoot,
        selectedScaleType,
        scaleNotes,
        CHROMATIC,

        reverseLookup,
        reverseLookupMode,
        targetNotes
    }
})
