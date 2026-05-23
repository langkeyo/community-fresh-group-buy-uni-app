<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSmartImage from '@/components/base/BaseSmartImage.vue'
import { DEFAULT_AVATAR_PATH } from '@/constants/ui'
import { getPickPointDetail } from '@/services/pick-point'
import { getLeaderWorkbench, leaderConfirmPick } from '@/services/order'
import type { OrderInfo } from '@/types/order'
import type { UserInfo } from '@/types/user'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const userInfo = ref<UserInfo | null>(null)
const pickPointName = ref('')
const pickPointAddress = ref('')
const pickPointId = ref<number | null>(null)
const loading = ref(false)
const errorMsg = ref('')
const confirmingId = ref('')
const pendingOrders = ref<OrderInfo[]>([])
const recentConfirmList = ref<OrderInfo[]>([])
const pickedTodayCount = ref(0)

const pendingCount = computed(() => pendingOrders.value.length)

const resetWorkbenchState = () => {
  errorMsg.value = ''
  pendingOrders.value = []
  recentConfirmList.value = []
  pickedTodayCount.value = 0
}

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
    pickPointName.value = ''
    pickPointAddress.value = ''
    resetWorkbenchState()
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
    const data = await getLeaderWorkbench(userInfo.value.id, pickPointId.value)
    pendingOrders.value = data.pendingOrders
    recentConfirmList.value = data.recentPickedOrders
    pickedTodayCount.value = data.pickedTodayCount
  } catch (error: any) {
    errorMsg.value = error?.message || '待核销订单加载失败'
    pendingOrders.value = []
    recentConfirmList.value = []
    pickedTodayCount.value = 0
  } finally {
    loading.value = false
  }
}

const handleConfirm = async (id: string) => {
  if (!userInfo.value?.id || !pickPointId.value || confirmingId.value) return
  confirmingId.value = id
  try {
    await leaderConfirmPick(id, userInfo.value.id, pickPointId.value)
    uni.showToast({ title: '核销成功', icon: 'success' })
    uni.setStorageSync('order_need_refresh', true)
    await loadLeaderOrders()
  } catch (error: any) {
    uni.showToast({ title: error?.message || '核销失败', icon: 'none' })
  } finally {
    confirmingId.value = ''
  }
}

const goToPickPoint = () => {
  uni.navigateTo({ url: '/pages/self-pick/self-pick' })
}

const goToOrderList = () => {
  uni.switchTab({ url: '/pages/order/order' })
}

const goToOrderDetail = (id: string) => {
  uni.navigateTo({ url: `/pages/order/detail?id=${id}` })
}

onShow(async () => {
  loadUserInfo()
  if (!userInfo.value?.isLeader) {
    uni.showToast({ title: '仅团长可访问', icon: 'none' })
    return
  }
  await loadPickPoint()
  if (!pickPointId.value) {
    uni.showToast({ title: '请先选择默认自提点', icon: 'none' })
    return
  }
  await loadLeaderOrders()
})

