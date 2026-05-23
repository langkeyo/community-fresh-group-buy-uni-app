<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseField from '@/components/base/BaseField.vue'
import BaseSmartImage from '@/components/base/BaseSmartImage.vue'
import { getActiveGroupBuyCampaignListApi } from '@/api/group-buy'
import { createOrder, getOpenGroupList } from '@/services/order'
import type { OpenGroupItem } from '@/api/order'
import { getPickPointDetail } from '@/services/pick-point'
import { getProductDetail } from '@/services/product'
import { getEnabledCoupons } from '@/services/coupon'
import { requestOrderSubscribeOnce } from '@/services/subscribe'
import { useOrderStore } from '@/stores/order'
import type { ProductItem } from '@/types/product'
import { useUserStore } from '@/stores/user'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref, watch } from 'vue'

const userStore = useUserStore()
const orderStore = useOrderStore()
const ORDER_REFRESH_FLAG = 'order_need_refresh'
const GROUP_BUY_FORM_CACHE_KEY = 'group_buy_form_cache_v1'
const isSubmitting = ref(false)
const currentAction = ref<'start' | 'join' | ''>('')
const pendingAction = ref<'start' | 'join' | ''>('')
const showPaySheet = ref(false)
const payMethod = ref<'balance' | 'wechat'>('balance')
const formData = ref({
  groupType: 2,
  receiverName: '',
  mobile: '',
  pickupPoint: '',
  couponId: 'none',
  remark: ''
})
const productId = ref<number | null>(null)
const pickPointId = ref<number | null>(null)
const productName = ref('商品')
const productDetail = ref<ProductItem | null>(null)
const openGroups = ref<OpenGroupItem[]>([])
const selectedGroupId = ref('')
const loadingGroups = ref(false)
const hasActiveCampaign = ref(true)
const pendingJoinGroupId = ref('')
const couponSourceHint = ref('正在加载优惠券...')

function loadFormCache() {
  userStore.hydrateUserId()
  const raw = uni.getStorageSync(GROUP_BUY_FORM_CACHE_KEY)
  const all = raw && typeof raw === 'object' ? raw : {}
  const byUser = Number(userStore.userId || 0)
    ? (all[String(userStore.userId)] as Record<string, any>) || {}
    : {}
  formData.value.receiverName = String(byUser.receiverName || '').slice(0, 20)
  formData.value.mobile = String(byUser.mobile || '').slice(0, 11)
  formData.value.remark = String(byUser.remark || '').slice(0, 80)
}

function saveFormCache() {
  userStore.hydrateUserId()
  if (!userStore.userId) return
  const raw = uni.getStorageSync(GROUP_BUY_FORM_CACHE_KEY)
  const all = raw && typeof raw === 'object' ? raw : {}
  all[String(userStore.userId)] = {
    receiverName: formData.value.receiverName.trim(),
    mobile: formData.value.mobile.trim(),
    remark: formData.value.remark.trim()
  }
  uni.setStorageSync(GROUP_BUY_FORM_CACHE_KEY, all)
}

function clearFormCache() {
  userStore.hydrateUserId()
  if (!userStore.userId) return
  const raw = uni.getStorageSync(GROUP_BUY_FORM_CACHE_KEY)
  const all = raw && typeof raw === 'object' ? raw : {}
  if (all[String(userStore.userId)]) {
    delete all[String(userStore.userId)]
    uni.setStorageSync(GROUP_BUY_FORM_CACHE_KEY, all)
  }
}

watch(
  () => [formData.value.receiverName, formData.value.mobile, formData.value.remark],
  () => {
    saveFormCache()
  }
)

const displayPrice = computed(() => {
  if (!productDetail.value) return '--'
  const groupPrice =
    formData.value.groupType === 2
      ? (productDetail.value.groupPrice2 ?? productDetail.value.price)
      : (productDetail.value.groupPrice3 ?? productDetail.value.price)
  return groupPrice.toFixed(2)
})

const displayOriginPrice = computed(() => {
  if (!productDetail.value) return '--'
  return productDetail.value.price.toFixed(2)
})

