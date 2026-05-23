import { defineStore } from 'pinia'
import { ref } from 'vue'

const USER_ID_KEY = 'user_id'

function parseUserId(input: unknown): number {
  const id = Number(input || 0)
  return Number.isFinite(id) && id > 0 ? id : 0
}

function resolveUserIdFromStorage(): number {
  const directId = parseUserId(uni.getStorageSync(USER_ID_KEY))
  if (directId > 0) return directId

  const stored = uni.getStorageSync('userInfo')
  try {
    const info =
      stored && typeof stored === 'string' ? JSON.parse(stored) : stored
    return parseUserId(info?.id)
  } catch {
    return 0
  }
}

export const useUserStore = defineStore('user', () => {
  const userId = ref<number>(resolveUserIdFromStorage())

  function setUserId(id: number) {
    const safeId = parseUserId(id)
    userId.value = safeId
    if (safeId > 0) {
      uni.setStorageSync(USER_ID_KEY, safeId)
    } else {
      uni.removeStorageSync(USER_ID_KEY)
    }
  }

  function hydrateUserId() {
    setUserId(resolveUserIdFromStorage())
  }

  function clearUserId() {
    userId.value = 0
    uni.removeStorageSync(USER_ID_KEY)
  }

  return {
    userId,
    setUserId,
    hydrateUserId,
    clearUserId
  }
})
