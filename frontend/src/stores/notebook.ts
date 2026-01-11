import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface FavoriteChord {
    id: string
    name: string
    customName?: string
    tuningName: string
    positions: Array<{
        string: number
        fret: number
        note: string
    }>
    createdAt: number
}

export const useNotebookStore = defineStore('notebook', () => {
    const favorites = ref<FavoriteChord[]>(
        JSON.parse(localStorage.getItem('chord_coordinator_favorites') || '[]')
    )

    // Persist to localStorage whenever favorites change
    watch(favorites, (newVal) => {
        localStorage.setItem('chord_coordinator_favorites', JSON.stringify(newVal))
    }, { deep: true })

    function addFavorite(name: string, positions: FavoriteChord['positions'], tuningName: string) {
        const id = crypto.randomUUID()
        favorites.value.push({
            id,
            name,
            tuningName,
            positions: JSON.parse(JSON.stringify(positions)), // Deep copy
            createdAt: Date.now()
        })
    }

    function removeFavorite(id: string) {
        const index = favorites.value.findIndex(f => f.id === id)
        if (index !== -1) {
            favorites.value.splice(index, 1)
        }
    }

    function updateCustomName(id: string, customName: string) {
        const favorite = favorites.value.find(f => f.id === id)
        if (favorite) {
            favorite.customName = customName
        }
    }

    function isFavorited(positions: FavoriteChord['positions'], tuningName: string) {
        // Simple heuristic: same set of string/fret pairs AND same tuning
        const posString = (pos: FavoriteChord['positions']) =>
            pos.map(p => `${p.string}-${p.fret}`).sort().join('|')

        const currentString = posString(positions)
        return favorites.value.some(f => f.tuningName === tuningName && posString(f.positions) === currentString)
    }

    function getFavoriteIdByPositions(positions: FavoriteChord['positions'], tuningName: string) {
        const posString = (pos: FavoriteChord['positions']) =>
            pos.map(p => `${p.string}-${p.fret}`).sort().join('|')

        const currentString = posString(positions)
        return favorites.value.find(f => f.tuningName === tuningName && posString(f.positions) === currentString)?.id
    }

    return {
        favorites,
        addFavorite,
        removeFavorite,
        updateCustomName,
        isFavorited,
        getFavoriteIdByPositions
    }
})
