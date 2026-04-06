<script setup lang="ts">
import { getSystemConfig } from '@/services/system-config'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'

const servicePhone = ref('400-800-1234')
const serviceWechat = ref('ligo-service')
const serviceHours = ref('09:00-22:00')
const serviceTerms = ref('服务条款：当前版本为毕业设计演示环境，支付流程为模拟链路。')

async function loadServiceConfig() {
  const config = await getSystemConfig()
  servicePhone.value = config.servicePhone || servicePhone.value
  serviceWechat.value = config.serviceWechat || serviceWechat.value
  serviceHours.value = config.serviceHours || serviceHours.value
  serviceTerms.value = config.serviceTerms || serviceTerms.value
}

onShow(() => {
  loadServiceConfig()
})

const callService = () => {
  uni.makePhoneCall({ phoneNumber: servicePhone.value })
}

const copyWechat = () => {
  uni.setClipboardData({ data: serviceWechat.value })
}
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-6 space-y-6">
    <view class="bg-white rounded-xl p-6 shadow-sm">
      <text class="text-lg font-bold text-fresh block mb-3">在线客服</text>
      <text class="text-sm text-gray-500 block"
        >服务时间：{{ serviceHours }}</text
      >
      <text class="text-xs text-gray-400 block mt-1"
        >客服微信：{{ serviceWechat }}</text
      >
      <view class="mt-4 flex gap-3">
        <view class="px-5 py-3 text-sm rounded-full bg-primary text-white" @click="callService">电话客服</view>
        <view class="px-5 py-3 text-sm rounded-full border border-primary text-primary" @click="copyWechat">复制客服微信</view>
      </view>
    </view>

    <view class="bg-white rounded-xl p-6 shadow-sm">
      <text class="text-lg font-bold text-fresh block mb-3">反馈与建议</text>
      <text class="text-sm text-gray-500 block">我们会在1个工作日内回复。</text>
      <view class="mt-4">
        <view class="px-5 py-3 text-sm rounded-xl border border-gray-200 text-gray-600">
          {{ serviceTerms }}
        </view>
      </view>
    </view>
  </view>
</template>