onPullDownRefresh(async () => {
  if (!userInfo.value?.isLeader) {
    uni.stopPullDownRefresh()
    return
  }
  await loadPickPoint()
  if (!pickPointId.value) {
    uni.showToast({ title: '请先选择默认自提点', icon: 'none' })
    uni.stopPullDownRefresh()
    return
  }
  await loadLeaderOrders()
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="min-h-screen bg-[#F5F7FA]">
    <view class="px-4 pt-4 pb-2 space-y-3">
      <view class="bg-[#2F5233] rounded-2xl p-4 text-white shadow-sm">
        <view class="flex items-center mb-4">
        <BaseSmartImage
          :src="userInfo?.avatar || DEFAULT_AVATAR_PATH"
          class-name="w-12 h-12 rounded-full border-2 border-white mr-3 overflow-hidden"
          fallback-bg="#ffffff"
          fallback-color="#f08800"
          fallback-text="团长"
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

        <view class="grid grid-cols-2 gap-3">
          <view class="bg-white/10 rounded-xl px-3 py-2">
            <text class="block text-[40rpx] font-bold">{{ pendingCount }}</text>
            <text class="text-xs opacity-90">待核销订单</text>
          </view>
          <view class="bg-white/10 rounded-xl px-3 py-2">
            <text class="block text-[40rpx] font-bold">{{ pickedTodayCount }}</text>
            <text class="text-xs opacity-90">今日已核销</text>
          </view>
        </view>
      </view>

      <view
        class="bg-white rounded-xl shadow-sm p-4 space-y-2"
      >
        <view class="flex items-center justify-between">
          <text class="text-sm font-bold text-[#2F5233]">当前核销自提点</text>
          <text class="text-xs text-primary" @click="goToPickPoint">切换</text>
        </view>
        <text class="text-sm text-gray-700">{{ pickPointName || '请先选择自提点' }}</text>
        <text class="text-xs text-gray-500">{{
          pickPointAddress || '选择后可加载待核销订单'
        }}</text>
        <view class="flex gap-2 pt-1">
          <BaseButton class="flex-1" type="default" text="查看用户订单页" @click="goToOrderList" />
          <BaseButton class="flex-1" text="去选择自提点" @click="goToPickPoint" />
        </view>
      </view>
    </view>

    <!-- 待核销订单 -->
    <view class="px-4">
      <view
        class="flex items-center justify-between mb-3"
      >
        <text class="text-base font-bold text-[#2F5233]">待核销订单</text>
        <text class="text-xs text-gray-500">按时间排序，先到先核销</text>
      </view>

      <view v-if="loading" class="py-4 text-center">
        <text class="text-xs text-gray-400">加载中...</text>
      </view>

      <view v-else-if="errorMsg" class="py-4 text-center">
        <text class="text-xs text-red-500 block mb-2">{{ errorMsg }}</text>
        <BaseButton type="default" text="重试加载" @click="loadLeaderOrders" />
      </view>

      <view v-else>
        <view
          v-for="item in pendingOrders"
          :key="item.id"
          class="bg-white p-3 rounded-xl mb-2 shadow-sm space-y-2 border border-gray-100"
        >
          <view class="flex justify-between items-start">
            <view>
              <view class="text-sm font-bold text-gray-800">{{ item.name }}</view>
              <text class="block text-xs text-gray-500 mt-0.5">订单号：{{ item.no }}</text>
              <text class="block text-xs text-gray-500 mt-0.5">提货点：{{ item.pickPointName || '-' }}</text>
            </view>
            <text class="text-[22rpx] text-gray-400">{{
              item.createTime || '-'
            }}</text>
          </view>
          <view class="flex items-center justify-between">
            <view class="text-xs text-gray-500">
              <text>数量 {{ item.qty }}</text>
              <text class="ml-2 text-primary">￥{{ item.price }}</text>
            </view>
            <view class="flex items-center gap-2">
              <BaseButton
                type="default"
                text="查看详情"
                :disabled="Boolean(confirmingId)"
                @click="goToOrderDetail(item.id)"
              />
              <BaseButton
                text="确认提货"
                :loading="confirmingId === item.id"
                :disabled="Boolean(confirmingId) && confirmingId !== item.id"
                @click="handleConfirm(item.id)"
              />
            </view>
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

    <view class="px-4 pb-6">
      <view
        class="flex items-center justify-between mb-3"
      >
        <text class="text-base font-bold text-[#2F5233]">最近核销</text>
        <text class="text-xs text-gray-500">用于现场核对</text>
      </view>
      <view
        v-if="recentConfirmList.length === 0"
        class="text-center py-6 text-gray-400 text-xs"
      >
        暂无核销记录
      </view>
      <view
        v-for="item in recentConfirmList"
        :key="item.id"
        class="bg-white p-3 rounded-xl mb-2 shadow-sm space-y-1 border border-gray-100"
      >
        <text class="text-sm font-bold text-gray-800">{{ item.name }}</text>
        <text class="block text-xs text-gray-500">订单号：{{ item.no }}</text>
        <text class="text-xs text-gray-400">核销时间：{{ item.createTime || '-' }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.wxss-page-fix {
  display: block;
}
</style>

