import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const userId = ref<number>(1)

  function setUserId(id: number) {
    userId.value = id
  }

  return {
    userId,
    setUserId
  }
})
