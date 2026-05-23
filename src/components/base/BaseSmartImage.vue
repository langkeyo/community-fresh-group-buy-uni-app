<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string
    mode?: 'scaleToFill' | 'aspectFit' | 'aspectFill' | 'widthFix' | 'heightFix'
    fallbackText?: string
    fallbackBg?: string
    fallbackColor?: string
    className?: string
  }>(),
  {
    src: '',
    mode: 'aspectFill',
    fallbackText: '图片加载失败',
    fallbackBg: '#f2f4f7',
    fallbackColor: '#6b7280',
    className: 'w-48 h-48!'
  }
)

const failed = ref(false)
const loading = ref(Boolean(props.src))

watch(
  () => props.src,
  (nextSrc) => {
    failed.value = false
    loading.value = Boolean(nextSrc)
  }
)

const showImage = computed(() => Boolean(props.src) && !failed.value)
const showFallback = computed(() => !props.src || failed.value)

const onLoad = () => {
  loading.value = false
}

const onError = () => {
  failed.value = true
  loading.value = false
}
</script>

<template>
  <view :class="`smart-image-wrapper ${className}`">
    <image
      v-if="showImage"
      :src="src"
      :mode="mode"
      class="smart-image-element"
      :class="{ 'smart-image-loaded': !loading }"
      @load="onLoad"
      @error="onError"
    />
    <view v-if="loading" class="smart-image-loading" aria-label="图片加载中">
      <view class="smart-image-shimmer"></view>
    </view>
    <view
      v-if="showFallback"
      class="smart-image-fallback"
      :style="{ backgroundColor: fallbackBg, color: fallbackColor }"
    >
      <text class="smart-image-fallback-text">{{ fallbackText }}</text>
    </view>
  </view>
</template>

<style scoped>
.smart-image-wrapper {
  position: relative;
  overflow: hidden;
}

.smart-image-element {
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 220ms ease-out;
}

.smart-image-loaded {
  opacity: 1;
}

.smart-image-loading {
  position: absolute;
  inset: 0;
  background: #f2f4f7;
}

.smart-image-shimmer {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #eef1f5 25%, #f9fafb 50%, #eef1f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}

.smart-image-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx;
}

.smart-image-fallback-text {
  font-size: 22rpx;
  text-align: center;
  line-height: 1.4;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
