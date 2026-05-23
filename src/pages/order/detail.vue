<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSmartImage from '@/components/base/BaseSmartImage.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import { ORDER_STATUS_FALLBACK, ORDER_STATUS_MAP } from '@/constants/order-status'
import { getOrderDetail, updateStatus } from '@/services/order'
import { getProductDetail } from '@/services/product'
import { canCreateProductReview, createProductReview } from '@/services/review'
import { useOrderStore } from '@/stores/order'
import type { ProductItem } from '@/types/product'
import { useUserStore } from '@/stores/user'
import type { OrderInfo } from '@/types/order'
import { isLeaderUser } from '@/utils/leader'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const userStore = useUserStore()
const orderStore = useOrderStore()
const orderInfo = ref<OrderInfo | null>(null)
const found = ref(false)
const loading = ref(true)
const errorMsg = ref('')
const isNavigating = ref(false)
const actionLoading = ref(false)
const reviewContent = ref('')
const reviewSubmitting = ref(false)
const canReview = ref(false)
const showConfirmModal = ref(false)
const showAfterSaleModal = ref(false)
const showReviewModal = ref(false)
const afterSaleType = ref<'refund_only' | 'return_refund' | 'reject_delivery'>(
  'refund_only'
)
const afterSaleReceiptState = ref<'received' | 'not_received'>('received')
const afterSaleReason = ref('')
const currentOrderId = ref('')
const isLeader = ref(false)
const productDetail = ref<ProductItem | null>(null)
const priceLabel = ref('')
const GROUP_TIMEOUT_MS = 2 * 60 * 60 * 1000
const AUTO_RECEIVE_MS = 72 * 60 * 60 * 1000

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
  isLeader.value = isLeaderUser(info?.isLeader)
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
  if (s === 4) return 'info'
  if (s === 2) return 'info'
  if (s === 0 || s === 1) return 'warning'
  return 'info'
})

const displayCreateTime = computed(() => {
  const raw = orderInfo.value?.createTime || ''
  return raw ? raw.replace('T', ' ') : '-'
})

