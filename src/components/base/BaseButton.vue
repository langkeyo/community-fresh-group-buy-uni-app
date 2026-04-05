<script setup lang="ts">
import { computed } from 'vue'

type ButtonType = 'primary' | 'default' | 'danger'

const props = withDefaults(
  defineProps<{
    type?: ButtonType
    disabled?: boolean
    loading?: boolean
    text?: string
  }>(),
  {
    type: 'primary',
    disabled: false,
    loading: false,
    text: ''
  }
)

const emit = defineEmits<{ (e: 'click'): void }>()

const isDisabled = computed(() => props.disabled || props.loading)

const typeClass = computed(() => {
  if (props.type === 'danger') {
    return 'bg-red-500 text-white border border-red-500'
  }
  if (props.type === 'default') {
    return 'bg-white text-primary border border-primary'
  }
  return 'bg-primary text-white border border-primary'
})

const stateClass = computed(() => {
  return isDisabled.value ? 'opacity-50 bg-gray-200 text-gray-500 border-gray-200' : ''
})

const hoverClass = computed(() => {
  return isDisabled.value ? '' : 'scale-95 opacity-80'
})

const handleClick = () => {
  if (isDisabled.value) return
  emit('click')
}
</script>

<template>
  <view
    class="inline-flex items-center justify-center rounded-full px-4 py-2 text-base transition-all"
    :class="[typeClass, stateClass]"
    :hover-class="hoverClass"
    @click="handleClick"
  >
    <text v-if="loading" class="text-base">加载中...</text>
    <text v-else-if="text" class="text-base">{{ text }}</text>
    <slot v-else />
  </view>
</template>
