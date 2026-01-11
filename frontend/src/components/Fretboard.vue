<script setup lang="ts">
import { useGuitarStore } from '../stores/guitar'
import { computed, ref, onMounted, onUnmounted } from 'vue'

const store = useGuitarStore()

// 6 Strings, 15 Frets
// String Index 0 = Low E. String Index 5 = High E.
const stringIndices = [5, 4, 3, 2, 1, 0] // Top to Bottom visual in Horizontal
const fretCount = 15
const frets = Array.from({ length: fretCount + 1 }, (_, i) => i) // 0-15

// Colors for pitch classes
const NOTE_COLORS = [
    'var(--color-primary)',
    'var(--color-secondary)',
    'var(--color-tertiary)',
    'var(--color-quaternary)'
]

// Orientation State
const isVertical = ref(false)

function checkOrientation() {
    isVertical.value = window.innerWidth < window.innerHeight
}

onMounted(() => {
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
})

onUnmounted(() => {
    window.removeEventListener('resize', checkOrientation)
})

// Layout Computeds
const viewBox = computed(() => isVertical.value ? "0 0 220 1000" : "0 0 1000 220")

// Coordinate Helpers
const NUT_SIZE = 10
const FRET_WIDTH = 60
const STRING_SPACING = 32
const MARGIN_NUT = 50
const MARGIN_STRING = 30

function getNutRect() {
    if (isVertical.value) {
        // Top Nut
        return { x: 10, y: MARGIN_NUT, width: 200, height: NUT_SIZE }
    } else {
        // Left Nut
        return { x: MARGIN_NUT, y: 10, width: NUT_SIZE, height: 200 }
    }
}

function getFretLineCoords(f: number) {
    if (isVertical.value) {
        // Horizontal Lines
        const y = MARGIN_NUT + NUT_SIZE + (f - 1) * FRET_WIDTH + FRET_WIDTH
        return { x1: 10, y1: y, x2: 210, y2: y }
    } else {
        // Vertical Lines
        const x = MARGIN_NUT + NUT_SIZE + (f - 1) * FRET_WIDTH + FRET_WIDTH
        return { x1: x, y1: 10, x2: x, y2: 210 }
    }
}

function getStringLineCoords(sIdx: number, loopIndex: number) {
    // sIdx: 0=Low E, 5=High E
    // loopIndex: Iteration index.
    // Horizontal: i=0 is Top (High E if array is [5,4,3,2,1,0]).
    // Vertical: Low E should be Left.

    if (isVertical.value) {
        // Vertical Strings
        // Low E (0) at Left.
        const x = MARGIN_STRING + sIdx * STRING_SPACING
        return { x1: x, y1: 50, x2: x, y2: 960 }
    } else {
        // Horizontal Strings
        // loopIndex 0 is top.
        const y = MARGIN_STRING + loopIndex * STRING_SPACING
        return { x1: 50, y1: y, x2: 960, y2: y }
    }
}

function getNoteCoords(sIdx: number, f: number, loopIndex: number) {
    if (isVertical.value) {
        // Vertical
        // x determined by string (sIdx)
        const cx = MARGIN_STRING + sIdx * STRING_SPACING
        // y determined by fret
        // Fret 0 (Open): Above nut? No, "Nut" is usually fret 0 line?
        // In previous horizontal logic: f=0 -> x=30 (Left of nut). Nut at 50.
        // Vertical: Nut at 50 (Top).
        // f=0 -> y=30 (Above nut).
        // f>0 -> Center of fret space.
        // Fret 1 space starts at 60 (Nut+10). Ends at 120. Center 90.
        // Formula: 60 + (f-1)*60 + 30.
        const cy = f === 0 ? 30 : (MARGIN_NUT + NUT_SIZE + (f - 1) * FRET_WIDTH + (FRET_WIDTH / 2))
        return { cx, cy, x: cx, y: cy } // x/y for text
    } else {
        // Horizontal
        // x determined by fret
        const cx = f === 0 ? 30 : (MARGIN_NUT + NUT_SIZE + (f - 1) * FRET_WIDTH + (FRET_WIDTH / 2))
        // y determined by string loopIndex (visual position)
        const cy = MARGIN_STRING + loopIndex * STRING_SPACING
        return { cx, cy, x: cx, y: cy }
    }
}

function getFretNumberCoords(f: number) {
     if (isVertical.value) {
        // Right side of board?
        const y = MARGIN_NUT + NUT_SIZE + (f - 1) * FRET_WIDTH + (FRET_WIDTH / 2)
        return { x: 235, y: y + 5 } // +5 for text centering approx
    } else {
        const x = MARGIN_NUT + NUT_SIZE + (f - 1) * FRET_WIDTH + (FRET_WIDTH / 2)
        return { x: x, y: 235 }
    }
}

function getMutedCoords(sIdx: number, loopIndex: number) {
    if (isVertical.value) {
        const x = MARGIN_STRING + sIdx * STRING_SPACING
        return { x: x, y: 15 } // Above open string position
    } else {
        const y = MARGIN_STRING + loopIndex * STRING_SPACING
        return { x: 25, y: y + 5 } // Left of open string position
    }
}

