<script setup lang="ts">
import type { AppToastType } from '@/utils/notify'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  message: string
  messageType: AppToastType
  icon?: string
  expandable?: boolean
  maxLines?: 1 | 2 | 3
  topOffsetPx: number
}>()
const expanded = ref(false)

const hostStyle = computed(() => `top:${props.topOffsetPx}px;`)

const hostClass = computed(() => {
  if (props.messageType === 'success') return 'top-message top-message--success'
  if (props.messageType === 'error') return 'top-message top-message--error'
  return 'top-message top-message--info'
})

const iconText = computed(() => {
  if (props.icon && String(props.icon).trim()) return String(props.icon).trim()
  if (props.messageType === 'success') return '✓'
  if (props.messageType === 'error') return '!'
  return 'i'
})

const textClass = computed(() => {
  if (expanded.value) return 'top-message__text top-message__text--expanded'
  return props.maxLines === 2
    ? 'top-message__text top-message__text--clamp2'
    : props.maxLines === 3
      ? 'top-message__text top-message__text--clamp3'
    : 'top-message__text top-message__text--clamp1'
})

const toggleExpand = () => {
  if (!props.expandable) return
  expanded.value = !expanded.value
}

watch(
  () => props.message,
  () => {
    expanded.value = false
  }
)
</script>

<template>
  <view class="top-message-wrap" :style="hostStyle" :class="{ 'is-visible': visible }">
    <view :class="hostClass">
      <view class="top-message__icon">{{ iconText }}</view>
      <view class="top-message__content">
        <text :class="textClass">{{ message }}</text>
        <text v-if="expandable" class="top-message__toggle" @click.stop="toggleExpand">
          {{ expanded ? '收起' : '展开' }}
        </text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.top-message-wrap {
  position: fixed;
  left: 12rpx;
  right: 12rpx;
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-20rpx) scale(0.98);
  opacity: 0;
  pointer-events: none;
  transition: all 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.top-message-wrap.is-visible {
  transform: translateY(0) scale(1);
  opacity: 1;
}

.top-message {
  min-height: 72rpx;
  width: auto;
  border-radius: 16rpx;
  padding: 16rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
  border-width: 1rpx;
  border-style: solid;
  backdrop-filter: blur(6px);
  box-shadow: 0 8rpx 18rpx rgba(15, 23, 42, 0.16);
}

.top-message--info {
  background: rgba(31, 41, 55, 0.9);
  border-color: rgba(148, 163, 184, 0.28);
}

.top-message--success {
  background: rgba(20, 83, 45, 0.9);
  border-color: rgba(134, 239, 172, 0.3);
}

.top-message--error {
  background: rgba(127, 29, 29, 0.9);
  border-color: rgba(252, 165, 165, 0.32);
}

.top-message__icon {
  width: 32rpx;
  height: 32rpx;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  font-size: 20rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.top-message__text {
  display: block;
  width: 100%;
  color: #fff;
  font-size: 24rpx;
  line-height: 1.35;
  letter-spacing: 0.2rpx;
}

.top-message__content {
  flex: 1;
  min-width: 0;
  padding-right: 4rpx;
  max-width: 80vw;
  overflow: hidden;
}

.top-message__text--clamp1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-message__text--clamp2 {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.top-message__text--clamp3 {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.top-message__text--expanded {
  white-space: normal;
  word-break: break-all;
}

.top-message__toggle {
  display: inline-block;
  margin-top: 6rpx;
  color: rgba(255, 255, 255, 0.88);
  font-size: 22rpx;
  line-height: 1.1;
  text-decoration: underline;
  text-underline-offset: 2rpx;
}

.top-message__toggle:active {
  opacity: 0.75;
}

.top-message__text--clamp1,
.top-message__text--clamp2,
.top-message__text--clamp3 {
  max-width: 100%;
  overflow: hidden;
  word-break: break-all;
}
</style>
