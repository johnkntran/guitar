import { ref, onUnmounted } from 'vue'

export function useAudioAnalyzer() {
    const isListening = ref(false)
    const currentHz = ref<number | null>(null)
    const audioContext = ref<AudioContext | null>(null)
    let analyser: AnalyserNode | null = null
    let microphoneStream: MediaStream | null = null
    let animationFrameId: number | null = null

    // Better, standard Autocorrelation (Time Domain)
    function performAutocorrelation(buffer: Float32Array, sampleRate: number): number {
        // Size of buffer
        const SIZE = buffer.length

        // Calculate RMS (Root Mean Square) to detect silence
        let rms = 0;
        for (let i = 0; i < SIZE; i++) {
            const val = buffer[i] || 0
            rms += val * val
        }
        rms = Math.sqrt(rms / SIZE)
        if (rms < 0.02) return -1 // Too quiet

        // Autocorrelation
        // Only verify first half of correlations to find period
        let bestOffset = -1
        let maxCorrelation = 0

        // Optimization: Don't check every single offset.
        // Guitar Low E ~82Hz. SampleRate 44100. Period ~537 samples.
        // High E ~330Hz (Open). Period ~133 samples.
        // Range 0 - 1000 should cover it.

        for (let offset = 40; offset < SIZE / 2; offset++) {
            let correlation = 0
            for (let i = 0; i < SIZE / 2; i++) {
                const a = buffer[i] || 0
                const b = buffer[i + offset] || 0
                correlation += a * b
            }

            if (correlation > maxCorrelation) {
                maxCorrelation = correlation
                bestOffset = offset
            }
        }

        if (maxCorrelation > 0.01 && bestOffset > -1) {
            // Refinement with parabolic interpolation could happen here
            return sampleRate / bestOffset
        }

        return -1
    }


    async function startListening() {
        try {
            audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
            microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true })

            const source = audioContext.value!.createMediaStreamSource(microphoneStream)
            analyser = audioContext.value!.createAnalyser()
            analyser.fftSize = 2048 // Good resolution for time domain
            source.connect(analyser)

            isListening.value = true
            detectPitch()
        } catch (e) {
            console.error("Mic access denied or error", e)
            isListening.value = false
        }
    }

    function stopListening() {
        if (microphoneStream) {
            microphoneStream.getTracks().forEach(track => track.stop())
        }
        if (audioContext.value) {
            audioContext.value.close()
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId)
        }
        isListening.value = false
        currentHz.value = null
    }

    function detectPitch() {
        if (!analyser || !isListening.value) return

        const buffer = new Float32Array(analyser.fftSize)
        analyser.getFloatTimeDomainData(buffer)

        // Use the simplified autocorrelate (Note: AutoCorrelate logic above was mixed, sticking to simpler one)
        const hz = performAutocorrelation(buffer, audioContext.value!.sampleRate)

        if (hz > 0) {
            // Smoothing?
            currentHz.value = hz
        }

        animationFrameId = requestAnimationFrame(detectPitch)
    }

    onUnmounted(() => {
        stopListening()
    })

    return {
        isListening,
        currentHz,
        startListening,
        stopListening
    }
}