function getNoteMeta(stringIdx: number, fret: number) {
    const selected = store.selectedPositions.find(p => p.string === stringIdx && p.fret === fret)

    const chromatic = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    const baseMidi = store.currentTuning.midiBases[stringIdx] ?? 40
    const noteIdx = (baseMidi + fret) % 12
    const noteName = chromatic[noteIdx] || 'C'

    const isSelected = !!selected
    const isScaleNote = store.isScaleEnabled && store.scaleNotes.includes(noteName)
    const isScaleRoot = store.isScaleEnabled && noteName === store.selectedScaleRoot

    let isWatermarked = false
    if (store.reverseLookupMode) {
        isWatermarked = store.targetNotes.includes(noteName)
    } else {
        const relevantSelection = store.selectedPositions.find(p => p.note === noteName)
        isWatermarked = !isSelected && !!relevantSelection
    }

    let color = 'transparent'
    let opacity = 1.0

    if (isSelected || isWatermarked) {
        let distinctNotes = [...new Set(store.selectedPositions.map(p => p.note))]
        if (store.reverseLookupMode) {
            distinctNotes = store.targetNotes
        }

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
        isScaleNote,
        isScaleRoot,
        color,
        opacity
    }
}

function handleFretClick(stringIdx: number, fret: number) {
    store.togglePosition(stringIdx, fret)
}

function isStringMuted(stringIdx: number) {
    if (store.selectedPositions.length === 0) return false
    return !store.selectedPositions.some(p => p.string === stringIdx)
}

</script>

<template>
  <div class="fretboard">
    <svg width="100%" :height="isVertical ? '100%': '300'" :viewBox="viewBox" :style="{ maxHeight: isVertical ? '100vh' : 'auto' }">
        <!-- Nut -->
        <rect v-bind="getNutRect()" fill="#000" />

        <!-- Frets -->
        <g v-for="f in frets" :key="`fret-line-${f}`">
            <line
                v-if="f > 0"
                v-bind="getFretLineCoords(f)"
                stroke="#333"
                stroke-width="2"
            />
            <!-- Fret Numbers -->
             <text v-if="[3,5,7,9,12,15].includes(f)"
                v-bind="getFretNumberCoords(f)"
                text-anchor="middle"
                font-family="monospace"
                font-weight="bold"
            >{{ f }}</text>
        </g>

        <!-- Strings -->
        <g v-for="(sIdx, i) in stringIndices" :key="`str-${sIdx}`">
            <line
                v-bind="getStringLineCoords(sIdx, i)"
                stroke="#666"
                :stroke-width="1 + (sIdx * 0.5)"
            />

            <!-- Muted Indicator (X) -->
            <text v-if="isStringMuted(sIdx)"
                v-bind="getMutedCoords(sIdx, i)"
                fill="red"
                font-family="sans-serif"
                font-weight="bold"
                font-size="20"
                text-anchor="middle"
            >X</text>

            <!-- Click Targets & Notes -->
            <g v-for="f in frets" :key="`note-${sIdx}-${f}`">
                <!-- Scale Overlay -->
                <circle
                    v-if="getNoteMeta(sIdx, f).isScaleNote && !getNoteMeta(sIdx, f).isSelected"
                    :cx="getNoteCoords(sIdx, f, i).cx"
                    :cy="getNoteCoords(sIdx, f, i).cy"
                    r="10"
                    fill="white"
                    :stroke="getNoteMeta(sIdx, f).isScaleRoot ? 'var(--color-primary)' : '#999'"
                    :stroke-width="getNoteMeta(sIdx, f).isScaleRoot ? 4 : 2"
                    pointer-events="none"
                />

                <circle
                    :cx="getNoteCoords(sIdx, f, i).cx"
                    :cy="getNoteCoords(sIdx, f, i).cy"
                    r="14"
                    :fill="getNoteMeta(sIdx, f).color"
                    :fill-opacity="getNoteMeta(sIdx, f).opacity"
                    :stroke="getNoteMeta(sIdx, f).isSelected ? 'black' : 'transparent'"
                    stroke-width="2"
                    class="fret-target"
                    @click="handleFretClick(sIdx, f)"
                />

                <text
                    v-if="getNoteMeta(sIdx, f).isSelected || getNoteMeta(sIdx, f).isWatermarked || (getNoteMeta(sIdx, f).isScaleNote && !isVertical)"
                    :x="getNoteCoords(sIdx, f, i).x"
                    :y="getNoteCoords(sIdx, f, i).y + 5"
                    text-anchor="middle"
                    fill="black"
                    :font-size="getNoteMeta(sIdx, f).isSelected ? 12 : 10"
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
    width: 100%;
    /* Ensure container allows expansion */
}
.fret-target {
    cursor: pointer;
    transition: r 0.1s;
}
.fret-target:hover {
    r: 16;
}
</style>
