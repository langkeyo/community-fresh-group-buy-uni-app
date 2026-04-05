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
  <view class="min-h-screen bg-gray-50 p-6 space-y-6">
    <view class="bg-white rounded-xl p-6 shadow-sm">
      <text class="text-lg font-bold text-fresh block mb-3">默认收货地址</text>
      <text class="text-base text-gray-700 block">张同学  138****8000</text>
      <text class="text-sm text-gray-500 block mt-2">上海市 浦东新区 碧波路100号 2栋1102</text>
      <view class="mt-4 flex gap-3">
        <view class="px-4 py-2 text-sm rounded-full border border-primary text-primary">设为默认</view>
        <view class="px-4 py-2 text-sm rounded-full border border-gray-200 text-gray-600">编辑</view>
      </view>
    </view>

    <view class="bg-white rounded-xl p-6 shadow-sm">
      <text class="text-lg font-bold text-fresh block mb-3">常用自提点</text>
      <text class="text-base text-gray-700 block">阳光花园一期A站</text>
      <text class="text-sm text-gray-500 block mt-2">阳光大道88号10栋101</text>
      <view class="mt-4 flex gap-3">
        <view class="px-4 py-2 text-sm rounded-full border border-primary text-primary" @click="openLocation">一键导航</view>
        <view class="px-4 py-2 text-sm rounded-full border border-gray-200 text-gray-600">切换自提点</view>
      </view>
    </view>

    <view class="bg-white rounded-xl p-6 shadow-sm">
      <text class="text-lg font-bold text-fresh block mb-3">收货偏好</text>
      <text class="text-sm text-gray-500">默认周末送达，白天可联系</text>
    </view>
  </view>
</template>