const coverImage = computed(() => {
  return productDetail.value?.images?.[0] || ''
})

const selectedOpenGroup = computed(() => {
  return openGroups.value.find((x) => x.groupBuyId === selectedGroupId.value)
})

const progressCurrent = computed(() => {
  return selectedOpenGroup.value?.currentCount || 1
})

const progressTarget = computed(() => {
  return selectedOpenGroup.value?.targetCount || formData.value.groupType
})

const progressWidth = computed(() => {
  const ratio = Math.max(
    0,
    Math.min(1, progressCurrent.value / Math.max(1, progressTarget.value))
  )
  return `${Math.round(ratio * 100)}%`
})

const selectedCoupon = computed(() => {
  return (
    orderStore.getCouponById(formData.value.couponId) ||
    orderStore.couponList[0]
  )
})

const couponDiscount = computed(() => {
  const coupon = selectedCoupon.value
  if (!coupon) return 0
  const subtotal = Number(displayPrice.value || 0)
  if (subtotal < coupon.minimumSpend) return 0
  return coupon.discount
})

const finalPayable = computed(() => {
  const subtotal = Number(displayPrice.value || 0)
  const payable = Math.max(0, subtotal - couponDiscount.value)
  return payable.toFixed(2)
})

const payMethodLabel = computed(() => {
  return payMethod.value === 'balance' ? '余额支付' : '微信支付'
})

function validateForm() {
  if (!formData.value.receiverName.trim()) {
    uni.showToast({
      title: '请输入收件人姓名',
      icon: 'none'
    })
    return false
  }

  if (!formData.value.mobile.trim()) {
    uni.showToast({
      title: '请输入手机号',
      icon: 'none'
    })
    return false
  }

  const mobileReg = /^1\d{10}$/

  if (!mobileReg.test(formData.value.mobile.trim())) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none'
    })
    return false
  }

  return true
}

async function submitGroupBuy(
  action: 'start' | 'join',
  productId: number,
  pickPointId: number
) {
  // 价格为占位展示，不参与业务计算（后端暂无真实价格字段）
  const groupPrice =
    formData.value.groupType === 2
      ? (productDetail.value?.groupPrice2 ?? productDetail.value?.price ?? 0)
      : (productDetail.value?.groupPrice3 ?? productDetail.value?.price ?? 0)
  let groupBuyId: string | null = null
  if (action === 'start') {
    groupBuyId = `GB${formData.value.groupType}-${Date.now()}-${userStore.userId}`
  } else {
    groupBuyId = selectedGroupId.value || null
  }

  const payload = {
    userId: userStore.userId,
    productId: productId,
    totalPrice: Number(finalPayable.value),
    pickPointId: pickPointId,
    groupBuyId,
    couponId:
      selectedCoupon.value?.id !== 'none'
        ? selectedCoupon.value?.id
        : undefined,
    couponTitle:
      selectedCoupon.value?.id !== 'none'
        ? selectedCoupon.value?.title
        : undefined,
    couponAmount: couponDiscount.value > 0 ? couponDiscount.value : undefined,
    remark: formData.value.remark.trim() || undefined
  }

  const orderId = await createOrder(payload)
  if (orderId) {
    orderStore.saveOrderMeta(orderId, {
      couponId: payload.couponId,
      couponTitle: payload.couponTitle,
      couponAmount: payload.couponAmount ? payload.couponAmount.toFixed(2) : '',
      remark: payload.remark || ''
    })
  }

  uni.showToast({
    title: action === 'start' ? '发起拼团成功' : '加入拼团成功',
    icon: 'success'
  })
}

function resetForm() {
  formData.value = {
    groupType: 2,
    receiverName: '',
    mobile: '',
    pickupPoint: '',
    couponId: 'none',
    remark: ''
  }
  clearFormCache()
}

