<script setup lang="ts">
import { useGuitarStore } from './stores/guitar'
import Fretboard from './components/Fretboard.vue'
import Controls from './components/Controls.vue'

const store = useGuitarStore()
</script>

<template>
  <div class="app-container">
    <header class="neo-box header">
      <h1>CHORD<br>COORDINATOR</h1>

    </header>

    <main>
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
    </main>
  </div>
</template>

<style scoped lang="scss">
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-quaternary);

  h1 {
    margin: 0;
    line-height: 0.9;
    font-size: 3rem;
    text-transform: uppercase;
    font-family: var(--font-heading);
  }
}

.fretboard-container {
  overflow-x: auto;
  padding: 2rem 1rem;
}

.results-container {
    margin-top: 2rem;
    .result {
        background: var(--color-tertiary);
        color: #000000; /* Always black text on bright colors */
        h2 { margin: 0; font-size: 2rem; font-family: var(--font-heading); }
        &.warning {
            background: var(--color-secondary);
            color: white; /* Pink bg can have white text, or black. Prompt said "Lime green... hard to see". Pink+White is usually ok-ish but Pink+Black is standard brutalist. User didn't complain about warning box yet, but let's stick to user request for now. */
        }
    }
}
</style>
