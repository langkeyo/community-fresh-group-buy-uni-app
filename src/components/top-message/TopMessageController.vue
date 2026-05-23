<script setup lang="ts">
import { APP_TOP_MESSAGE_EVENT, type AppToastPayload, type AppToastType } from '@/utils/notify'
import { computed, onMounted, onUnmounted, ref } from 'vue'
const PENDING_TOP_MESSAGE_KEY = '__pendingTopMessages'

const visible = ref(false)
const message = ref('')
const messageType = ref<AppToastType>('info')
const icon = ref('')
const expandable = ref(false)
const maxLines = ref<1 | 2 | 3>(1)
const queue = ref<AppToastPayload[]>([])
let timer: ReturnType<typeof setTimeout> | null = null

const topOffsetPx = computed(() => {
  const safeTop = Number(uni.getSystemInfoSync().statusBarHeight || 0)
  return safeTop + 8
})

const playNext = () => {
  if (!queue.value.length) {
    visible.value = false
    return
  }
  const next = queue.value.shift()!
  message.value = next.content || next.title || '提示'
  messageType.value = (next.type || 'info') as AppToastType
  icon.value = String(next.icon || '')
  expandable.value = Boolean(next.expandable)
  maxLines.value = next.maxLines === 3 ? 3 : next.maxLines === 2 ? 2 : 1
  visible.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    visible.value = false
    setTimeout(() => playNext(), 140)
  }, Number(next.duration || 2200))
}

const enqueue = (payload: AppToastPayload) => {
  queue.value.push(payload)
  if (!visible.value) {
    playNext()
  }
}

onMounted(() => {
  ;(uni as any).__topMessageReady = true
  uni.$on(APP_TOP_MESSAGE_EVENT, enqueue)
  const pending = (uni as any)[PENDING_TOP_MESSAGE_KEY]
  if (Array.isArray(pending) && pending.length) {
    pending.forEach((item: AppToastPayload) => enqueue(item))
    ;(uni as any)[PENDING_TOP_MESSAGE_KEY] = []
  }
})

onUnmounted(() => {
  ;(uni as any).__topMessageReady = false
  uni.$off(APP_TOP_MESSAGE_EVENT, enqueue)
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <slot
    :visible="visible"
    :message="message"
    :message-type="messageType"
    :icon="icon"
    :expandable="expandable"
    :max-lines="maxLines"
    :top-offset-px="topOffsetPx"
  />
</template>
