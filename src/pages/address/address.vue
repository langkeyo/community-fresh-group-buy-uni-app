<script setup lang="ts">
import { getPickPointDetail } from '@/services/pick-point'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'

const defaultPickName = ref('未设置默认自提点')
const defaultPickAddress = ref('请先到自提网点页面设置默认自提点')
const loading = ref(false)

const loadDefaultPickPoint = async () => {
  const id = Number(uni.getStorageSync('default_pick_point_id'))
  if (!id) {
    defaultPickName.value = '未设置默认自提点'
    defaultPickAddress.value = '请先到自提网点页面设置默认自提点'
    return
  }

  loading.value = true
  try {
    const detail = await getPickPointDetail(id)
    defaultPickName.value = detail?.name || '未设置默认自提点'
    defaultPickAddress.value =
      detail?.address || '请先到自提网点页面设置默认自提点'
  } catch (error: any) {
    defaultPickName.value = '默认自提点加载失败'
    defaultPickAddress.value = '请返回重试或重新选择自提点'
  } finally {
    loading.value = false
  }
}

const goToPickPointPage = () => {
  uni.navigateTo({ url: '/pages/self-pick/self-pick' })
}

const showAddressCapabilityTip = () => {
  uni.showToast({
    title: '当前以自提点收货为主，已为你保留常用设置',
    icon: 'none'
  })
}

const copyPickAddress = () => {
  const text = `${defaultPickName.value} ${defaultPickAddress.value}`.trim()
  if (!text || defaultPickName.value === '未设置默认自提点') {
    uni.showToast({ title: '请先设置默认自提点', icon: 'none' })
    return
  }
  uni.setClipboardData({ data: text })
}

onShow(() => {
  loadDefaultPickPoint()
})
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-6 space-y-6">
    <view class="bg-white rounded-xl p-6 shadow-sm">
      <text class="text-lg font-bold text-fresh block mb-3">默认收货地址</text>
      <text class="text-base text-gray-700 block">收货方式：社区自提</text>
      <text class="text-sm text-gray-500 block mt-2"
        >已为你优先展示常用自提点，支持一键切换与地址复制</text
      >
      <view class="mt-4 flex gap-3">
        <view
          class="px-4 py-2 text-sm rounded-full border border-primary text-primary"
          @click="showAddressCapabilityTip"
          >设为默认</view
        >
        <view
          class="px-4 py-2 text-sm rounded-full border border-gray-200 text-gray-600"
          @click="showAddressCapabilityTip"
          >编辑</view
        >
      </view>
    </view>

    <view class="bg-white rounded-xl p-6 shadow-sm">
      <text class="text-lg font-bold text-fresh block mb-3">常用自提点</text>
      <text class="text-base text-gray-700 block">{{ defaultPickName }}</text>
      <text class="text-sm text-gray-500 block mt-2">{{ defaultPickAddress }}</text>
      <text v-if="loading" class="text-xs text-gray-400 block mt-2">加载中...</text>
      <view class="mt-4 flex gap-3">
        <view
          class="px-4 py-2 text-sm rounded-full border border-primary text-primary"
          @click="copyPickAddress"
          >复制地址</view
        >
        <view
          class="px-4 py-2 text-sm rounded-full border border-gray-200 text-gray-600"
          @click="goToPickPointPage"
          >切换自提点</view
        >
      </view>
    </view>

    <view class="bg-white rounded-xl p-6 shadow-sm">
      <text class="text-lg font-bold text-fresh block mb-3">收货偏好</text>
      <text class="text-sm text-gray-500">默认周末送达，白天可联系</text>
    </view>
  </view>
</template>

<style scoped>
.wxss-page-fix {
  display: block;
}
</style>

