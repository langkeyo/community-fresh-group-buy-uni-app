<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSmartImage from '@/components/base/BaseSmartImage.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import { ORDER_STATUS_FALLBACK, ORDER_STATUS_MAP } from '@/constants/order-status'
import { getOrderList, updateStatus } from '@/services/order'
import { getProductList } from '@/services/product'
import { useUserStore } from '@/stores/user'
import type { OrderInfo } from '@/types/order'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const statusList = [
  { label: '全部', value: 'all' as const },
  { label: '待支付', value: 0 },
  { label: '待成团', value: 1 },
  { label: '待收货', value: 2 },
  { label: '待确认', value: 4 },
  { label: '已完成', value: 3 }
]

const userStore = useUserStore()
const activeStatus = ref<'all' | number>('all')
const orderList = ref<OrderInfo[]>([])
const loading = ref(true)
const errorMsg = ref('')
const hasLoaded = ref(false)
const lastLoadedUserId = ref(0)
const ORDER_REFRESH_FLAG = 'order_need_refresh'
const productCoverMap = ref<Record<number, string>>({})
const GROUP_TIMEOUT_MS = 2 * 60 * 60 * 1000
const AUTO_RECEIVE_MS = 72 * 60 * 60 * 1000

function parseTime(ts?: string) {
  if (!ts) return null
  const date = new Date(String(ts).replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

function estimatePickupTip(createTime?: string, status?: number) {
  const date = parseTime(createTime)
  if (status === 3) return '订单已完成'
  if (status === 4) return '团长已核销，请尽快确认收货'
  if (status === -1) return '订单已取消（超时未成团将自动退款）'
  if (status === 0) return '待支付，支付后进入拼团'
  if (status === 1) {
    if (!date) return '待成团，2小时未成团将自动退款'
    const deadline = date.getTime() + GROUP_TIMEOUT_MS
    const remain = deadline - Date.now()
    if (remain <= 0) return '已触发超时退款，请下拉刷新'
    const mins = Math.ceil(remain / 60000)
    return `待成团，约${mins}分钟后未成团将自动退款`
  }
  if (!date) return '预计成团后2小时可提货'
  const hour = date.getHours()
  if (hour < 12) return '预计今日18:00后可提货'
  return '预计次日10:00后可提货'
}

async function autoConfirmIfNeeded(list: OrderInfo[]) {
  const now = Date.now()
  const confirmIds = list
    .filter((item) => item.status === 4)
    .filter((item) => {
      const date = parseTime(item.createTime)
      if (!date) return false
      return now - date.getTime() >= AUTO_RECEIVE_MS
    })
    .map((item) => item.id)
  const refundIds = list
    .filter((item) => item.status === 1)
    .filter((item) => {
      const date = parseTime(item.createTime)
      if (!date) return false
      return now - date.getTime() >= GROUP_TIMEOUT_MS
    })
    .map((item) => item.id)

  if (!confirmIds.length && !refundIds.length) return false
  for (const id of confirmIds) {
    try {
      await updateStatus(id, 3)
    } catch {
      // ignore single failure
    }
  }
  for (const id of refundIds) {
    try {
      await updateStatus(id, -1)
    } catch {
      // ignore single failure
    }
  }
  return true
}

function syncOrderTabBadge(list: OrderInfo[]) {
  const waiting = list.filter((item) => item.status === 1 || item.status === 2).length
  if (waiting > 0) {
    uni.setTabBarBadge({
      index: 2,
      text: waiting > 99 ? '99+' : String(waiting)
    })
  } else {
    uni.removeTabBarBadge({ index: 2 })
  }
}

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
    cover: productCoverMap.value[Number(item.productId || 0)] || '',
    qty: item.qty ?? 1,
    price: item.price || '0.00',
    statusUI: getStatusUI(item.status),
    pickupTip: estimatePickupTip(item.createTime, item.status)
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
  if (status === 4) return 'info'
  if (status === 2) return 'info'
  if (status === 0 || status === 1) return 'warning'
  return 'info'
}

async function loadOrderList() {
  userStore.hydrateUserId()
  if (!userStore.userId) {
    orderList.value = []
    errorMsg.value = '请先登录后查看订单'
    hasLoaded.value = true
    loading.value = false
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    try {
      const products = await getProductList()
      const map: Record<number, string> = {}
      products.forEach((item) => {
        map[item.id] = item.images?.[0] || ''
      })
      productCoverMap.value = map
    } catch {
      productCoverMap.value = {}
    }

    orderList.value = await getOrderList(userStore.userId)
    const changed = await autoConfirmIfNeeded(orderList.value)
    if (changed) {
      orderList.value = await getOrderList(userStore.userId)
    }
    syncOrderTabBadge(orderList.value)
    lastLoadedUserId.value = userStore.userId
    hasLoaded.value = true
  } catch (error) {
    errorMsg.value = '订单加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onShow(() => {
  userStore.hydrateUserId()
  const shouldRefresh = uni.getStorageSync(ORDER_REFRESH_FLAG)
  const userChanged = userStore.userId !== lastLoadedUserId.value

  if (hasLoaded.value && !shouldRefresh && !userChanged) return

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
    <scroll-view class="status-scroll" scroll-x show-scrollbar="false">
      <view class="status-row">
        <view
          v-for="item in statusList"
          :key="item.value"
          class="status-pill"
          :class="
            item.value === activeStatus
              ? 'status-pill-active'
              : 'status-pill-default'
          "
          @click="activeStatus = item.value"
        >
          <text class="status-pill-label">{{ item.label }}</text>
          <text class="status-pill-count">({{ statusCountMap[String(item.value)] || 0 }})</text>
        </view>
      </view>
    </scroll-view>

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
        class="p-4 space-y-3 bg-white rounded-xl shadow-sm active:opacity-90"
        @click="goToOrderDetail(item.id)"
      >
        <view class="flex justify-between text-sm text-gray-600">
          <text>订单号：{{ item.no }}</text>
          <BaseTag :kind="getStatusKind(item.status)" :text="item.statusUI.label" />
        </view>
        <view class="flex gap-3">
          <BaseSmartImage
            :src="item.cover"
            class-name="w-20 h-20 rounded-md bg-gray-100 flex-shrink-0"
            fallback-bg="#eef2f7"
            fallback-color="#667085"
            :fallback-text="item.name"
          />
          <view class="flex-1 min-w-0">
            <text class="text-base font-bold text-fresh line-clamp-2">{{ item.name }}</text>
            <view class="mt-2 flex items-center justify-between text-sm text-gray-600">
              <text>数量：{{ item.qty }}</text>
              <text class="text-primary font-bold">￥{{ item.price }}</text>
            </view>
            <text class="block text-xs text-gray-400 mt-2">
              下单时间: {{ item.createTime || '-' }}
            </text>
            <text class="block text-xs text-orange-500 mt-1">
              {{ item.pickupTip }}
            </text>
          </view>
        </view>
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

<style scoped>
.wxss-page-fix {
  display: block;
}

.status-scroll {
  width: 100%;
  white-space: nowrap;
}

.status-row {
  display: inline-flex;
  gap: 16rpx;
  padding: 4rpx 0 2rpx;
}

.status-pill {
  min-width: 120rpx;
  padding: 10rpx 18rpx;
  border-radius: 9999rpx;
  border: 1rpx solid #e5e7eb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.status-pill-active {
  background: #f08800;
  border-color: #f08800;
  color: #ffffff;
}

.status-pill-default {
  background: #ffffff;
  border-color: #e5e7eb;
  color: #4b5563;
}

.status-pill-label {
  font-size: 25rpx;
  line-height: 1.2;
  font-weight: 600;
}

.status-pill-count {
  font-size: 22rpx;
  line-height: 1.2;
}
</style>

