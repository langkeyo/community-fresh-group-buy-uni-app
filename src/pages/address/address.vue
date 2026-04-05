<script setup lang="ts">
import { onMounted } from 'vue'

const openLocation = () => {
  uni.openLocation({
    latitude: 39.909,
    longitude: 116.397,
    name: '阳光花园一期A站',
    address: '阳光大道88号10栋101'
  })
}

onMounted(() => {
  // 预留动画或数据加载
})
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-4 space-y-4">
    <view class="bg-white rounded-xl p-4 shadow-sm">
      <text class="text-base font-bold text-fresh block mb-2">默认收货地址</text>
      <text class="text-sm text-gray-700 block">张同学  138****8000</text>
      <text class="text-xs text-gray-500 block mt-1">上海市 浦东新区 碧波路100号 2栋1102</text>
      <view class="mt-3 flex gap-2">
        <view class="px-3 py-1.5 text-xs rounded-full border border-primary text-primary">设为默认</view>
        <view class="px-3 py-1.5 text-xs rounded-full border border-gray-200 text-gray-600">编辑</view>
      </view>
    </view>

    <view class="bg-white rounded-xl p-4 shadow-sm">
      <text class="text-base font-bold text-fresh block mb-2">常用自提点</text>
      <text class="text-sm text-gray-700 block">阳光花园一期A站</text>
      <text class="text-xs text-gray-500 block mt-1">阳光大道88号10栋101</text>
      <view class="mt-3 flex gap-2">
        <view class="px-3 py-1.5 text-xs rounded-full border border-primary text-primary" @click="openLocation">一键导航</view>
        <view class="px-3 py-1.5 text-xs rounded-full border border-gray-200 text-gray-600">切换自提点</view>
      </view>
    </view>

    <view class="bg-white rounded-xl p-4 shadow-sm">
      <text class="text-base font-bold text-fresh block mb-2">收货偏好</text>
      <text class="text-xs text-gray-500">默认周末送达，白天可联系</text>
    </view>
  </view>
</template>
