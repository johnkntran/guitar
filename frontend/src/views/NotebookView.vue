<script setup lang="ts">
import { useNotebookStore, type FavoriteChord } from '../stores/notebook'
import { useGuitarStore, TUNINGS } from '../stores/guitar'
import { useRouter } from 'vue-router'

const notebook = useNotebookStore()
const guitarStore = useGuitarStore()
const router = useRouter()

function restoreFavorite(favorite: FavoriteChord) {
    // Set tuning if it exists in favorite
    if (favorite.tuningName && TUNINGS[favorite.tuningName]) {
        guitarStore.setTuning(TUNINGS[favorite.tuningName]!)
    }

    guitarStore.selectedPositions = JSON.parse(JSON.stringify(favorite.positions))
    guitarStore.identify()
    router.push('/analyzer')
}

function deleteFavorite(id: string) {
    if (confirm('Are you sure you want to delete this chord?')) {
        notebook.removeFavorite(id)
    }
}

function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleDateString()
}
</script>

<template>
  <div class="notebook-view">
    <div class="header neo-box">
        <h2>CHORD NOTEBOOK</h2>
        <p>Your collection of saved voicings and shapes. Now supporting alternative tunings!</p>
    </div>

    <div class="empty-state neo-box" v-if="notebook.favorites.length === 0">
        <p>You haven't saved any chords yet. Use the ❤️ icon in the Analyzer to save a chord!</p>
    </div>

    <div class="favorites-grid" v-else>
        <div v-for="fav in notebook.favorites" :key="fav.id" class="fav-card neo-box">
            <div class="card-header">
                <input
                    type="text"
                    v-model="fav.customName"
                    :placeholder="fav.name"
                    class="name-input"
                    @blur="notebook.updateCustomName(fav.id, fav.customName || '')"
                >
                <div class="header-actions">
                    <span class="tuning-tag" v-if="fav.tuningName">{{ fav.tuningName }}</span>
                    <button class="delete-btn" @click="deleteFavorite(fav.id)">🗑️</button>
                </div>
            </div>

            <div class="chord-info">
                <span class="original-name">{{ fav.name }}</span>
                <span class="date">{{ formatDate(fav.createdAt) }}</span>
            </div>

            <div class="positions-list">
                <div v-for="(pos, i) in fav.positions" :key="i" class="pos-tag">
                    S{{ 6 - pos.string }}: F{{ pos.fret }} ({{ pos.note }})
                </div>
            </div>

            <button class="neo-button restore-btn" @click="restoreFavorite(fav)">
                RESTORE TO BOARD 🎸
            </button>
        </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.notebook-view {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.header {
    background: var(--color-quaternary);
    padding: 1rem 2rem;
    h2 { margin: 0; font-family: var(--font-heading); }
    p { margin: 0; }
}

.empty-state {
    padding: 3rem;
    text-align: center;
    font-size: 1.2rem;
    background: white;
}

.favorites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.fav-card {
    background: white;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.tuning-tag {
    background: var(--color-quaternary);
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
    border: 1px solid black;
    font-weight: bold;
    white-space: nowrap;
}

.name-input {
    flex: 1;
    border: none;
    border-bottom: 2px solid var(--color-border);
    font-family: var(--font-heading);
    font-size: 1.2rem;
    padding: 0.2rem;
    &:focus { outline: none; border-color: var(--color-primary); }
}

.delete-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    &:hover { transform: scale(1.1); }
}

.chord-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #666;
}

.positions-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.pos-tag {
    background: #f0f0f0;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-family: monospace;
}

.restore-btn {
    margin-top: auto;
    width: 100%;
    background: var(--color-tertiary);
}

@media (max-width: 600px) {
    .favorites-grid {
        grid-template-columns: 1fr;
    }
}
</style>