async function handleSubmitGroupBuy(action: 'start' | 'join') {
  userStore.hydrateUserId()
  if (isSubmitting.value) return
  if (!userStore.userId) {
    uni.showToast({ title: '请先登录后再下单', icon: 'none' })
    return
  }
  if (!validateForm()) return
  if (!hasActiveCampaign.value) {
    uni.showToast({ title: '当前商品未开团，暂不可拼团下单', icon: 'none' })
    return
  }
  if (
    productDetail.value?.stock !== undefined &&
    productDetail.value.stock <= 0
  ) {
    uni.showToast({ title: '库存不足，请稍后再试', icon: 'none' })
    return
  }

  if (productId.value === null) {
    uni.showToast({ title: '商品信息缺失，请返回重试', icon: 'none' })
    return
  }

  if (pickPointId.value === null) {
    uni.showToast({ title: '自提点信息缺失，请返回重试', icon: 'none' })
    return
  }

  if (action === 'join' && !selectedGroupId.value) {
    uni.showToast({ title: '请先选择可加入的拼团', icon: 'none' })
    return
  }

  const safeProductId = productId.value // 这里的类型是 number
  const safePickPointId = pickPointId.value

  currentAction.value = action
  isSubmitting.value = true

  try {
    await requestOrderSubscribeOnce()
    await submitGroupBuy(action, safeProductId, safePickPointId)

    resetForm()
    uni.setStorageSync(ORDER_REFRESH_FLAG, true)
    uni.switchTab({
      url: '/pages/order/order'
    })
  } catch (error: any) {
    const code = Number(error?.code)
    if (code === 3003) {
      uni.showToast({ title: '订单创建失败', icon: 'none' })
    } else {
      uni.showToast({ title: '拼团提交失败', icon: 'none' })
    }
  } finally {
    isSubmitting.value = false
    currentAction.value = ''
  }
}

async function checkActiveCampaign() {
  if (productId.value === null) {
    hasActiveCampaign.value = false
    return
  }
  try {
    const res = await getActiveGroupBuyCampaignListApi({
      productId: productId.value,
      pickPointId: pickPointId.value || undefined
    })
    hasActiveCampaign.value = res.code === 200 && (res.data || []).length > 0
  } catch {
    hasActiveCampaign.value = false
  }
}

function openPaySheet(action: 'start' | 'join') {
  if (isSubmitting.value) return
  pendingAction.value = action
  payMethod.value = 'balance'
  showPaySheet.value = true
}

function closePaySheet() {
  if (isSubmitting.value) return
  showPaySheet.value = false
  pendingAction.value = ''
}

async function handleConfirmPay() {
  if (payMethod.value !== 'balance') return
  if (!pendingAction.value) return
  showPaySheet.value = false
  await handleSubmitGroupBuy(pendingAction.value)
}

function pickOpenGroup(item: OpenGroupItem) {
  selectedGroupId.value = item.groupBuyId
  formData.value.groupType = item.targetCount === 3 ? 3 : 2
}

async function loadOpenGroups() {
  if (productId.value === null || pickPointId.value === null) {
    openGroups.value = []
    selectedGroupId.value = ''
    return
  }
  loadingGroups.value = true
  try {
    const list = await getOpenGroupList(productId.value, pickPointId.value)
    openGroups.value = list
    if (pendingJoinGroupId.value && list.find((x) => x.groupBuyId === pendingJoinGroupId.value)) {
      selectedGroupId.value = pendingJoinGroupId.value
      const matched = list.find((x) => x.groupBuyId === pendingJoinGroupId.value)
      if (matched) {
        formData.value.groupType = matched.targetCount === 3 ? 3 : 2
      }
      pendingJoinGroupId.value = ''
    } else if (!list.find((x) => x.groupBuyId === selectedGroupId.value)) {
      selectedGroupId.value = ''
    }
  } catch (error: any) {
    openGroups.value = []
    selectedGroupId.value = ''
    uni.showToast({ title: error?.message || '拼团列表加载失败', icon: 'none' })
  } finally {
    loadingGroups.value = false
  }
}

async function loadEnabledCoupons() {
  try {
    const list = await getEnabledCoupons()
    orderStore.setCouponList(list)
    couponSourceHint.value = list.length
      ? `已加载 ${list.length} 张可用优惠券`
      : '暂无可用优惠券'
    const valid = orderStore.getCouponById(formData.value.couponId)
    if (!valid) {
      formData.value.couponId = 'none'
    }
  } catch {
    orderStore.setCouponList([])
    formData.value.couponId = 'none'
    couponSourceHint.value = '优惠券加载失败，当前仅支持不使用优惠券'
  }
}

