<script setup lang="ts">
const faqList = [
  {
    q: '如何发起拼团？',
    a: '进入商品页后点击“发起拼团”，填写信息即可。'
  },
  {
    q: '拼团成功后如何取货？',
    a: '在订单详情页查看取货点信息，到点后出示取货码。'
  },
  {
    q: 'AI推荐不准确怎么办？',
    a: '可在AI助手中更换关键词或点击重试。'
  }
]
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-4 space-y-4">
    <view class="bg-white rounded-xl p-4 shadow-sm">
      <text class="text-base font-bold text-fresh block mb-2">常见问题</text>
      <view v-for="item in faqList" :key="item.q" class="py-3 border-b border-gray-100">
        <text class="text-sm font-bold text-[#2F5233] block">{{ item.q }}</text>
        <text class="text-xs text-gray-500 block mt-1">{{ item.a }}</text>
      </view>
    </view>
  </view>
</template>
