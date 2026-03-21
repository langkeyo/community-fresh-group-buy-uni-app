<script setup lang="ts">
import {
  ORDER_STATUS_FALLBACK,
  ORDER_STATUS_MAP
} from '@/constants/order-status'
import { getOrderDetail } from '@/services/order'
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

onLoad((query) => {
  const id = String(query?.id || '')
  currentOrderId.value = id
  loadOrderDetail(id)
})

const currentStatusUI = computed(() => {
  const key = orderInfo.value?.status
  return key !== undefined
    ? ORDER_STATUS_MAP[key] || ORDER_STATUS_FALLBACK
    : ORDER_STATUS_FALLBACK
})

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
      <view
        class="inline-block px-4 py-2 text-sm text-white rounded-full bg-primary"
        @click="loadOrderDetail(currentOrderId)"
        >点击重试</view
      >
    </view>

    <!-- 3) 成功态 -->
    <view
      v-else-if="found"
      class="flex flex-col p-8 space-y-4 bg-white rounded-lg shadow-sm"
    >
      <text class="text-sm text-gray-600">订单号：{{ orderInfo?.no }}</text>
      <text class="text-base font-bold text-fresh">{{ orderInfo?.name }}</text>
      <text class="text-sm text-gray-600">数量：{{ orderInfo?.qty }}</text>
      <text class="text-sm text-gray-600">实付：￥{{ orderInfo?.price }}</text>
      <text class="text-sm text-gray-600"
        >自提点：{{ orderInfo?.pickPointName || '-' }}</text
      >
      <view
        class="inline-block px-3 py-1 rounded-full"
        :class="currentStatusUI.bgClass"
      >
        <text class="text-sm" :class="currentStatusUI.textClass">
          状态：{{ currentStatusUI.label }}
        </text>
      </view>

      <view class="flex gap-3 text-center">
        <view
          hover-class="scale-95 opacity-80"
          class="flex-1 py-3 text-base bg-white border rounded-full text-primary border-primary"
          @click="goBackToOrder"
        >
          返回订单
        </view>
        <view
          hover-class="scale-95 opacity-80"
          class="flex-1 py-3 text-base text-white rounded-full bg-primary active:scale-95"
          @click="buyAgain"
        >
          再次购买
        </view>
      </view>
    </view>

    <!-- 4) 空态 -->
    <view v-else class="p-4 py-8 text-center bg-white rounded-lg shadow-sm">
      <text class="text-sm text-gray-400">订单不存在或已失效</text>
    </view>
  </view>
</template>
