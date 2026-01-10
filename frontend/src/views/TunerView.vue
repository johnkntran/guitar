<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAudioAnalyzer } from '../composables/useAudioAnalyzer'
import { useToneGenerator } from '../composables/useToneGenerator'

const { isListening, currentHz, startListening, stopListening } = useAudioAnalyzer()
const { playTone, currentToneHz, isPlaying } = useToneGenerator()

interface TunerResult {
    note: string
    hz: number
    perfect_hz: number
    cents: number
    octave: number
    midi: number
}

const tunerData = ref<TunerResult | null>(null)
const lastFetch = ref(0)
const needleAngle = ref(0)

const TUNING_NOTES = [
    { name: 'E2', hz: 82.41 },
    { name: 'A2', hz: 110.00 },
    { name: 'D3', hz: 146.83 },
    { name: 'G3', hz: 196.00 },
    { name: 'B3', hz: 246.94 },
    { name: 'E4', hz: 329.63 }
]

// Create a throttled/debounced fetch
watch(currentHz, async (newHz) => {
    if (!newHz) return

    // Throttle to avoid network spam (e.g. every 100ms)
    const now = Date.now()
    if (now - lastFetch.value < 100) return

    try {
        const res = await fetch(`/api/tuner/analyze?hz=${newHz}`)
        if (res.ok) {
            const data = await res.json()
            if (data && data.note) {
                 tunerData.value = data
                 lastFetch.value = now

                 // Calculate needle angle based on cents (-50 to +50 cents -> -45deg to +45deg)
                 // Cents range is theoretically +/- 50 for next note.
                 // Clamp cents -50 to 50
                 const clampedCents = Math.max(-50, Math.min(50, data.cents))
                 needleAngle.value = (clampedCents / 50) * 45
            }
        }
    } catch (e) {
        console.error(e)
    }
})

function toggleMic() {
    if (isListening.value) {
        stopListening()
        tunerData.value = null
        needleAngle.value = 0
    } else {
        startListening()
    }
}
</script>

<template>
  <div class="tuner-view neo-box">
    <div class="tuner-header">
         <h2>CHROMATIC TUNER</h2>
         <button @click="toggleMic" class="neo-button">
            {{ isListening ? 'STOP MIC' : 'START MIC' }}
         </button>
    </div>

    <div class="gauge-container">
        <!-- SVG Gauge -->
        <svg viewBox="0 0 300 150" class="gauge">
            <!-- Background Arc -->
            <path d="M 30 130 A 100 100 0 0 1 270 130" fill="none" stroke="#ddd" stroke-width="10" stroke-linecap="round" />

            <!-- Sweet Spot (Center) Warning/Success Colors -->
            <!-- -10 to +10 cents is acceptable 'green' zone usually. -->
            <!-- Arc logic is complex manually, simpler: visually indicate center. -->
            <line x1="150" y1="30" x2="150" y2="50" stroke="var(--color-tertiary)" stroke-width="8" />

            <!-- Needle -->
            <!-- Height 130. Pivot at (150, 130) roughly. Needle length ~100. -->
            <g :transform="`rotate(${needleAngle}, 150, 130)`" class="needle-group">
                <line x1="150" y1="130" x2="150" y2="40" stroke="var(--color-border)" stroke-width="4" stroke-linecap="round" />
                <circle cx="150" cy="130" r="8" fill="var(--color-border)" />
            </g>

            <!-- Labels -->
            <text x="50" y="145" class="gauge-label">-50</text>
            <text x="150" y="145" class="gauge-label">0</text>
            <text x="250" y="145" class="gauge-label">+50</text>
        </svg>

        <div class="info-display" v-if="tunerData">
            <h1 class="main-note" :class="{ 'in-tune': Math.abs(tunerData.cents) < 5 }">
                {{ tunerData.note }}
            </h1>
            <div class="stats">
                <p>{{ tunerData.hz.toFixed(1) }} Hz</p>
                <p>{{ tunerData.cents > 0 ? '+' : '' }}{{ tunerData.cents.toFixed(1) }} cents</p>
            </div>
            <p class="perfect-hint">Target: {{ tunerData.perfect_hz.toFixed(1) }} Hz</p>
        </div>
        <div class="info-display placeholder" v-else>
            <p>Pluck a string...</p>
        </div>
    </div>

    <div class="manual-tuning">
        <h3>MANUAL TUNING REFERENCE</h3>
        <div class="tone-buttons">
            <button
                v-for="tone in TUNING_NOTES"
                :key="tone.name"
                class="neo-button tone-btn"
                :class="{ active: isPlaying && currentToneHz === tone.hz }"
                @click="playTone(tone.hz)"
            >
                {{ tone.name }}
            </button>
        </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tuner-view {
    text-align: center;
    padding: 2rem;
    min-height: 400px;
}

.manual-tuning {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 4px solid var(--color-border);

    h3 {
        font-family: var(--font-heading);
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
    }
}

.tone-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
}

.tone-btn {
    min-width: 60px;

    &.active {
        background: var(--color-secondary);
        transform: translate(2px, 2px);
        box-shadow: 2px 2px 0 var(--color-border);
    }
}

.tuner-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1rem;

    @media (max-width: 600px) {
        flex-direction: column;
        align-items: stretch;
    }

    h2 {
        margin: 0;
        font-family: var(--font-heading);
        font-size: 2rem;
        @media (max-width: 600px) {
            font-size: 1.5rem;
        }
    }
}

.gauge-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.gauge {
    width: 100%;
    max-width: 400px;
    height: auto;
}

.needle-group {
    transition: transform 0.1s ease-out; /* Smooth needle movement */
}

.gauge-label {
    font-size: 12px;
    fill: #666;
    text-anchor: middle;
    font-family: monospace;
}

.info-display {
    text-align: center;
}

.main-note {
    font-size: 5rem;
    font-family: var(--font-heading);
    margin: 0;
    line-height: 1;
    color: var(--color-text);

    @media (max-width: 600px) {
        font-size: 3.5rem;
    }

    &.in-tune {
        color: var(--color-tertiary); /* Green when in tune! */
        text-shadow: 2px 2px 0 var(--color-border);
    }
}

.stats {
    display: flex;
    gap: 1rem;
    justify-content: center;
    font-family: var(--font-body);
    font-weight: bold;
    font-size: 1.2rem;
}

.placeholder {
    font-family: var(--font-body);
    color: #888;
    margin-top: 2rem;
}
</style>
