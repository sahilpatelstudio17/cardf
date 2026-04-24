<template>
  <div class="ai-widget" :class="{ open: isOpen }">
    <div v-if="!isOpen" class="launcher-wrap">
      <!-- <div class="ai-hint">Need help with booking?</div> -->
      <button
        class="ai-launcher"
        type="button"
        aria-label="Open AI assistant"
        @click="isOpen = true"
      >
        <span class="sparkle" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path
              d="M12 2.5l1.7 4.5 4.8 1.7-4.8 1.7-1.7 4.8-1.7-4.8L5.5 8.7l4.8-1.7L12 2.5zm6.3 9.8l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3zM6.2 13.6l1.1 2.9 2.9 1.1-2.9 1.1-1.1 2.9-1.1-2.9-2.9-1.1 2.9-1.1 1.1-2.9z"
              fill="currentColor"
            />
          </svg>
        </span>
        <!-- <span class="label-group"> -->
          <!-- <span class="label">AI Bot</span>
          <small>CarSwap</small> -->
        <!-- </span> -->
        <!-- <span class="arrow" aria-hidden="true">▾</span> -->
      </button>
    </div>

    <div v-else class="ai-panel" role="dialog" aria-label="AI assistant">
      <header class="ai-panel-header">
        <div class="header-left">
          <span class="dot"></span>
          <strong>CarSwap AI</strong>
        </div>
        <button
          class="close-btn"
          type="button"
          aria-label="Close AI assistant"
          @click="isOpen = false"
        >
          ×
        </button>
      </header>

      <div class="ai-messages" ref="messagesRef">
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="['message', message.role]"
        >
          {{ message.text }}
        </div>
      </div>

      <form class="ai-input-row" @submit.prevent="sendMessage">
        <input
          v-model="draft"
          type="text"
          placeholder="Ask about cars, subscriptions, or swap process"
          aria-label="Message AI assistant"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue'

const isOpen = ref(false)
const draft = ref('')
const messagesRef = ref(null)

const messages = ref([
  {
    role: 'bot',
    text: 'Hi, I am CarSwap AI. I can help you with subscriptions, listings, and swapping steps.'
  }
])

const getReply = (text) => {
  const normalized = text.toLowerCase()

  if (normalized.includes('price') || normalized.includes('cost') || normalized.includes('subscription')) {
    return 'You can compare Basic, Premium, and Luxury subscriptions on the Subscription page. I can explain the differences if you want.'
  }

  if (normalized.includes('swap') || normalized.includes('exchange')) {
    return 'To swap a car, open the Swap page, submit your car details, and we will match you with available options.'
  }

  if (normalized.includes('contact') || normalized.includes('support') || normalized.includes('help')) {
    return 'You can reach support from the Contact page. Share your booking ID or registered email for faster help.'
  }

  if (normalized.includes('car') || normalized.includes('listing') || normalized.includes('sell')) {
    return 'Visit the Cars page to browse listings. If you want to list your own car, create an account and use the listing form.'
  }

  return 'I can help with subscriptions, swapping, listings, and support. Ask me a specific question and I will guide you.'
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const sendMessage = async () => {
  const text = draft.value.trim()
  if (!text) return

  messages.value.push({ role: 'user', text })
  draft.value = ''
  await scrollToBottom()

  setTimeout(async () => {
    messages.value.push({ role: 'bot', text: getReply(text) })
    await scrollToBottom()
  }, 300)
}
</script>

<style scoped>
.ai-widget {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 1300;
}

.launcher-wrap {
  display: grid;
  justify-items: end;
  gap: 7px;
}

.ai-hint {
  background: #111827;
  color: #f9fafb;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 6px 9px;
  border-radius: 9px;
  box-shadow: 0 7px 18px rgba(15, 23, 42, 0.24);
  animation: floatHint 2.8s ease-in-out infinite;
}

.ai-launcher {
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #ff5722 0%, #ff3d00 100%);
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 9px 12px;
  box-shadow: 0 12px 28px rgba(255, 87, 34, 0.36);
  cursor: pointer;
  font-weight: 700;
  letter-spacing: 0.15px;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.ai-launcher:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 32px rgba(255, 87, 34, 0.42);
}

.sparkle {
  width: 25px;
  height: 25px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.16);
}

.sparkle svg {
  width: 14px;
  height: 14px;
}

.label-group {
  display: grid;
  line-height: 1;
}

.label {
  font-size: 0.94rem;
}

.label-group small {
  margin-top: 2px;
  font-size: 0.62rem;
  opacity: 0.9;
  letter-spacing: 0.35px;
  text-transform: uppercase;
}

.arrow {
  font-size: 0.76rem;
  opacity: 0.88;
  padding-top: 1px;
}

.ai-panel {
  width: min(360px, calc(100vw - 22px));
  border-radius: 15px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 20px 44px rgba(15, 23, 42, 0.26);
  border: 1px solid #eceff2;
  animation: panelIn 0.2s ease-out;
}

.ai-panel-header {
  background: linear-gradient(110deg, #0f172a 0%, #17243b 58%, #553022 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 13px;
  border-bottom: 3px solid #ff5722;
}

.header-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dot {
  position: relative;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: radial-gradient(circle at 32% 30%, #7cf3ab 0%, #22c55e 58%, #15803d 100%);
  box-shadow:
    0 0 0 3px rgba(34, 197, 94, 0.18),
    0 0 10px rgba(34, 197, 94, 0.32);
}

.dot::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid rgba(34, 197, 94, 0.35);
  opacity: 0.7;
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  border: 0;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  cursor: pointer;
  opacity: 1;
  font-size: 1rem;
  line-height: 1;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, transform 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-1px);
}

.ai-messages {
  height: 410px;
  padding: 12px;
  overflow-y: auto;
  background:
    radial-gradient(circle at top right, rgba(255, 87, 34, 0.09), transparent 44%),
    radial-gradient(circle at bottom left, rgba(15, 23, 42, 0.05), transparent 52%),
    #f8fafc;
}

.message {
  margin-bottom: 9px;
  max-width: 90%;
  padding: 10px 12px;
  border-radius: 13px;
  font-size: 0.9rem;
  line-height: 1.42;
}

.message.bot {
  background: #ffffff;
  color: #0f172a;
  border: 1px solid #e4e9ef;
}

.message.user {
  margin-left: auto;
  background: linear-gradient(135deg, #ff5722 0%, #ff3d00 100%);
  color: #fff;
}

.ai-input-row {
  display: flex;
  gap: 7px;
  padding: 10px;
  border-top: 1px solid #ebedf0;
  background: #ffffff;
}

.ai-input-row input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px;
  outline: none;
}

.ai-input-row input:focus {
  border-color: #ff5722;
  box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.15);
}

.ai-input-row button {
  border: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff5722 0%, #ff3d00 100%);
  color: #fff;
  padding: 10px 12px;
  font-weight: 600;
  cursor: pointer;
  min-width: 64px;
}

.ai-input-row button:hover {
  filter: brightness(0.97);
}

@keyframes panelIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes floatHint {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

@media (max-width: 600px) {
  .ai-widget {
    right: 10px;
    bottom: 12px;
  }

  .ai-hint {
    display: none;
  }

  .ai-launcher {
    padding: 9px 11px;
  }

  .ai-panel {
    width: calc(100vw - 16px);
    border-radius: 14px;
  }

  .ai-messages {
    height: min(45vh, 285px);
  }
}
</style>