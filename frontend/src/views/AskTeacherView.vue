<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { marked } from 'marked'

interface Message {
    role: 'system' | 'user' | 'assistant'
    content: string
}

const messages = ref<Message[]>([
    {
        role: 'system',
        content: 'You are a professor of music theory. Frame your responses in the context of answering a guitar student.'
    }
])

const userInput = ref('')
const isLoading = ref(false)
const chatContainer = ref<HTMLElement | null>(null)

// Configure marked for safe links and line breaks
marked.setOptions({
    breaks: true,
    gfm: true
})

const scrollToBottom = async () => {
    await nextTick()
    if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
}

const sendMessage = async () => {
    if (!userInput.value.trim() || isLoading.value) return

    const userMessage = userInput.value.trim()
    messages.value.push({ role: 'user', content: userMessage })
    userInput.value = ''
    isLoading.value = true

    await scrollToBottom()

    try {
        const response = await fetch('/api/llm/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: messages.value })
        })

        if (!response.ok) throw new Error('Network response was not ok')

        const data = await response.json()
        const updatedMessages = data.messages as Message[]

        if (updatedMessages.length > 0) {
            const lastMessage = updatedMessages[updatedMessages.length - 1]
            if (lastMessage?.content.startsWith('BadRequestError')) {
                console.error('LLM Error:', lastMessage.content)
                alert('LLM Error: There was an issue processing your request. Please check the console for details.')
            } else {
                messages.value = updatedMessages
            }
        }
    } catch (error) {
        console.error('Error:', error)
        alert('An error occurred while communicating with the teacher.')
    } finally {
        isLoading.value = false
        await scrollToBottom()
    }
}

const renderMarkdown = (content: string) => {
    return marked.parse(content)
}

onMounted(() => {
    scrollToBottom()
})
</script>

<template>
  <div class="teacher-view">
    <div class="neo-box info-header">
        <h2>TEACHER</h2>
        <p>Ask your questions about music theory or guitar technique.</p>
    </div>

    <div class="chat-container neo-box" ref="chatContainer">
        <div v-for="(msg, index) in messages" :key="index">
            <div v-if="msg.role !== 'system'" :class="['message', msg.role]">
                <div class="message-label">{{ msg.role.toUpperCase() }}</div>
                <div class="message-bubble" v-html="renderMarkdown(msg.content)"></div>
            </div>
        </div>
        <div v-if="isLoading" class="message assistant loading">
            <div class="message-label">ASSISTANT</div>
            <div class="message-bubble">Thinking...</div>
        </div>
    </div>

    <div class="input-area neo-box">
        <textarea
            v-model="userInput"
            placeholder="How do I play a Cmaj7 chord?"
            @keyup.enter.exact.prevent="sendMessage"
        ></textarea>
        <button class="neo-button" @click="sendMessage" :disabled="isLoading">
            {{ isLoading ? '...' : 'ASK' }}
        </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.teacher-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    height: calc(100vh - 250px);
    min-height: 500px;
}

.info-header {
    background: var(--color-quaternary);
    h2 { margin: 0; font-family: var(--font-heading); font-size: 2rem; }
    p { margin: 0.5rem 0 0; }
}

.chat-container {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    background: white;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.message {
    display: flex;
    flex-direction: column;
    max-width: 85%;

    &.user {
        align-self: flex-end;
        .message-bubble {
            background: var(--color-primary);
            color: white;
            border-radius: 12px 12px 0 12px;
        }
        .message-label { text-align: right; }
    }

    &.assistant {
        align-self: flex-start;
        .message-bubble {
            background: #f0f0f0;
            color: black;
            border-radius: 12px 12px 12px 0;
            border: 2px solid var(--color-border);
        }
    }
}

.message-label {
    font-size: 0.75rem;
    font-weight: bold;
    margin-bottom: 0.25rem;
    color: #666;
}

.message-bubble {
    padding: 1rem;
    line-height: 1.5;
    word-break: break-word;

    :deep(p) { margin-bottom: 0.75rem; }
    :deep(p:last-child) { margin-bottom: 0; }
    :deep(code) {
        background: rgba(0,0,0,0.1);
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        font-family: monospace;
    }
    :deep(pre) {
        background: #2d2d2d;
        color: #f8f8f2;
        padding: 1rem;
        border-radius: 8px;
        overflow-x: auto;
        margin: 1rem 0;
    }
    :deep(ul), :deep(ol) { margin-left: 1.5rem; margin-bottom: 0.75rem; }
}

.input-area {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-tertiary);

    textarea {
        flex: 1;
        border: 2px solid var(--color-border);
        padding: 0.75rem;
        font-family: inherit;
        font-size: 1rem;
        border-radius: 4px;
        resize: none;
        height: 60px;
        &:focus { outline: none; border-color: var(--color-primary); }
    }

    button {
        padding: 0 2rem;
        height: 60px;
    }
}

.loading .message-bubble {
    font-style: italic;
    color: #888;
}
</style>