onLoad(async (query) => {
  loadFormCache()
  const id = Number(query?.id)
  productId.value = Number.isFinite(id) && id > 0 ? id : null

  const pp = Number(query?.pickPointId)
  pickPointId.value = Number.isFinite(pp) && pp > 0 ? pp : null
  pendingJoinGroupId.value = String(query?.joinGroupId || '').trim()

  if (pickPointId.value) {
    formData.value.pickupPoint = `自提点#${pickPointId.value}`
  }

  if (productId.value) {
    try {
      const info = await getProductDetail(productId.value)
      productDetail.value = info || null
      productName.value = info?.name || `商品#${productId.value}`
    } catch (error: any) {
      uni.showToast({
        title: error?.message || '商品信息加载失败',
        icon: 'none'
      })
    }
  }

  if (pickPointId.value) {
    try {
      const point = await getPickPointDetail(pickPointId.value)
      if (point) {
        formData.value.pickupPoint = `${point.name}（${point.address}）`
      }
    } catch (error: any) {
      uni.showToast({
        title: error?.message || '自提点信息加载失败',
        icon: 'none'
      })
    }
  }

  await loadEnabledCoupons()
  await checkActiveCampaign()
  await loadOpenGroups()
})
</script>

<template>
  <view
    class="min-h-screen px-4 pt-4 space-y-4 bg-gray-50"
    style="padding-bottom: calc(220rpx + var(--safe-bottom))"
  >
    <text class="text-base font-bold text-fresh">拼团详情</text>

    <!-- 商品信息区 -->
    <view class="p-4 space-y-2 bg-white rounded-lg shadow-sm">
      <BaseSmartImage
        :src="coverImage"
        class-name="w-full h-32 rounded-md bg-secondary"
        fallback-bg="#eef2f7"
        fallback-color="#667085"
        :fallback-text="productName"
      />
      <text class="text-base font-bold text-fresh">{{ productName }}</text>
      <view class="flex items-center gap-2">
        <text class="text-xs text-primary">￥</text>
        <text class="text-lg font-bold text-primary">{{ displayPrice }}</text>
        <text class="text-xs text-gray-400 line-through"
          >￥{{ displayOriginPrice }}</text
        >
      </view>
    </view>

    <!-- 拼团规则区 -->
    <view class="p-4 space-y-2 bg-white rounded-lg shadow-sm">
      <text class="text-base font-bold text-fresh">拼团规则</text>
      <text class="block ml-4 text-sm text-gray-600"
        >- 2人/3人团，24小时内成团</text
      >
      <text class="block ml-4 text-sm text-gray-600"
        >- 成团成功后可到自提点取货</text
      >
    </view>

    <!-- 拼团进度 -->
    <view class="p-4 space-y-2 bg-white rounded-lg shadow-sm">
      <text class="text-base font-bold text-fresh">拼团进度</text>
      <view class="flex items-center justify-between text-sm text-gray-600">
        <text>已参与 {{ progressCurrent }} 人</text>
        <text>目标 {{ progressTarget }} 人</text>
      </view>

      <view class="h-2 overflow-hidden bg-gray-200 rounded-full">
        <view
          class="h-full bg-primary"
          :style="{ width: progressWidth }"
        ></view>
      </view>
    </view>

    <view class="p-4 space-y-2 bg-white rounded-lg shadow-sm">
      <view class="flex items-center justify-between">
        <text class="text-base font-bold text-fresh">可加入的拼团</text>
        <text class="text-xs text-gray-400" @click="loadOpenGroups">刷新</text>
      </view>
      <text class="text-xs text-gray-500">同一个拼团号代表同一团，成员会累计到同一进度。</text>
      <view v-if="loadingGroups" class="py-2 text-center">
        <text class="text-xs text-gray-400">加载中...</text>
      </view>
      <view v-else-if="!openGroups.length" class="py-2 text-center">
        <text class="text-xs text-gray-400">暂无可加入拼团，可发起新团</text>
      </view>
      <view v-else class="space-y-2">
        <view
          v-for="item in openGroups"
          :key="item.groupBuyId"
          class="rounded-lg border p-3"
          :class="
            selectedGroupId === item.groupBuyId
              ? 'border-primary bg-orange-50'
              : 'border-gray-200 bg-white'
          "
          @click="pickOpenGroup(item)"
        >
          <view class="flex items-center justify-between">
            <text class="text-sm text-fresh"
              >拼团号：{{ item.groupBuyId.slice(0, 12) }}</text
            >
            <text class="text-xs text-gray-500"
              >{{ item.currentCount }}/{{ item.targetCount }} 人</text
            >
          </view>
          <text class="block text-xs text-gray-400 mt-1"
            >最近下单：{{ item.latestCreateTime || '-' }}</text
          >
        </view>
      </view>
    </view>

    <!-- 拼团表单 -->
    <view class="flex flex-col p-4 gap-3 bg-white rounded-lg shadow-sm">
      <text class="text-base font-bold text-fresh">填写信息</text>

      <!-- 选择人数 -->
      <view class="flex gap-3">
        <BaseButton
          :type="formData.groupType === 2 ? 'primary' : 'default'"
          text="2人团"
          @click="formData.groupType = 2"
        />
        <BaseButton
          :type="formData.groupType === 3 ? 'primary' : 'default'"
          text="3人团"
          @click="formData.groupType = 3"
        />
      </view>

      <!-- 收件人 -->
      <BaseField label="收件人" required>
        <input
          v-model="formData.receiverName"
          type="text"
          placeholder="收件人姓名"
          class="w-full text-base base-input"
        />
      </BaseField>

      <!-- 电话 -->
      <!-- 这里 type="number" 会优先弹起数字键盘，优化用户输入体验 -->
      <BaseField label="手机号" required>
        <input
          v-model="formData.mobile"
          type="number"
          :maxlength="11"
          placeholder="手机号"
          class="w-full text-base base-input"
        />
      </BaseField>

      <!-- 自提点 -->
      <BaseField label="自提点">
        <text class="text-base text-gray-700 base-field__text">
          {{ formData.pickupPoint || '请先在自提网点设置默认自提点' }}
        </text>
      </BaseField>

      <BaseField label="优惠券">
        <view class="flex flex-wrap gap-2 px-3 py-3">
          <view
            v-for="coupon in orderStore.couponList"
            :key="coupon.id"
            class="px-3 py-1.5 rounded-full border text-xs"
            :class="
              formData.couponId === coupon.id
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200'
            "
            @click="formData.couponId = coupon.id"
          >
            {{ coupon.title }}
          </view>
        </view>
        <text class="block px-3 pb-2 text-[22rpx] text-gray-400">{{ couponSourceHint }}</text>
      </BaseField>

      <BaseField label="备注">
        <textarea
          v-model="formData.remark"
          :maxlength="80"
          class="w-full px-4 py-3 text-sm text-gray-700 bg-transparent"
          placeholder="例如：不要香菜、18:30后自提"
          auto-height
        />
      </BaseField>
    </view>

    <!-- 占位：给底部固定按钮留出空间 -->
    <!-- <view class="h-8"></view> -->

    <view
      v-if="!hasActiveCampaign"
      class="text-xs text-red-500 text-center"
    >
      当前商品在该自提点无有效开团活动，暂不可下单
    </view>

    <view
      v-if="productDetail?.stock !== undefined && productDetail.stock <= 0"
      class="text-xs text-red-500 text-center"
    >
      库存不足，暂不可下单
    </view>

    <view
      class="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-100 px-4 pt-3 safe-bottom-padding"
    >
      <view class="flex items-end justify-between px-2 mb-3">
        <view>
          <text class="text-xs text-gray-500">优惠</text>
          <text class="text-xs text-primary ml-1"
            >-￥{{ couponDiscount.toFixed(2) }}</text
          >
        </view>
        <view>
          <text class="text-xs text-gray-500">应付</text>
          <text class="text-xl font-bold text-primary ml-1"
            >￥{{ finalPayable }}</text
          >
        </view>
      </view>
      <view class="flex w-full items-center gap-3 px-1">
        <BaseButton
          class="flex-1 action-btn"
          :loading="isSubmitting && currentAction === 'start'"
          :disabled="isSubmitting || (productDetail?.stock ?? 0) <= 0 || !hasActiveCampaign"
          text="发起拼团"
          @click="openPaySheet('start')"
        />
        <BaseButton
          class="flex-1 action-btn"
          type="default"
          :loading="isSubmitting && currentAction === 'join'"
          :disabled="
            isSubmitting ||
            (productDetail?.stock ?? 0) <= 0 ||
            !hasActiveCampaign ||
            !openGroups.length ||
            !selectedGroupId
          "
          text="加入拼团"
          @click="openPaySheet('join')"
        />
      </view>
    </view>

    <view v-if="showPaySheet" class="pay-mask" @click="closePaySheet"></view>
    <view v-if="showPaySheet" class="pay-sheet">
      <view class="pay-sheet__head">
        <text class="text-base font-bold text-fresh">选择支付方式</text>
        <text class="text-xs text-gray-500">演示环境：微信支付仅展示交互，不可用</text>
      </view>

      <view
        class="pay-method"
        :class="payMethod === 'balance' ? 'pay-method--active' : ''"
        @click="payMethod = 'balance'"
      >
        <view class="pay-method__left">
          <view class="pay-icon pay-icon--balance">￥</view>
          <view>
            <text class="block text-sm text-fresh font-bold">余额支付</text>
            <text class="block text-xs text-gray-500">当前可用：演示余额</text>
          </view>
        </view>
        <text class="text-xs text-primary">可使用</text>
      </view>

      <view class="pay-method pay-method--disabled">
        <view class="pay-method__left">
          <view class="pay-icon pay-icon--wechat">微</view>
          <view>
            <text class="block text-sm text-gray-500 font-bold">微信支付</text>
            <text class="block text-xs text-gray-400">未配置商家测试号，答辩仅演示流程</text>
          </view>
        </view>
        <text class="text-xs text-gray-400">暂不可用</text>
      </view>

      <view class="mt-3 flex items-end justify-between">
        <view>
          <text class="text-xs text-gray-500">本次支付方式</text>
          <text class="text-sm text-fresh ml-1">{{ payMethodLabel }}</text>
        </view>
        <view>
          <text class="text-xs text-gray-500">应付</text>
          <text class="text-xl font-bold text-primary ml-1">￥{{ finalPayable }}</text>
        </view>
      </view>

      <view class="mt-3 flex gap-2">
        <BaseButton class="flex-1" type="default" text="取消" @click="closePaySheet" />
        <BaseButton
          class="flex-1"
          :loading="isSubmitting"
          :disabled="isSubmitting || payMethod !== 'balance'"
          text="确认支付并下单"
          @click="handleConfirmPay"
        />
      </view>
    </view>
  </view>
</template>

<style scoped>
.action-btn {
  min-height: 80rpx;
}

.pay-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 50;
}

.pay-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 60;
  background: #fff;
  border-top-left-radius: 24rpx;
  border-top-right-radius: 24rpx;
  padding: 24rpx;
  padding-bottom: calc(var(--safe-bottom) + 18rpx);
  box-shadow: 0 -12rpx 24rpx rgba(15, 23, 42, 0.12);
}

.pay-sheet__head {
  margin-bottom: 16rpx;
}

.pay-method {
  border: 1rpx solid #e5e7eb;
  border-radius: 16rpx;
  padding: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.pay-method--active {
  border-color: #f08800;
  background: #fff7ed;
}

.pay-method--disabled {
  opacity: 0.78;
}

.pay-method__left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.pay-icon {
  width: 52rpx;
  height: 52rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
}

.pay-icon--balance {
  background: #f08800;
}

.pay-icon--wechat {
  background: #07c160;
}
</style>
