<script setup lang="ts">
import { useGuitarStore } from '../stores/guitar'
import Fretboard from '../components/Fretboard.vue'
import Controls from '../components/Controls.vue'
import { useToneGenerator } from '../composables/useToneGenerator'

const store = useGuitarStore()
const { strum } = useToneGenerator()

const STRING_MIDI_BASES = [40, 45, 50, 55, 59, 64] // E2, A2, D3, G3, B3, E4

function handleStrum() {
    if (store.selectedPositions.length === 0) return

    // Calculate frequencies for all selected positions
    const frequencies = store.selectedPositions
        .map(p => {
            const baseMidi = STRING_MIDI_BASES[p.string] ?? 40
            const midiNote = baseMidi + p.fret
            return 440 * Math.pow(2, (midiNote - 69) / 12)
        })
        .sort((a, b) => a - b) // Strum from low to high

    strum(frequencies)
}
</script>

<template>
  <div class="analyzer-view">
      <div class="fretboard-container neo-box">
        <Fretboard />
      </div>

      <div class="results-container" v-if="store.currentChord || store.selectedPositions.length > 0">
        <div class="strum-action" v-if="store.selectedPositions.length > 0">
            <button class="neo-button strum-btn" @click="handleStrum">
                 STRUM CHORD 🎸
            </button>
        </div>

        <div class="neo-box result" v-if="store.currentChord?.found">
            <h2>{{ store.currentChord.primary?.name }}</h2>
            <p v-if="store.currentChord.alternatives?.length">
                Also: <span v-for="(alt, index) in store.currentChord.alternatives" :key="alt.name">
                    {{ alt.name }}{{ index < store.currentChord.alternatives.length - 1 ? ', ' : '' }}
                </span>
            </p>
        </div>
        <div class="neo-box result warning" v-else-if="store.currentChord?.found === false">
            <h2>NO CHORD</h2>
            <p>{{ store.currentChord.message }}</p>
        </div>
      </div>

      <Controls />
  </div>
</template>

<style scoped lang="scss">
.fretboard-container {
  overflow-x: auto;
  padding: 2rem 1rem;
}

.strum-action {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
}

.strum-btn {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    padding: 1rem 3rem;
    background: var(--color-primary);
    color: white;
}

.results-container {
    margin-top: 2rem;
    .result {
        background: var(--color-tertiary);
        color: #000000;
        h2 { margin: 0; font-size: 2rem; font-family: var(--font-heading); }
        &.warning {
            background: var(--color-secondary);
            color: white;
        }
    }
}
</style>
