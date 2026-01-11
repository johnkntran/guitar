<script setup lang="ts">
import { useGuitarStore, TUNINGS } from '../stores/guitar'
import { ref, onMounted, watch } from 'vue'
import { useToneGenerator } from '../composables/useToneGenerator'

const store = useGuitarStore()
const { strum } = useToneGenerator()

const availableChords = ref<string[]>([])
const selectedChordName = ref('')

onMounted(async () => {
  try {
    const res = await fetch('/api/chords')
    const data = await res.json()
    availableChords.value = data.chords
  } catch (e) {
    console.error(e)
  }
})

// Sync dropdown with identified chord
watch(() => store.currentChord, (newVal) => {
    if (newVal?.found && newVal.primary) {
        // Try to find exact match in available chords
        // The backend returns names like "C Major", which should match exactly
        if (availableChords.value.includes(newVal.primary.name)) {
            selectedChordName.value = newVal.primary.name
        }
    } else if (newVal === null) {
        // Reset or no chord
        selectedChordName.value = ''
    }
})

function handleReverseLookup() {
    if(!selectedChordName.value) return
    store.reverseLookup(selectedChordName.value)
}

function handleReset() {
    selectedChordName.value = ''
    store.reset()
}

function handleStrum() {
    if (store.selectedPositions.length === 0) return

    // Calculate frequencies for all selected positions
    const frequencies = store.selectedPositions
        .map(p => {
            const baseMidi = store.currentTuning.midiBases[p.string] ?? 40
            const midiNote = baseMidi + p.fret
            return 440 * Math.pow(2, (midiNote - 69) / 12)
        })
        .sort((a, b) => a - b) // Strum from low to high

    strum(frequencies)
}
</script>

<template>
  <div class="controls neo-box">
    <div class="control-group">
        <label>GUITAR TUNING</label>
        <div class="select-wrapper">
            <select :value="store.currentTuning.name" @change="(e: any) => store.setTuning(TUNINGS[e.target.value]!)">
                <option v-for="t in TUNINGS" :key="t.name" :value="t.name">{{ t.name }}</option>
            </select>
        </div>
    </div>

    <div class="control-group">
        <label>REVERSE LOOKUP</label>
        <div class="select-wrapper">
            <select v-model="selectedChordName" @change="handleReverseLookup">
                <option value="" disabled>Select a chord...</option>
                <option v-for="c in availableChords" :key="c" :value="c">{{ c }}</option>
            </select>
        </div>
    </div>

    <div class="actions">
        <button
            v-if="store.selectedPositions.length > 0"
            @click="handleStrum"
            class="neo-button strum-btn"
        >
            STRUM 🎸
        </button>
        <button @click="handleReset" class="neo-button reset-btn">RESET BOARD</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.controls {
    display: flex;
    gap: 2rem;
    align-items: flex-end;
    flex-wrap: wrap;
    background: var(--color-box);

    @media (max-width: 600px) {
        flex-direction: column;
        align-items: stretch;
        gap: 1.5rem;
    }
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
        font-weight: bold;
        font-family: var(--font-heading);
    }
}

.select-wrapper {
    position: relative;
    border: var(--border-width) solid var(--color-border);
    background: var(--color-box);
    box-shadow: 4px 4px 0 var(--color-border);

    select {
        appearance: none;
        border: none;
        background: transparent;
        padding: 0.5rem 2rem 0.5rem 1rem;
        font-family: var(--font-body);
        font-size: 1rem;
        width: 200px;
        cursor: pointer;

        @media (max-width: 600px) {
            width: 100%;
        }
    }

    &::after {
        content: '▼';
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
    }
}

.actions {
    display: flex;
    gap: 1rem;
    align-items: flex-end;

    @media (max-width: 600px) {
        justify-content: flex-end;
    }
}

.strum-btn {
    background: var(--color-primary);
    color: white;
}

.reset-btn {
    background: var(--color-secondary);
    &:hover { background: var(--color-secondary-light); }
}
</style>
