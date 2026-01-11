<script setup lang="ts">
import { useGuitarStore } from '../stores/guitar'
import { useNotebookStore } from '../stores/notebook'
import { useTeacherStore } from '../stores/teacher'
import { useRouter } from 'vue-router'
import Fretboard from '../components/Fretboard.vue'
import Controls from '../components/Controls.vue'

const store = useGuitarStore()
const notebook = useNotebookStore()
const teacherStore = useTeacherStore()
const router = useRouter()

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

function askTeacher() {
    let prompt = "I'm working with "

    if (store.currentChord?.primary) {
        prompt += `a ${store.currentChord.primary.name} chord `
    } else {
        prompt += "some notes on the fretboard "
    }

    prompt += `in ${store.currentTuning.name} tuning. `

    if (store.isScaleEnabled) {
        prompt += `I also have the ${store.selectedScaleRoot} ${store.selectedScaleType} scale overlay enabled. `
        prompt += "How does this chord relate to this scale, and what are some good soloing ideas or transitions I can try?"
    } else {
        prompt += "What scales would work well for soloing over this, and can you explain the theory behind it?"
    }

    teacherStore.addMessage({
        role: 'user',
        content: prompt
    })
    router.push('/ask')
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
                <div class="result-actions">
                    <button class="teacher-btn" @click="askTeacher" title="Ask Teacher about this">👨‍🏫</button>
                    <button
                       class="favorite-btn"
                       :class="{ active: notebook.isFavorited(store.selectedPositions, store.currentTuning.name) }"
                       @click="toggleFavorite"
                       title="Add to Notebook"
                    >
                        {{ notebook.isFavorited(store.selectedPositions, store.currentTuning.name) ? '❤️' : '🤍' }}
                    </button>
                </div>
            </div>
            <p v-if="store.currentChord.alternatives?.length">
                Also: <span v-for="(alt, index) in store.currentChord.alternatives" :key="alt.name">
                    {{ alt.name }}{{ index < store.currentChord.alternatives.length - 1 ? ', ' : '' }}
                </span>
            </p>
        </div>
        <div class="neo-box result warning" v-else-if="store.currentChord?.found === false">
            <div class="result-header">
                <h2>NO CHORD</h2>
                <button class="teacher-btn" @click="askTeacher" title="Ask Teacher why">👨‍🏫</button>
            </div>
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

        .result-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .teacher-btn, .favorite-btn {
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
