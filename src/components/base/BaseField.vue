<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label?: string
    error?: string
    required?: boolean
  }>(),
  {
    label: '',
    error: '',
    required: false
  }
)
</script>

<template>
  <view class="space-y-2">
    <view v-if="label" class="flex items-center gap-1">
      <text class="text-base text-[#2F5233]">{{ label }}</text>
      <text v-if="required" class="text-sm text-red-500">*</text>
    </view>
    <view
      class="border rounded-lg bg-gray-50 base-field__control"
      :class="error ? 'border-red-400' : 'border-gray-200'"
    >
      <slot />
    </view>
    <text v-if="error" class="text-sm text-red-500">{{ error }}</text>
  </view>
</template>
