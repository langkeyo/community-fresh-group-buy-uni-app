<script setup lang="ts">
const emit = defineEmits<{ (e: 'click'): void }>()

const handleClick = () => {
  emit('click')
}
</script>

<template>
  <view class="bg-white rounded-xl shadow-sm p-4" @click="handleClick">
    <slot />
  </view>
</template>
