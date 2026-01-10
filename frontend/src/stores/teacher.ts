import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Message {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export const useTeacherStore = defineStore('teacher', () => {
    const messages = ref<Message[]>([
        {
            role: 'system',
            content: 'If the user asks to generate lyrics for a song, assume the persona of a record producer and songwriter. Otherwise, assume the persona of a music theory professor and frame your responses for a guitar student.'
        }
    ])

    function addMessage(msg: Message) {
        messages.value.push(msg)
    }

    function setMessages(msgs: Message[]) {
        messages.value = msgs
    }

    return {
        messages,
        addMessage,
        setMessages
    }
})
