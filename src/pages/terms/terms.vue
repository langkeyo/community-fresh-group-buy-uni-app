<script setup lang="ts">
import { getSystemConfig } from '@/services/system-config'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'

const termsText = ref('服务条款加载中...')
const servicePhone = ref('400-800-1234')
const serviceWechat = ref('ligo-service')

async function loadTerms() {
  const config = await getSystemConfig()
  termsText.value = config.serviceTerms || '当前暂无服务条款内容'
  servicePhone.value = config.servicePhone || servicePhone.value
  serviceWechat.value = config.serviceWechat || serviceWechat.value
}

onShow(() => {
  loadTerms()
})
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-6 space-y-4">
    <view class="bg-white rounded-xl p-5 shadow-sm">
      <text class="text-lg font-bold text-fresh block mb-3">用户服务协议</text>
      <text class="text-sm text-gray-700 leading-7">{{ termsText }}</text>
    </view>

    <view class="bg-white rounded-xl p-5 shadow-sm">
      <text class="text-base font-bold text-fresh block mb-2">客服支持</text>
      <text class="text-sm text-gray-500 block">电话：{{ servicePhone }}</text>
      <text class="text-sm text-gray-500 block mt-1">微信：{{ serviceWechat }}</text>
    </view>
  </view>
</template>

<style scoped>
.wxss-page-fix {
  display: block;
}
</style>

