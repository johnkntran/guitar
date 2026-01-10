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
            content: 'You are a professor of music theory. Frame your responses in the context of answering a guitar student.'
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
