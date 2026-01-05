<script setup lang="ts">
import { useGuitarStore } from '../stores/guitar'
import { ref, onMounted, watch } from 'vue'

const store = useGuitarStore()
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
</script>

<template>
  <div class="controls neo-box">
    <div class="control-group">
        <label>REVERSE LOOKUP</label>
        <div class="select-wrapper">
            <select v-model="selectedChordName" @change="handleReverseLookup">
                <option value="" disabled>Select a chord...</option>
                <option v-for="c in availableChords" :key="c" :value="c">{{ c }}</option>
            </select>
        </div>
    </div>

    <button @click="handleReset" class="neo-button reset-btn">RESET BOARD</button>
  </div>
</template>

<style scoped lang="scss">
.controls {
    display: flex;
    gap: 2rem;
    align-items: flex-end;
    flex-wrap: wrap;
    background: var(--color-box);
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

.reset-btn {
    background: var(--color-secondary);
    &:hover { background: var(--color-secondary-light); }
}
</style>
