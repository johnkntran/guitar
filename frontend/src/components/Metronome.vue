<script setup lang="ts">
import { useMetronome } from '../composables/useMetronome'
import { computed } from 'vue'

const { isRunning, bpm, lastBeatTime, toggle } = useMetronome()

const isFlashing = computed(() => {
    if (!isRunning.value) return false
    const now = Date.now()
    return (now - lastBeatTime.value) < 100
})
</script>

<template>
  <div class="metronome-control neo-box" :class="{ running: isRunning }">
      <div class="beat-flash" :class="{ flash: isFlashing }"></div>

      <div class="bpm-input">
          <input
            type="number"
            v-model.number="bpm"
            min="40"
            max="300"
            @click.stop
          >
          <span>BPM</span>
      </div>

      <button class="play-btn" @click="toggle" :title="isRunning ? 'Stop Metronome' : 'Start Metronome'">
          {{ isRunning ? '⏹️' : '▶️' }}
      </button>
  </div>
</template>

<style scoped lang="scss">
.metronome-control {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.3rem 0.8rem;
    background: white;
    box-shadow: 2px 2px 0 var(--color-border);
    height: 40px;
    position: relative;
    overflow: hidden;

    &.running {
        border-color: var(--color-primary);
    }
}

.beat-flash {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #eee;
    border: 1px solid var(--color-border);
    transition: background 0.05s;

    &.flash {
        background: var(--color-primary);
        box-shadow: 0 0 10px var(--color-primary);
    }
}

.bpm-input {
    display: flex;
    align-items: center;
    gap: 0.3rem;

    input {
        width: 50px;
        border: none;
        border-bottom: 2px solid var(--color-border);
        font-family: var(--font-heading);
        font-size: 1rem;
        text-align: center;
        padding: 0;
        &:focus { outline: none; border-color: var(--color-primary); }
    }

    span {
        font-size: 0.7rem;
        font-weight: bold;
        color: #666;
    }
}

.play-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    &:hover { transform: scale(1.1); }
    &:active { transform: scale(0.9); }
}

@media (max-width: 600px) {
    .metronome-control {
        height: auto;
        padding: 0.5rem;
    }
}
</style>
