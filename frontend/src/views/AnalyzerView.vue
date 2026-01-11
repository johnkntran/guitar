<script setup lang="ts">
import { useGuitarStore } from '../stores/guitar'
import { useNotebookStore } from '../stores/notebook'
import Fretboard from '../components/Fretboard.vue'
import Controls from '../components/Controls.vue'

const store = useGuitarStore()
const notebook = useNotebookStore()

function toggleFavorite() {
    if (!store.currentChord?.primary) return

    const tuningName = store.currentTuning.name
    if (notebook.isFavorited(store.selectedPositions, tuningName)) {
        const id = notebook.getFavoriteIdByPositions(store.selectedPositions, tuningName)
        if (id) notebook.removeFavorite(id)
    } else {
        notebook.addFavorite(store.currentChord.primary.name, store.selectedPositions, tuningName)
    }
}
</script>

<template>
  <div class="analyzer-view">
      <div class="fretboard-container neo-box">
        <Fretboard />
      </div>

      <div class="results-container" v-if="store.currentChord || store.selectedPositions.length > 0">
        <div class="neo-box result" v-if="store.currentChord?.found">
            <div class="result-header">
                <h2>{{ store.currentChord.primary?.name }}</h2>
                <button
                   class="favorite-btn"
                   :class="{ active: notebook.isFavorited(store.selectedPositions, store.currentTuning.name) }"
                   @click="toggleFavorite"
                   title="Add to Notebook"
                >
                    {{ notebook.isFavorited(store.selectedPositions, store.currentTuning.name) ? '❤️' : '🤍' }}
                </button>
            </div>
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

        .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        .favorite-btn {
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            padding: 0;
            transition: transform 0.2s;
            &:hover { transform: scale(1.2); }
            &:active { transform: scale(0.9); }
        }

        h2 {
            margin: 0;
            font-size: 2rem;
            font-family: var(--font-heading);
            @media (max-width: 600px) {
                font-size: 1.5rem;
            }
        }
        &.warning {
            background: var(--color-secondary);
            color: white;
        }
    }
}
</style>
