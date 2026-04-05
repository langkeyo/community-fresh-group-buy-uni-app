<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
onLaunch(() => {
  console.log('App Launch')
})
onShow(() => {
  console.log('App Show')
})
onHide(() => {
  console.log('App Hide')
})
</script>
<style>
@tailwind base;
@tailwind components;
@tailwind utilities;

page {
  @apply bg-gray-50;
  animation: pageFadeIn 0.25s ease;
}

.base-input {
  padding: 0 20rpx;
  height: 72rpx;
  line-height: 72rpx;
  box-sizing: border-box;
}

.base-input--search {
  padding: 0 24rpx;
  height: 80rpx;
  line-height: 80rpx;
}

.base-field__control {
  padding: 0;
}

.base-field__text {
  padding: 16rpx 20rpx;
  display: block;
}

@keyframes pageFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
