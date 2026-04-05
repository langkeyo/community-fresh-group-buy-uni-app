<script setup lang="ts">
const callService = () => {
  uni.makePhoneCall({ phoneNumber: '400-800-1234' })
}

const copyWechat = () => {
  uni.setClipboardData({ data: 'ligo-service' })
}
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-4 space-y-4">
    <view class="bg-white rounded-xl p-4 shadow-sm">
      <text class="text-base font-bold text-fresh block mb-2">在线客服</text>
      <text class="text-xs text-gray-500 block">服务时间：09:00-22:00</text>
      <view class="mt-3 flex gap-2">
        <view class="px-4 py-2 text-xs rounded-full bg-primary text-white" @click="callService">电话客服</view>
        <view class="px-4 py-2 text-xs rounded-full border border-primary text-primary" @click="copyWechat">复制客服微信</view>
      </view>
    </view>

    <view class="bg-white rounded-xl p-4 shadow-sm">
      <text class="text-base font-bold text-fresh block mb-2">反馈与建议</text>
      <text class="text-xs text-gray-500 block">我们会在1个工作日内回复。</text>
      <view class="mt-3">
        <view class="px-4 py-2 text-xs rounded-full border border-gray-200 text-gray-600">填写反馈表单</view>
      </view>
    </view>
  </view>
</template>