const nextStatus = computed<number | null>(() => {
  const s = orderInfo.value?.status
  if (s === 4) return 3
  return null
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

const paymentMethodLabel = computed(() => {
  return '余额支付'
})

const orderTypeLabel = computed(() => {
  return '拼团订单'
})

const orderChannelLabel = computed(() => {
  return '微信小程序'
})

const groupTargetCount = computed(() => {
  const gid = String(orderInfo.value?.groupBuyId || '')
  if (gid.startsWith('GB3-')) return 3
  return 2
})

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
  canReview.value = false

  try {
    const target = await fetchOrderDetail(id)
    if (!target) return
    orderInfo.value = target
    const dt = new Date(String(target.createTime || '').replace(' ', 'T'))
    const ts = Number.isNaN(dt.getTime()) ? 0 : dt.getTime()
    if (target.status === 4 && ts && Date.now() - ts >= AUTO_RECEIVE_MS) {
      await updateStatus(target.id, 3)
      const refreshed = await fetchOrderDetail(id)
      if (refreshed) orderInfo.value = refreshed
    }
    if (target.status === 1 && ts && Date.now() - ts >= GROUP_TIMEOUT_MS) {
      await updateStatus(target.id, -1)
      const refreshed = await fetchOrderDetail(id)
      if (refreshed) orderInfo.value = refreshed
    }
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
      try {
        const reviewed = Number(target?.isReviewed || 0) === 1
        canReview.value = reviewed ? false : await canCreateProductReview(productId, String(target.id || ''))
      } catch {
        canReview.value = false
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

function buyAgain() {
  if (isNavigating.value || !orderInfo.value) return
  const targetId = Number(orderInfo.value.productId || 0)
  if (!targetId) {
    uni.showToast({ title: '商品信息缺失，无法再次购买', icon: 'none' })
    return
  }
  const storedPickId = Number(uni.getStorageSync('default_pick_point_id'))
  if (!Number.isFinite(storedPickId) || storedPickId <= 0) {
    uni.showToast({ title: '请先设置默认自提点', icon: 'none' })
    uni.navigateTo({ url: '/pages/self-pick/self-pick' })
    return
  }
  isNavigating.value = true
  uni.navigateTo({
    url: `/pages/group-buy/group-buy?id=${targetId}&pickPointId=${storedPickId}`,
    complete: () => {
      isNavigating.value = false
    }
  })
}

function goLeaderWorkbench() {
  uni.navigateTo({ url: '/pages/leader/leader' })
}

const canConfirmReceipt = computed(() => {
  return orderInfo.value?.status === 4
})

const canRefund = computed(() => {
  const s = orderInfo.value?.status
  return s === 0 || s === 1 || s === 2 || s === 4
})

const systemRuleTip = computed(() => {
  const s = orderInfo.value?.status
  if (s === 1) return '系统规则：下单后2小时未成团将自动退款。'
  if (s === 2) return '系统规则：请到自提点提货，团长核销后可确认收货。'
  if (s === 4) return '系统规则：团长核销后超过3天将自动确认收货。'
  return '系统规则：状态会随团购与履约进度自动更新。'
})

async function confirmReceipt() {
  if (!orderInfo.value?.id || actionLoading.value) return
  showConfirmModal.value = true
}

async function applyRefund() {
  if (!orderInfo.value?.id || actionLoading.value) return
  afterSaleReceiptState.value = 'received'
  afterSaleReason.value = ''
  showAfterSaleModal.value = true
}

async function doConfirmReceipt() {
  if (!orderInfo.value?.id || actionLoading.value) return
  actionLoading.value = true
  try {
    await updateStatus(orderInfo.value.id, 3)
    showConfirmModal.value = false
    uni.setStorageSync('order_need_refresh', true)
    uni.showToast({ title: '已确认收货', icon: 'success' })
    await loadOrderDetail(String(orderInfo.value.id))
    if (canReview.value) {
      showReviewModal.value = true
    }
  } catch (error: any) {
    uni.showToast({ title: error?.message || '确认收货失败', icon: 'none' })
  } finally {
    actionLoading.value = false
  }
}

async function doApplyRefund() {
  if (!orderInfo.value?.id || actionLoading.value) return
  if (!afterSaleReason.value) {
    uni.showToast({ title: '请选择售后原因', icon: 'none' })
    return
  }
  const tipMap = {
    refund_only: '仅退款',
    return_refund: '退货退款',
    reject_delivery: '拒收退款'
  } as const
  actionLoading.value = true
  try {
    await updateStatus(orderInfo.value.id, -1)
    showAfterSaleModal.value = false
    uni.setStorageSync('order_need_refresh', true)
    uni.showToast({ title: `${tipMap[afterSaleType.value]}申请已提交，团长将联系您`, icon: 'success' })
    await loadOrderDetail(String(orderInfo.value.id))
  } catch (error: any) {
    uni.showToast({ title: error?.message || '退款申请失败', icon: 'none' })
  } finally {
    actionLoading.value = false
  }
}

const receivedReasonOptions = [
  { label: '质量问题', value: 'quality_issue' },
  { label: '自提点选错了', value: 'wrong_pick_point' },
  { label: '不想要了', value: 'dont_want' }
]

const notReceivedReasonOptions = [
  { label: '超时未到货', value: 'delivery_timeout' },
  { label: '不想继续等待', value: 'no_longer_waiting' },
  { label: '拼团失败', value: 'group_failed' }
]

const canShowReviewInput = computed(() => {
  const reviewed = Number(orderInfo.value?.isReviewed || 0) === 1
  return orderInfo.value?.status === 3 && !reviewed && canReview.value
})

const canOpenReview = computed(() => {
  return canShowReviewInput.value
})

async function submitReview() {
  if (!orderInfo.value?.productId || reviewSubmitting.value) return
  const content = reviewContent.value.trim()
  if (!content) {
    uni.showToast({ title: '请先填写评价', icon: 'none' })
    return
  }
  if (content.length > 200) {
    uni.showToast({ title: '评价最多200字', icon: 'none' })
    return
  }
  reviewSubmitting.value = true
  try {
    await createProductReview({
      orderId: String(orderInfo.value.id || ''),
      productId: Number(orderInfo.value.productId),
      content,
      rating: 5
    })
    reviewContent.value = ''
    canReview.value = false
    if (orderInfo.value) {
      orderInfo.value.isReviewed = 1
    }
    showReviewModal.value = false
    uni.showToast({ title: '评价成功', icon: 'success' })
  } catch (error: any) {
    uni.showToast({ title: error?.message || '评论失败', icon: 'none' })
  } finally {
    reviewSubmitting.value = false
  }
}
</script>

<template>
  <view class="min-h-screen px-4 pt-4 space-y-4 bg-gray-50" style="padding-bottom: calc(220rpx + var(--safe-bottom))">
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
      <view class="status-hero">
        <view>
          <text class="block text-[22rpx] text-white/80">当前状态</text>
          <text class="block text-[36rpx] font-bold text-white mt-1">{{ currentStatusUI.label }}</text>
        </view>
        <BaseTag :kind="currentStatusKind" :text="currentStatusUI.label" />
      </view>

      <view class="bg-white rounded-xl shadow-sm p-4">
        <view class="flex items-center justify-between">
          <view>
            <text class="block text-xs text-gray-400">订单号</text>
            <text class="block text-sm text-gray-700 mt-1">{{ orderInfo?.no }}</text>
          </view>
        </view>
        <view class="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <text class="text-xs text-gray-400">下单时间：{{ displayCreateTime }}</text>
          <view v-if="orderInfo?.groupBuyId" class="flex items-center justify-between text-xs text-gray-500">
            <text>拼团号</text>
            <text>{{ orderInfo?.groupBuyId }}</text>
          </view>
          <view v-if="orderInfo?.groupBuyId" class="flex items-center justify-between text-xs text-gray-500">
            <text>拼团规则</text>
            <text>{{ groupTargetCount }}人团（同拼团号即同一团）</text>
          </view>
          <view class="flex items-center justify-between text-xs text-gray-500">
            <text>订单类型</text>
            <text>{{ orderTypeLabel }}</text>
          </view>
          <view class="flex items-center justify-between text-xs text-gray-500">
            <text>支付方式</text>
            <text>{{ paymentMethodLabel }}</text>
          </view>
          <view class="flex items-center justify-between text-xs text-gray-500">
            <text>下单渠道</text>
            <text>{{ orderChannelLabel }}</text>
          </view>
          <view class="flex items-center justify-between text-xs text-gray-500">
            <text>自动确认收货</text>
            <text>团长核销后3天自动确认</text>
          </view>
          <text v-if="remarkLabel" class="block text-xs text-gray-500">备注：{{ remarkLabel }}</text>
          <text class="block text-xs text-orange-500">{{ systemRuleTip }}</text>
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
              <text class="text-[44rpx] font-bold text-primary leading-none">￥{{ orderInfo?.price }}</text>
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

      <view v-if="canRefund" class="bg-[#fff7ed] border border-[#fed7aa] rounded-xl p-3 space-y-2">
        <text class="block text-xs text-[#9a3412]">售后服务：仅退款 / 退货退款 / 拒收</text>
        <view class="flex flex-wrap gap-2">
          <view
            class="px-3 py-1 rounded-full text-xs border"
            :class="afterSaleType === 'refund_only' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'"
            @click="afterSaleType = 'refund_only'"
          >仅退款</view>
          <view
            class="px-3 py-1 rounded-full text-xs border"
            :class="afterSaleType === 'return_refund' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'"
            @click="afterSaleType = 'return_refund'"
          >退货退款</view>
          <view
            class="px-3 py-1 rounded-full text-xs border"
            :class="afterSaleType === 'reject_delivery' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'"
            @click="afterSaleType = 'reject_delivery'"
          >拒收</view>
        </view>
      </view>

      <view v-if="orderInfo?.status === 2 && isLeader" class="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
        <text class="block text-xs text-amber-700">
          团长核销操作已统一到「团长工作台」，订单详情仅展示状态。
        </text>
        <BaseButton class="w-full order-action-btn" text="去团长工作台核销" @click="goLeaderWorkbench" />
      </view>

    </view>

    <!-- 4) 空态 -->
    <view v-else class="p-4 py-8 text-center bg-white rounded-lg shadow-sm">
      <text class="text-sm text-gray-400">订单不存在或已失效</text>
    </view>
    <view v-if="found" class="action-bar">
      <view class="flex gap-3">
        <BaseButton
          v-if="canRefund"
          class="flex-1 order-action-btn"
          type="default"
          :loading="actionLoading"
          text="申请售后"
          @click="applyRefund"
        />
        <BaseButton
          v-if="canConfirmReceipt"
          class="flex-1 order-action-btn"
          :loading="actionLoading"
          text="确认收货"
          @click="confirmReceipt"
        />
        <BaseButton
          v-if="canOpenReview"
          class="flex-1 order-action-btn"
          type="default"
          text="去评价"
          @click="showReviewModal = true"
        />
        <BaseButton class="flex-1 order-action-btn" text="再次购买" @click="buyAgain" />
      </view>
    </view>

    <view v-if="showConfirmModal" class="popup-mask" @click="showConfirmModal = false">
      <view class="popup-card" @click.stop>
        <text class="popup-title">确认收货</text>
        <text class="popup-desc">确认已完成提货吗？</text>
        <view class="popup-actions">
          <BaseButton class="flex-1 order-action-btn" type="default" text="再看看" @click="showConfirmModal = false" />
          <BaseButton class="flex-1 order-action-btn" :loading="actionLoading" text="确认收货" @click="doConfirmReceipt" />
        </view>
      </view>
    </view>

    <view v-if="showAfterSaleModal" class="popup-mask" @click="showAfterSaleModal = false">
      <view class="popup-card" @click.stop>
        <text class="popup-title">申请售后</text>
        <text class="popup-desc">请选择收货状态和原因，提交后团长将联系您处理。</text>
        <view class="mt-3">
          <text class="block text-xs text-gray-500 mb-2">收货状态</text>
          <view class="flex gap-2">
            <view
              class="px-3 py-1 rounded-full text-xs border"
              :class="afterSaleReceiptState === 'received' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'"
              @click="afterSaleReceiptState = 'received'; afterSaleReason = ''"
            >已收到货</view>
            <view
              class="px-3 py-1 rounded-full text-xs border"
              :class="afterSaleReceiptState === 'not_received' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'"
              @click="afterSaleReceiptState = 'not_received'; afterSaleReason = ''"
            >未收到货</view>
          </view>
        </view>
        <view class="flex flex-wrap gap-2 mt-2">
          <view
            class="px-3 py-1 rounded-full text-xs border"
            :class="afterSaleType === 'refund_only' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'"
            @click="afterSaleType = 'refund_only'"
          >仅退款</view>
          <view
            class="px-3 py-1 rounded-full text-xs border"
            :class="afterSaleType === 'return_refund' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'"
            @click="afterSaleType = 'return_refund'"
          >退货退款</view>
          <view
            class="px-3 py-1 rounded-full text-xs border"
            :class="afterSaleType === 'reject_delivery' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'"
            @click="afterSaleType = 'reject_delivery'"
          >拒收</view>
        </view>
        <view class="mt-3">
          <text class="block text-xs text-gray-500 mb-2">售后原因</text>
          <view class="flex flex-wrap gap-2">
            <view
              v-for="item in (afterSaleReceiptState === 'received' ? receivedReasonOptions : notReceivedReasonOptions)"
              :key="item.value"
              class="px-3 py-1 rounded-full text-xs border"
              :class="afterSaleReason === item.value ? 'bg-[#16a34a] text-white border-[#16a34a]' : 'bg-white text-gray-600 border-gray-200'"
              @click="afterSaleReason = item.value"
            >{{ item.label }}</view>
          </view>
        </view>
        <view class="popup-actions">
          <BaseButton class="flex-1 order-action-btn" type="default" text="取消" @click="showAfterSaleModal = false" />
          <BaseButton class="flex-1 order-action-btn" :loading="actionLoading" text="提交申请" @click="doApplyRefund" />
        </view>
      </view>
    </view>

    <view v-if="showReviewModal" class="popup-mask" @click="showReviewModal = false">
      <view class="popup-card" @click.stop>
        <text class="popup-title">订单评价</text>
        <text class="popup-desc">评价后可帮助其他用户判断拼团体验。</text>
        <textarea
          v-model="reviewContent"
          class="review-input mt-2"
          :maxlength="200"
          placeholder="说说这次拼团和到货体验吧（最多200字）"
        />
        <view class="flex items-center justify-between mt-2">
          <text class="text-[22rpx] text-gray-400">{{ reviewContent.length }}/200</text>
          <BaseButton :loading="reviewSubmitting" :text="reviewSubmitting ? '提交中...' : '提交评价'" @click="submitReview" />
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.status-hero {
  background: linear-gradient(135deg, #f59e0b 0%, #f08800 60%, #e67700 100%);
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 10rpx 24rpx rgba(240, 136, 0, 0.25);
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  border-top: 1rpx solid #e5e7eb;
  padding: 20rpx 24rpx;
  padding-bottom: calc(var(--safe-bottom) + 16rpx);
  z-index: 40;
}

.order-action-btn {
  min-height: 92rpx;
}

.order-action-btn :deep(view) {
  min-height: 92rpx;
  padding: 0 28rpx;
  border-radius: 9999rpx;
}

.order-action-btn :deep(text) {
  font-size: 30rpx;
  line-height: 42rpx;
}

.review-input {
  width: 100%;
  min-height: 120rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 16rpx;
  font-size: 26rpx;
  line-height: 1.5;
}

.popup-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
  display: flex;
  align-items: flex-end;
  z-index: 60;
}

.popup-card {
  width: 100%;
  background: #ffffff;
  border-top-left-radius: 28rpx;
  border-top-right-radius: 28rpx;
  padding: 28rpx 24rpx calc(var(--safe-bottom) + 22rpx);
}

.popup-title {
  font-size: 32rpx;
  color: #1f2937;
  font-weight: 700;
}

.popup-desc {
  margin-top: 8rpx;
  display: block;
  font-size: 24rpx;
  color: #6b7280;
}

.popup-actions {
  margin-top: 24rpx;
  display: flex;
  gap: 20rpx;
}
</style>
