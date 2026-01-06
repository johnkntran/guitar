<script setup lang="ts">
import { useGuitarStore } from '../stores/guitar'
import Fretboard from '../components/Fretboard.vue'
import Controls from '../components/Controls.vue'

const store = useGuitarStore()
</script>

<template>
  <div class="analyzer-view">
      <div class="fretboard-container neo-box">
        <Fretboard />
      </div>

      <div class="results-container" v-if="store.currentChord || store.selectedPositions.length > 0">
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
