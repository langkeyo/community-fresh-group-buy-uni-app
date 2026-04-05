<script setup lang="ts">
import { computed } from 'vue'

type TagKind = 'success' | 'warning' | 'danger' | 'info'

const props = withDefaults(
  defineProps<{
    kind?: TagKind
    text?: string
  }>(),
  {
    kind: 'info',
    text: ''
  }
)

const kindClass = computed(() => {
  if (props.kind === 'success') {
    return 'bg-green-50 text-green-700 border border-green-200'
  }
  if (props.kind === 'warning') {
    return 'bg-orange-50 text-orange-700 border border-orange-200'
  }
  if (props.kind === 'danger') {
    return 'bg-red-50 text-red-700 border border-red-200'
  }
  return 'bg-gray-50 text-gray-600 border border-gray-200'
})
</script>

<template>
  <view class="inline-flex items-center rounded-full px-2 py-1 text-sm" :class="kindClass">
    <text v-if="text" class="text-sm">{{ text }}</text>
    <slot v-else />
  </view>
</template>
