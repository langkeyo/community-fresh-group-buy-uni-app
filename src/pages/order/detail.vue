<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import { ORDER_STATUS_FALLBACK, ORDER_STATUS_MAP } from '@/constants/order-status'
import { getOrderDetail, updateStatus } from '@/services/order'
import { useUserStore } from '@/stores/user'
import type { OrderInfo } from '@/types/order'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const userStore = useUserStore()
const orderInfo = ref<OrderInfo | null>(null)
const found = ref(false)
const loading = ref(true)
const errorMsg = ref('')
const isNavigating = ref(false)
const currentOrderId = ref('')
const isLeader = ref(false)

onLoad((query) => {
  const id = String(query?.id || '')
  currentOrderId.value = id
  const stored = uni.getStorageSync('userInfo')
  const info = stored ? (typeof stored === 'string' ? JSON.parse(stored) : stored) : null
  isLeader.value = Boolean(info?.isLeader)
  loadOrderDetail(id)
})

const currentStatusUI = computed(() => {
  const key = orderInfo.value?.status
  return key !== undefined
    ? ORDER_STATUS_MAP[key] || ORDER_STATUS_FALLBACK
    : ORDER_STATUS_FALLBACK
})

const currentStatusKind = computed(() => {
  const s = orderInfo.value?.status
  if (s === 3) return 'success'
  if (s === 2) return 'info'
  if (s === 1) return 'warning'
  return 'info'
})

const displayCreateTime = computed(() => {
  const raw = orderInfo.value?.createTime || ''
  return raw ? raw.replace('T', ' ') : '-'
})

const nextStatus = computed<number | null>(() => {
  const s = orderInfo.value?.status
  if (s === 1) return 2
  if (s === 2) return 3
  return null
})

const nextStatusText = computed(() => {
  if (nextStatus.value === 2) return '标记为已成团'
  if (nextStatus.value === 3) return '标记为已取货'
  return ''
})

async function handleUpdateStatus() {
  if (!orderInfo.value || !nextStatus.value) return
  try {
    await updateStatus(orderInfo.value.id, nextStatus.value)
    uni.setStorageSync('order_need_refresh', true)
    await loadOrderDetail(orderInfo.value.id)
    uni.showToast({ title: '状态更新成功', icon: 'success' })
  } catch (error: any) {
    const code = Number(error?.code)
    if (code === 3002) {
      uni.showToast({ title: '状态流转不合法', icon: 'none' })
      return
    }
    uni.showToast({ title: '状态更新失败', icon: 'none' })
  }
}

async function fetchOrderDetail(id: string) {
  return getOrderDetail(id, userStore.userId)
}

async function loadOrderDetail(id: string) {
  loading.value = true
  errorMsg.value = ''
  found.value = false
  orderInfo.value = null

  try {
    const target = await fetchOrderDetail(id)
    if (!target) return
    orderInfo.value = target
    found.value = true
  } catch (error: any) {
    const code = Number(error?.code)
    const message = String(error?.message || '')

    if (code === 3001 || message.includes('订单不存在')) {
      found.value = false
      return
    }
    errorMsg.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function goBackToOrder() {
  if (isNavigating.value) return
  isNavigating.value = true
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({
      complete: () => {
        isNavigating.value = false
      }
    })
    return
  }
  uni.switchTab({
    url: '/pages/order/order',
    complete: () => {
      isNavigating.value = false
    }
  })
}

function buyAgain() {
  if (isNavigating.value || !orderInfo.value) return
  isNavigating.value = true
  uni.navigateTo({
    url: `/pages/group-buy/group-buy?id=${orderInfo.value?.id}`,
    complete: () => {
      isNavigating.value = false
    }
  })
}
</script>

<template>
  <view class="min-h-screen px-4 pt-4 space-y-4 bg-gray-50">
    <!-- 1) 加载态 -->
    <view
      v-if="loading"
      class="p-4 py-8 text-center bg-white rounded-lg shadow-sm"
    >
      <text class="text-sm text-gray-400">加载中...</text>
    </view>

    <!-- 2) 错误态 -->
    <view
      v-else-if="errorMsg"
      class="p-4 py-8 space-y-3 text-center bg-white rounded-lg shadow-sm"
    >
      <text class="block text-sm text-red-500">{{ errorMsg }}</text>
      <BaseButton text="点击重试" @click="loadOrderDetail(currentOrderId)" />
    </view>

    <!-- 3) 成功态 -->
    <view
      v-else-if="found"
      class="flex flex-col p-8 space-y-4 bg-white rounded-lg shadow-sm"
    >
      <text class="text-sm text-gray-600">订单号：{{ orderInfo?.no }}</text>
      <text class="text-base font-bold text-fresh">{{ orderInfo?.name }}</text>

      <text class="text-sm text-gray-600"
        >自提点：{{ orderInfo?.pickPointName || '-' }}</text
      >
      <text class="text-sm text-gray-600"
        >自提点地址：{{ orderInfo?.pickPointAddress || '-' }}</text
      >
      <text class="text-sm text-gray-600">数量：{{ orderInfo?.qty }}</text>
      <text class="text-sm text-gray-600">实付：￥{{ orderInfo?.price }}</text>
      <text class="text-sm text-gray-600"
        >下单时间：{{ displayCreateTime }}</text
      >
      <BaseTag :kind="currentStatusKind" :text="`状态：${currentStatusUI.label}`" />

      <view v-if="nextStatus && isLeader" class="w-full">
        <BaseButton class="w-full" :text="nextStatusText" @click="handleUpdateStatus" />
      </view>

      <view class="flex gap-3 text-center">
        <BaseButton class="flex-1" type="default" text="返回订单" @click="goBackToOrder" />
        <BaseButton class="flex-1" text="再次购买" @click="buyAgain" />
      </view>
    </view>

    <!-- 4) 空态 -->
    <view v-else class="p-4 py-8 text-center bg-white rounded-lg shadow-sm">
      <text class="text-sm text-gray-400">订单不存在或已失效</text>
    </view>
  </view>
</template>
