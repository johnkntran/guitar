<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTeacherStore } from '../stores/teacher'

const router = useRouter()
const teacherStore = useTeacherStore()

const FIFTHS = [
    { major: 'C', minor: 'Am', sharp: 0, flat: 0 },
    { major: 'G', minor: 'Em', sharp: 1, flat: 0 },
    { major: 'D', minor: 'Bm', sharp: 2, flat: 0 },
    { major: 'A', minor: 'F#m', sharp: 3, flat: 0 },
    { major: 'E', minor: 'C#m', sharp: 4, flat: 0 },
    { major: 'B', minor: 'G#m', sharp: 5, flat: 0 },
    { major: 'F#', minor: 'D#m', sharp: 6, flat: 0 },
    { major: 'Db', minor: 'Bbm', sharp: 0, flat: 5 },
    { major: 'Ab', minor: 'Fm', sharp: 0, flat: 4 },
    { major: 'Eb', minor: 'Cm', sharp: 0, flat: 3 },
    { major: 'Bb', minor: 'Gm', sharp: 0, flat: 2 },
    { major: 'F', minor: 'Dm', sharp: 0, flat: 1 },
]

const selectedIdx = ref(0)
const rotation = ref(0)

const selectedKey = computed(() => FIFTHS[selectedIdx.value])

function selectKey(index: number) {
    // Calculate shortest rotation
    let diff = index - selectedIdx.value
    if (diff > 6) diff -= 12
    if (diff < -6) diff += 12

    rotation.value -= diff * 30
    selectedIdx.value = index
}

async function askTeacher() {
    const key = selectedKey.value
    if (!key) return

    const prompt = `Tell me about the key of ${key.major} Major (relative minor: ${key.minor}). What are the chords in this key and what is its signature?`

    teacherStore.addMessage({ role: 'user', content: prompt })
    router.push('/ask')
}
</script>

<template>
  <div class="circle-view">
    <div class="header neo-box">
        <h2>CIRCLE OF FIFTHS</h2>
        <p>Explore harmonic relationships and key signatures.</p>
    </div>

    <div class="circle-container">
        <svg viewBox="-200 -200 400 400" @mousedown.prevent>
            <!-- Background Rings -->
            <circle r="180" fill="white" stroke="var(--color-border)" stroke-width="4" />
            <circle r="120" fill="#f9f9f9" stroke="var(--color-border)" stroke-width="2" />
            <circle r="70" fill="white" stroke="var(--color-border)" stroke-width="2" />

            <!-- Rotating Content -->
            <g :style="{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }">
                <g v-for="(item, i) in FIFTHS" :key="item.major" :transform="`rotate(${i * 30})`" @click="selectKey(i)" class="key-segment">
                    <!-- Segment Line -->
                    <line y1="-180" y2="-70" stroke="var(--color-border)" stroke-width="1" stroke-dasharray="4" />

                    <!-- Highlight if selected -->
                    <path v-if="i === selectedIdx" d="M -23,-180 A 180,180 0 0 1 23,-180 L 15,-120 A 120,120 0 0 0 -15,-120 Z" fill="var(--color-primary)" opacity="0.3" />

                    <!-- Major Text -->
                    <text y="-145" text-anchor="middle" class="major-name" :class="{ active: i === selectedIdx }">{{ item.major }}</text>
                    <!-- Minor Text -->
                    <text y="-95" text-anchor="middle" class="minor-name" :class="{ active: i === selectedIdx }">{{ item.minor }}</text>

                    <!-- Signature hint -->
                    <text y="-50" text-anchor="middle" class="signature-hint" v-if="i === selectedIdx">
                        {{ item.sharp > 0 ? item.sharp + '#' : (item.flat > 0 ? item.flat + 'b' : '♮') }}
                    </text>
                </g>
            </g>

            <!-- Fixed Center Pointer -->
            <path d="M 0,-195 L -10,-210 L 10,-210 Z" fill="var(--color-secondary)" />
        </svg>
    </div>

    <div class="info-card neo-box" v-if="selectedKey">
        <div class="card-header">
            <h3>{{ selectedKey.major }} Major / {{ selectedKey.minor }} Minor</h3>
            <button class="neo-button ask-btn" @click="askTeacher">ASK TEACHER 🎓</button>
        </div>
        <div class="card-content">
            <div class="sig-display" v-if="selectedKey">
                <span v-if="selectedKey.sharp > 0">{{ selectedKey.sharp }} SHARPS</span>
                <span v-else-if="selectedKey.flat > 0">{{ selectedKey.flat }} FLATS</span>
                <span v-else>NATURAL (NO ACCIDENTALS)</span>
            </div>
            <p class="description" v-if="selectedKey">
                This key is neighboring {{ FIFTHS[(selectedIdx + 11) % 12]?.major || '' }} and {{ FIFTHS[(selectedIdx + 1) % 12]?.major || '' }} in the circle.
            </p>
        </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.circle-view {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: center;
}

.header {
    width: 100%;
    background: var(--color-quaternary);
    padding: 1rem 2rem;
    h2 { margin: 0; font-family: var(--font-heading); }
    p { margin: 0; }
}

.circle-container {
    width: 100%;
    max-width: 500px;
    aspect-ratio: 1;
    cursor: pointer;

    svg {
        overflow: visible;
    }
}

.key-segment {
    cursor: pointer;
    &:hover {
        .major-name, .minor-name { fill: var(--color-primary); }
    }
}

.major-name {
    font-size: 24px;
    font-family: var(--font-heading);
    fill: var(--color-text);
    &.active { fill: var(--color-primary); font-weight: bold; }
}

.minor-name {
    font-size: 16px;
    font-family: var(--font-body);
    fill: #666;
    &.active { fill: var(--color-primary); font-weight: bold; }
}

.signature-hint {
    font-size: 14px;
    fill: var(--color-secondary);
}

.info-card {
    width: 100%;
    background: var(--color-box);
    padding: 1.5rem;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    h3 { margin: 0; font-family: var(--font-heading); font-size: 1.5rem; }
}

.sig-display {
    font-weight: bold;
    color: var(--color-secondary);
    margin-bottom: 0.5rem;
}

.ask-btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
}

@media (max-width: 600px) {
    .card-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }
    .major-name { font-size: 20px; }
    .minor-name { font-size: 14px; }
}
</style>
