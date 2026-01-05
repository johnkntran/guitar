<script setup lang="ts">
import { useGuitarStore } from '../stores/guitar'


const store = useGuitarStore()

// 6 Strings, 15 Frets
/* const STRINGS = ['E', 'A', 'D', 'G', 'B', 'E'].reverse() // Display High E at top effectively? */
// Actually standard guitar tabs/charts usually have High E at top (String 1).
// Low E at bottom (String 6).
// Array index 0 in store is Low E.
// Let's render String 5 (High E) at top, String 0 (Low E) at bottom.

const stringIndices = [5, 4, 3, 2, 1, 0] // Top to Bottom visual
const fretCount = 15
const frets = Array.from({ length: fretCount + 1 }, (_, i) => i) // 0-15

// Colors for pitch classes (assigned dynamically for currently selected unique notes)
const NOTE_COLORS = [
    'var(--color-primary)',
    'var(--color-secondary)',
    'var(--color-tertiary)',
    'var(--color-quaternary)'
]

function getNoteMeta(stringIdx: number, fret: number) {
    // Check if selected
    const selected = store.selectedPositions.find(p => p.string === stringIdx && p.fret === fret)

    // Check if watermarked (same note as one of the selected ones)
    // We need to calculate the note at this position
    // Logic duped from store, maybe should be shared helper.
    const chromatic = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    const openNotes = ['E', 'A', 'D', 'G', 'B', 'E']
    const openNoteName = openNotes[stringIdx] || 'E'
    const openNoteIdx = chromatic.indexOf(openNoteName)
    const noteIdx = (openNoteIdx + fret) % 12
    const noteName = chromatic[noteIdx] || 'C'

    const isSelected = !!selected

    // Find if this note is relevant (selected elsewhere)
    const relevantSelection = store.selectedPositions.find(p => p.note === noteName)
    const isWatermarked = !isSelected && !!relevantSelection

    // Determine color
    let color = 'transparent'
    let opacity = 1.0

    if (isSelected || isWatermarked) {
        // Find distinct notes from selection to assign consistent color
        const distinctNotes = [...new Set(store.selectedPositions.map(p => p.note))]
        const colorIdx = distinctNotes.indexOf(noteName)
        if (colorIdx !== -1) {
            color = NOTE_COLORS[colorIdx % NOTE_COLORS.length] || 'transparent'
        }

        if (isWatermarked) {
            opacity = 0.3
        }
    }

    return {
        noteName,
        isSelected,
        isWatermarked,
        color,
        opacity
    }
}

function handleFretClick(stringIdx: number, fret: number) {
    store.togglePosition(stringIdx, fret)
}

function isStringMuted(stringIdx: number) {
    // If ANY note is selected on this string, it's not muted.
    // If NO note is selected on this string, AND we have some selections elsewhere, mark as X?
    // Prompt: "Guitar strings that were not selected at all shoud be marked with a red "X" (meaning they are muted)."
    // Usually means if we are building a chord, unused strings are muted.
    // So if selectedPositions.length > 0 AND no selection on this string.
    if (store.selectedPositions.length === 0) return false
    return !store.selectedPositions.some(p => p.string === stringIdx)
}

</script>

<template>
  <div class="fretboard">
    <!-- SVG Fretboard -->
    <svg width="100%" height="300" viewBox="0 0 1000 220">
      <!-- Defs for gradients/filters if neededs -->

        <!-- Nut (Fret 0 line) -->
        <rect x="50" y="10" width="10" height="200" fill="#000" />

        <!-- Frets -->
        <g v-for="f in frets" :key="`fret-line-${f}`">
            <!-- Starting from Fret 1. Position calc: x = 60 + f * 60 (approx) -->
            <line
                v-if="f > 0"
                :x1="60 + (f-1) * 60"
                y1="10"
                :x2="60 + (f-1) * 60"
                y2="210"
                stroke="#333"
                stroke-width="2"
            />
            <!-- Fret Numbers -->
             <text v-if="[3,5,7,9,12,15].includes(f)"
                :x="60 + (f-1) * 60 + 30"
                y="235"
                text-anchor="middle"
                font-family="monospace"
                font-weight="bold"
            >{{ f }}</text>
        </g>

        <!-- Strings -->
        <g v-for="(sIdx, i) in stringIndices" :key="`str-${sIdx}`">
            <line
                x1="50"
                :y1="30 + i * 32"
                x2="960"
                :y2="30 + i * 32"
                stroke="#666"
                :stroke-width="1 + (sIdx * 0.5)"
            />

            <!-- Muted Indicator (X) -->
            <text v-if="isStringMuted(sIdx)"
                x="25"
                :y="35 + i * 32"
                fill="red"
                font-family="sans-serif"
                font-weight="bold"
                font-size="20"
                text-anchor="middle"
            >X</text>

            <!-- Click Targets & Notes -->
            <g v-for="f in frets" :key="`note-${sIdx}-${f}`">
                <!-- x position logic:
                     Open string (f=0) -> x=30 (left of nut)
                     Frets -> centered in fret space
                -->
                <circle
                    :cx="f === 0 ? 30 : 60 + (f-1) * 60 + 30"
                    :cy="30 + i * 32"
                    r="14"
                    :fill="getNoteMeta(sIdx, f).color"
                    :fill-opacity="getNoteMeta(sIdx, f).opacity"
                    :stroke="getNoteMeta(sIdx, f).isSelected ? 'black' : 'transparent'"
                    stroke-width="2"
                    class="fret-target"
                    @click="handleFretClick(sIdx, f)"
                />

                <!-- Note Name (only if selected or watermarked) -->
                <text
                    v-if="getNoteMeta(sIdx, f).isSelected || getNoteMeta(sIdx, f).isWatermarked"
                    :x="f === 0 ? 30 : 60 + (f-1) * 60 + 30"
                    :y="30 + i * 32 + 5"
                    text-anchor="middle"
                    fill="black"
                    font-size="12"
                    font-weight="bold"
                    pointer-events="none"
                >
                    {{ getNoteMeta(sIdx, f).noteName }}
                </text>
            </g>
        </g>
    </svg>
  </div>
</template>

<style scoped>
.fretboard {
    user-select: none;
}
.fret-target {
    cursor: pointer;
    transition: r 0.1s;
}
.fret-target:hover {
    r: 16;
}
</style>
