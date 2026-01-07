import { ref, onUnmounted } from 'vue'

export function useToneGenerator() {
    const isPlaying = ref(false)
    const currentToneHz = ref<number | null>(null)
    const audioContext = ref<AudioContext | null>(null)
    let oscillator: OscillatorNode | null = null
    let gainNode: GainNode | null = null

    function stopTone() {
        if (oscillator) {
            try {
                oscillator.stop()
                oscillator.disconnect()
            } catch (e) {
                // Ignore if already stopped
            }
            oscillator = null
        }
        isPlaying.value = false
        currentToneHz.value = null
    }

    // Wait, I referenced currentHz above but defined currentToneHz.
    // Let me correct that in the implementation below.

    function playTone(hz: number) {
        // If already playing this tone, stop it (toggle off)
        if (isPlaying.value && currentToneHz.value === hz) {
            stopTone()
            return
        }

        // If playing another tone, stop it first
        if (isPlaying.value) {
            stopTone()
        }

        // Init AudioContext if needed
        if (!audioContext.value) {
            audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
        }

        // Create Oscillator
        oscillator = audioContext.value!.createOscillator()
        oscillator.type = 'sine' // tailored for simple tuning tone
        oscillator.frequency.value = hz

        // Create Gain Node (Volume control)
        gainNode = audioContext.value!.createGain()
        gainNode.gain.value = 0.5 // 50% volume to not blast ears

        // Connect: Osc -> Gain -> Destination
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.value!.destination)

        oscillator.start()
        isPlaying.value = true
        currentToneHz.value = hz
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
        stopTone
    }
}
