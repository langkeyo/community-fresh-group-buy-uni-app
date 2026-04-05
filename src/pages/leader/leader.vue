<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import { getPickPointDetail } from '@/services/pick-point'
import { getLeaderOrderList, leaderConfirmPick } from '@/services/order'
import type { OrderInfo } from '@/types/order'
import type { UserInfo } from '@/types/user'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const userInfo = ref<UserInfo | null>(null)
const pickPointName = ref('')
const pickPointAddress = ref('')
const pickPointId = ref<number | null>(null)
const loading = ref(false)
const errorMsg = ref('')
const pendingOrders = ref<OrderInfo[]>([])

const pendingCount = computed(() => pendingOrders.value.length)

const loadUserInfo = () => {
  const stored = uni.getStorageSync('userInfo')
  if (!stored) {
    userInfo.value = null
    return
  }
  userInfo.value = typeof stored === 'string' ? JSON.parse(stored) : stored
}

const loadPickPoint = async () => {
  const id = Number(uni.getStorageSync('default_pick_point_id'))
  if (!id) {
    pickPointId.value = null
    return
  }
  pickPointId.value = id
  try {
    const detail = await getPickPointDetail(id)
    pickPointName.value = detail?.name || ''
    pickPointAddress.value = detail?.address || ''
  } catch (error: any) {
    uni.showToast({ title: error?.message || '自提点信息加载失败', icon: 'none' })
  }
}

const loadLeaderOrders = async () => {
  if (!userInfo.value?.id || !pickPointId.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    pendingOrders.value = await getLeaderOrderList(
      userInfo.value.id,
      pickPointId.value,
      2
    )
  } catch (error: any) {
    errorMsg.value = error?.message || '待核销订单加载失败'
    pendingOrders.value = []
  } finally {
    loading.value = false
  }
}

const handleConfirm = async (id: string) => {
  if (!userInfo.value?.id || !pickPointId.value) return
  try {
    await leaderConfirmPick(id, userInfo.value.id, pickPointId.value)
    uni.showToast({ title: '核销成功', icon: 'success' })
    uni.setStorageSync('order_need_refresh', true)
    await loadLeaderOrders()
  } catch (error: any) {
    uni.showToast({ title: error?.message || '核销失败', icon: 'none' })
  }
}

const goToPickPoint = () => {
  uni.navigateTo({ url: '/pages/self-pick/self-pick' })
}

onShow(async () => {
  loadUserInfo()
  if (!userInfo.value?.isLeader) {
    uni.showToast({ title: '仅团长可访问', icon: 'none' })
    return
  }
  await loadPickPoint()
  if (!pickPointId.value) return
  await loadLeaderOrders()
})
</script>

<template>
  <view class="min-h-screen bg-[#F8F8F8]">
    <!-- 头部卡片 -->
    <view class="bg-[#F08800] px-4 pt-4 pb-12 rounded-b-[40rpx]">
      <view class="flex items-center mb-6">
        <image
          src="https://placehold.co/100x100/FFFFFF/F08800?text=Avatar"
          class="w-12 h-12 rounded-full border-2 border-white mr-3"
        />
        <view>
          <text class="text-white font-bold text-lg block">{{
            userInfo?.nickname || '团长'
          }}</text>
          <text class="text-white/80 text-xs">{{
            pickPointName || '未选择自提点'
          }}</text>
        </view>
      </view>

      <view class="flex justify-between text-white">
        <view class="flex flex-col">
          <text class="text-3xl font-bold">{{ pendingCount }}</text>
          <text class="text-xs opacity-80">待核销订单</text>
        </view>
        <view class="flex flex-col items-end">
          <text class="text-xl font-bold">团长</text>
          <text class="text-xs opacity-80">身份已认证</text>
        </view>
      </view>
    </view>

    <!-- 数据概览 -->
    <view
      class="mx-4 -mt-8 bg-white rounded-xl shadow-sm p-4 space-y-2 mb-4"
    >
      <text class="text-xs text-gray-500">自提点地址</text>
      <text class="text-sm text-gray-700">{{
        pickPointAddress || '请先选择自提点'
      }}</text>
      <view v-if="!pickPointId" class="pt-2">
        <BaseButton text="去选择自提点" @click="goToPickPoint" />
      </view>
    </view>

    <!-- 待核销订单 -->
    <view class="px-4">
      <view
        class="text-base font-bold text-[#2F5233] mb-3 border-l-4 border-[#F08800] pl-2"
        >待核销订单</view
      >

      <view v-if="loading" class="py-4 text-center">
        <text class="text-xs text-gray-400">加载中...</text>
      </view>

      <view v-else-if="errorMsg" class="py-4 text-center">
        <text class="text-xs text-red-500">{{ errorMsg }}</text>
      </view>

      <view v-else>
        <view
          v-for="item in pendingOrders"
          :key="item.id"
          class="bg-white p-3 rounded-lg mb-2 shadow-sm space-y-2"
        >
          <view class="flex justify-between">
            <view>
              <view class="text-sm font-bold text-gray-800">{{ item.name }}</view>
              <text class="text-xs text-gray-500">订单号：{{ item.no }}</text>
            </view>
            <text class="text-xs text-gray-400">{{
              item.createTime || '-'
            }}</text>
          </view>
          <view class="flex justify-end">
            <BaseButton text="确认提货" @click="handleConfirm(item.id)" />
          </view>
        </view>
      </view>

      <view
        v-if="!loading && !errorMsg && pendingOrders.length === 0"
        class="text-center py-6 text-gray-400 text-xs"
      >
        今日订单已全部核销完成
      </view>
    </view>
  </view>
</template>
