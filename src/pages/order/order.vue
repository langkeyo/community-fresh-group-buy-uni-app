<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import { ORDER_STATUS_FALLBACK, ORDER_STATUS_MAP } from '@/constants/order-status'
import { getOrderList } from '@/services/order'
import { useUserStore } from '@/stores/user'
import type { OrderInfo } from '@/types/order'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const statusList = [
  { label: '全部', value: 'all' as const },
  { label: '待成团', value: 1 },
  { label: '已成团', value: 2 },
  { label: '已取货', value: 3 }
]

const userStore = useUserStore()
const activeStatus = ref<'all' | number>('all')
const orderList = ref<OrderInfo[]>([])
const loading = ref(true)
const errorMsg = ref('')
const hasLoaded = ref(false)
const ORDER_REFRESH_FLAG = 'order_need_refresh'

const filteredOrders = computed(() => {
  if (activeStatus.value === 'all') return orderList.value
  return orderList.value.filter((o) => o.status === activeStatus.value)
})

const statusCountMap = computed(() => {
  const map: Record<string, number> = { all: orderList.value.length }
  for (const item of orderList.value) {
    const key = String(item.status)
    map[key] = (map[key] || 0) + 1
  }
  return map
})

const displayOrders = computed(() => {
  return filteredOrders.value.map((item) => ({
    ...item,
    no: item.no || `NO-${item.id}`,
    name: item.name || '社区生鲜商品',
    qty: item.qty ?? 1,
    price: item.price || '0.00',
    statusUI: getStatusUI(item.status)
  }))
})

function goToOrderDetail(id: string) {
  uni.navigateTo({ url: `/pages/order/detail?id=${id}` })
}

function getStatusUI(status: number) {
  return ORDER_STATUS_MAP[status] || ORDER_STATUS_FALLBACK
}

function getStatusKind(status: number) {
  if (status === 3) return 'success'
  if (status === 2) return 'info'
  if (status === 1) return 'warning'
  return 'info'
}

async function loadOrderList() {
  loading.value = true
  errorMsg.value = ''

  try {
    orderList.value = await getOrderList(userStore.userId)
    console.log(orderList.value)
    hasLoaded.value = true
  } catch (error) {
    console.log(error)
    errorMsg.value = '订单加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onShow(() => {
  const shouldRefresh = uni.getStorageSync(ORDER_REFRESH_FLAG)

  if (hasLoaded.value && !shouldRefresh) return

  if (shouldRefresh) {
    uni.removeStorageSync(ORDER_REFRESH_FLAG)
  }

  loadOrderList()
})

onPullDownRefresh(async () => {
  await loadOrderList()
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="min-h-screen px-4 pt-4 space-y-4 bg-gray-50">
    <text class="text-base font-bold text-fresh">订单列表</text>

    <!-- 订单筛选栏 -->
    <view class="flex gap-3">
      <view
        v-for="item in statusList"
        :key="item.value"
        class="text-sm px-3 py-1.5 rounded-full border"
        :class="
          item.value === activeStatus
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-gray-600 border-gray-200'
        "
        @click="activeStatus = item.value"
      >
        {{ item.label }}({{ statusCountMap[String(item.value)] || 0 }})
      </view>
    </view>

    <!-- 订单卡片列表 -->
    <view v-if="loading" class="py-8 text-center">
      <text class="text-sm text-gray-400">订单加载中...</text>
    </view>

    <view v-else-if="errorMsg" class="py-8 space-y-3 text-center">
      <text class="block text-sm text-red-500">{{ errorMsg }}</text>
      <BaseButton text="点击重试" @click="loadOrderList" />
    </view>

    <view v-else class="space-y-3">
      <view
        v-for="item in displayOrders"
        :key="item.id"
        class="p-4 space-y-2 bg-white rounded-lg shadow-sm"
        @click="goToOrderDetail(item.id)"
      >
        <view class="flex justify-between text-sm text-gray-600">
          <text>订单号：{{ item.no }}</text>
          <BaseTag :kind="getStatusKind(item.status)" :text="item.statusUI.label" />
        </view>
        <text class="text-base font-bold text-fresh">{{ item.name }}</text>
        <view class="flex justify-between text-sm text-gray-600">
          <text>数量：{{ item.qty }}</text>
          <text>￥{{ item.price }}</text>
        </view>
        <text class="block text-xs text-gray-400 pt-1">
          下单时间: {{ item.createTime || '-' }}
        </text>
      </view>
    </view>

    <!-- 空状态 -->
    <view
      v-if="!loading && !errorMsg && !filteredOrders.length"
      class="py-8 text-center"
    >
      <text class="text-sm text-gray-400">暂无订单</text>
    </view>

    <!-- 底部提示 -->
    <view v-else-if="!loading && !errorMsg" class="py-4 text-center">
      <text class="text-xs text-gray-400">- 没有更多了 -</text>
    </view>
  </view>
</template>
