import { ref, onUnmounted } from 'vue'

export function useToneGenerator() {
    const isPlaying = ref(false)
    const currentToneHz = ref<number | null>(null)
    const audioContext = ref<AudioContext | null>(null)

    // Map to keep track of active oscillators by frequency for manual toggling
    interface ActiveOsc {
        osc: OscillatorNode
        gain: GainNode
    }
    const activeOscillators = new Map<number, ActiveOsc>()

    function initContext() {
        if (!audioContext.value) {
            audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
    }

    function stopTone(hz?: number) {
        if (hz !== undefined) {
            const active = activeOscillators.get(hz)
            if (active) {
                active.osc.stop()
                active.osc.disconnect()
                activeOscillators.delete(hz)
            }
        } else {
            // Stop everything
            activeOscillators.forEach(active => {
                active.osc.stop()
                active.osc.disconnect()
            })
            activeOscillators.clear()
        }

        isPlaying.value = activeOscillators.size > 0
        if (!isPlaying.value) currentToneHz.value = null
    }

    function playTone(hz: number, duration?: number) {
        initContext()
        const ctx = audioContext.value!

        // Toggle behavior for manual tuning buttons
        if (!duration && activeOscillators.has(hz)) {
            stopTone(hz)
            return
        }

        // If playing single tone mode (manual tuner), stop others?
        // Instructions for Tuner view says toggle off other tones if another is clicked.
        // Actually, previous behavior stopped others. Let's keep that for single playTone calls.
        if (!duration) {
            stopTone()
        }

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(hz, ctx.currentTime)

        // Simple ADSR envelope for cleaner sound
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)

        if (duration) {
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
            osc.stop(ctx.currentTime + duration)
            osc.onended = () => {
                osc.disconnect()
                gain.disconnect()
                activeOscillators.delete(hz)
                isPlaying.value = activeOscillators.size > 0
            }
        }

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start()
        activeOscillators.set(hz, { osc, gain })
        isPlaying.value = true
        currentToneHz.value = hz
    }

    function strum(frequencies: number[]) {
        initContext()
        const ctx = audioContext.value!
        const strumDelay = 0.05 // 50ms per string

        frequencies.forEach((hz, index) => {
            const startTime = ctx.currentTime + (index * strumDelay)
            const duration = 1.5

            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = 'sawtooth'
            osc.frequency.setValueAtTime(hz, startTime)

            gain.gain.setValueAtTime(0, startTime)
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05)
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.start(startTime)
            osc.stop(startTime + duration)

            osc.onended = () => {
                osc.disconnect()
                gain.disconnect()
            }
        })
    }

    onUnmounted(() => {
        stopTone()
        if (audioContext.value) {
            audioContext.value.close()
            audioContext.value = null
        }
    })

    return {
        isPlaying,
        currentToneHz,
        playTone,
        stopTone,
        strum
    }
}
