<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSmartImage from '@/components/base/BaseSmartImage.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import { ORDER_STATUS_FALLBACK, ORDER_STATUS_MAP } from '@/constants/order-status'
import { getOrderDetail, updateStatus } from '@/services/order'
import { getProductDetail } from '@/services/product'
import { useOrderStore } from '@/stores/order'
import type { ProductItem } from '@/types/product'
import { useUserStore } from '@/stores/user'
import type { OrderInfo } from '@/types/order'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const userStore = useUserStore()
const orderStore = useOrderStore()
const orderInfo = ref<OrderInfo | null>(null)
const found = ref(false)
const loading = ref(true)
const errorMsg = ref('')
const isNavigating = ref(false)
const currentOrderId = ref('')
const isLeader = ref(false)
const productDetail = ref<ProductItem | null>(null)
const priceLabel = ref('')

onLoad((query) => {
  const id = String(query?.id || '')
  currentOrderId.value = id
  if (!id) {
    loading.value = false
    errorMsg.value = '订单参数缺失，请返回订单列表重试'
    return
  }
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

const orderMeta = computed(() => {
  const id = orderInfo.value?.id || ''
  return id ? orderStore.getOrderMeta(id) : null
})

const couponLabel = computed(() => {
  const backendTitle = orderInfo.value?.couponTitle || ''
  const localTitle = orderMeta.value?.couponTitle || ''
  return backendTitle || localTitle
})

const couponAmountLabel = computed(() => {
  const backendAmount = orderInfo.value?.couponAmount || ''
  const localAmount = orderMeta.value?.couponAmount || ''
  const amount = backendAmount || localAmount
  if (!amount) return ''
  return amount.startsWith('-') ? amount : `-${amount}`
})

const remarkLabel = computed(() => {
  return orderInfo.value?.remark || orderMeta.value?.remark || ''
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
  productDetail.value = null
  priceLabel.value = ''

  try {
    const target = await fetchOrderDetail(id)
    if (!target) return
    orderInfo.value = target
    const productId = Number(target?.productId)
    if (Number.isFinite(productId) && productId > 0) {
      try {
        const detail = await getProductDetail(productId)
        productDetail.value = detail || null
        if (detail) {
          const groupPrice = detail.groupPrice2 ?? detail.groupPrice3 ?? detail.price
          const match = Math.abs(groupPrice - Number(target?.price || 0)) < 0.01
          priceLabel.value = match ? '团购价' : '单买价'
        }
      } catch (error) {
        productDetail.value = null
      }
    }
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
  const targetId = Number(orderInfo.value.productId || 0)
  if (!targetId) {
    uni.showToast({ title: '商品信息缺失，无法再次购买', icon: 'none' })
    return
  }
  isNavigating.value = true
  uni.navigateTo({
    url: `/pages/group-buy/group-buy?id=${targetId}`,
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
    <view v-else-if="found" class="space-y-3 pb-2">
      <view class="bg-white rounded-xl shadow-sm p-4">
        <view class="flex items-center justify-between">
          <view>
            <text class="block text-xs text-gray-400">订单号</text>
            <text class="block text-sm text-gray-700 mt-1">{{ orderInfo?.no }}</text>
          </view>
          <BaseTag :kind="currentStatusKind" :text="currentStatusUI.label" />
        </view>
        <view class="mt-3 pt-3 border-t border-gray-100 space-y-1">
          <text class="text-xs text-gray-400">下单时间：{{ displayCreateTime }}</text>
          <text v-if="remarkLabel" class="block text-xs text-gray-500">备注：{{ remarkLabel }}</text>
        </view>
      </view>

      <view class="bg-white rounded-xl shadow-sm p-4">
        <text class="block text-sm font-bold text-fresh mb-3">商品信息</text>
        <view class="flex gap-3">
          <BaseSmartImage
            :src="productDetail?.images?.[0] || ''"
            class-name="w-24 h-24 rounded-md bg-gray-100 flex-shrink-0"
            fallback-bg="#eef2f7"
            fallback-color="#667085"
            :fallback-text="orderInfo?.name || '商品图片'"
          />
          <view class="flex-1 min-w-0">
            <text class="block text-base font-bold text-fresh line-clamp-2">{{
              orderInfo?.name
            }}</text>
            <view class="mt-2 flex items-end gap-2">
              <text class="text-xs text-primary pb-0.5">实付</text>
              <text class="text-xl font-bold text-primary leading-none">￥{{ orderInfo?.price }}</text>
              <text v-if="priceLabel" class="text-xs text-gray-400">({{ priceLabel }})</text>
            </view>
            <view v-if="couponLabel" class="mt-2 flex items-center gap-1">
              <text class="text-xs text-gray-500">优惠券</text>
              <text class="text-xs text-fresh">{{ couponLabel }}</text>
              <text v-if="couponAmountLabel" class="text-xs text-primary">{{ couponAmountLabel }}</text>
            </view>
            <text class="block mt-2 text-xs text-gray-500">数量：{{ orderInfo?.qty }}</text>
          </view>
        </view>
      </view>

      <view class="bg-white rounded-xl shadow-sm p-4">
        <text class="block text-sm font-bold text-fresh mb-2">自提信息</text>
        <text class="block text-sm text-gray-700">{{ orderInfo?.pickPointName || '-' }}</text>
        <text class="block text-xs text-gray-500 mt-1">{{
          orderInfo?.pickPointAddress || '-'
        }}</text>
      </view>

      <view
        v-if="productDetail"
        class="bg-white rounded-xl shadow-sm p-4 space-y-2"
      >
        <text class="block text-sm font-bold text-fresh">价格参考</text>
        <view class="flex items-center justify-between text-sm text-gray-600">
          <text>团购价(2人)</text>
          <text>￥{{ (productDetail.groupPrice2 ?? productDetail.price).toFixed(2) }}</text>
        </view>
        <view class="flex items-center justify-between text-sm text-gray-600">
          <text>团购价(3人)</text>
          <text>￥{{ (productDetail.groupPrice3 ?? productDetail.price).toFixed(2) }}</text>
        </view>
      </view>

      <view v-if="nextStatus && isLeader" class="w-full pt-1">
        <BaseButton class="w-full order-action-btn" :text="nextStatusText" @click="handleUpdateStatus" />
      </view>

      <view class="flex gap-3 text-center pt-1">
        <BaseButton class="flex-1 order-action-btn" type="default" text="返回订单" @click="goBackToOrder" />
        <BaseButton class="flex-1 order-action-btn" text="再次购买" @click="buyAgain" />
      </view>
    </view>

    <!-- 4) 空态 -->
    <view v-else class="p-4 py-8 text-center bg-white rounded-lg shadow-sm">
      <text class="text-sm text-gray-400">订单不存在或已失效</text>
    </view>
  </view>
</template>

<style scoped>
.order-action-btn {
  min-height: 76rpx;
}
</style>
