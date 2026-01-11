import { ref, watch, onUnmounted } from 'vue'

export function useMetronome() {
    const isRunning = ref(false)
    const bpm = ref(Number(localStorage.getItem('metronome_bpm')) || 120)
    const beatCount = ref(0)
    const lastBeatTime = ref(0)

    let audioContext: AudioContext | null = null
    let nextNoteTime = 0
    let timerID: number | null = null
    const scheduleAheadTime = 0.1 // How far ahead to schedule audio (sec)
    const lookahead = 25.0 // How frequently to call scheduling function (ms)

    watch(bpm, (newBpm) => {
        localStorage.setItem('metronome_bpm', newBpm.toString())
    })

    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
    }

    function scheduleNote(beatNumber: number, time: number) {
        if (!audioContext) return

        const osc = audioContext.createOscillator()
        const envelope = audioContext.createGain()

        // High pitch for beat 1, lower for others (4/4 assumption for basic accent)
        osc.frequency.value = beatNumber % 4 === 0 ? 1000 : 800

        envelope.gain.value = 1
        envelope.gain.exponentialRampToValueAtTime(1, time + 0.001)
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1)

        osc.connect(envelope)
        envelope.connect(audioContext.destination)

        osc.start(time)
        osc.stop(time + 0.1)

        // For visual flash
        setTimeout(() => {
            beatCount.value = beatNumber
            lastBeatTime.value = Date.now()
        }, (time - audioContext.currentTime) * 1000)
    }

    function scheduler() {
        if (!audioContext) return
        while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
            scheduleNote(beatCount.value, nextNoteTime)
            const secondsPerBeat = 60.0 / bpm.value
            nextNoteTime += secondsPerBeat
            beatCount.value++
        }
        timerID = window.setTimeout(scheduler, lookahead)
    }

    function toggle() {
        initAudio()
        isRunning.value = !isRunning.value

        if (isRunning.value) {
            if (audioContext?.state === 'suspended') {
                audioContext.resume()
            }
            beatCount.value = 0
            nextNoteTime = audioContext!.currentTime
            scheduler()
        } else {
            if (timerID) window.clearTimeout(timerID)
        }
    }

    onUnmounted(() => {
        if (timerID) window.clearTimeout(timerID)
    })

    return {
        isRunning,
        bpm,
        beatCount,
        lastBeatTime,
        toggle
    }
}
