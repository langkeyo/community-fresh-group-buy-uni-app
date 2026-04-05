<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseField from '@/components/base/BaseField.vue'
import { createOrder } from '@/services/order'
import { getPickPointDetail } from '@/services/pick-point'
import { getProductDetail } from '@/services/product'
import type { ProductItem } from '@/types/product'
import { useUserStore } from '@/stores/user'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const userStore = useUserStore()
const ORDER_REFRESH_FLAG = 'order_need_refresh'
const isSubmitting = ref(false)
const currentAction = ref<'start' | 'join' | ''>('')
const formData = ref({
  groupType: 2,
  receiverName: '',
  mobile: '',
  pickupPoint: ''
})
const productId = ref<number | null>(null)
const pickPointId = ref<number | null>(null)
const productName = ref('商品')
const productDetail = ref<ProductItem | null>(null)

const displayPrice = computed(() => {
  if (!productDetail.value) return '--'
  const groupPrice =
    formData.value.groupType === 2
      ? productDetail.value.groupPrice2 ?? productDetail.value.price
      : productDetail.value.groupPrice3 ?? productDetail.value.price
  return groupPrice.toFixed(2)
})

const displayOriginPrice = computed(() => {
  if (!productDetail.value) return '--'
  return productDetail.value.price.toFixed(2)
})

const coverImage = computed(() => {
  return productDetail.value?.images?.[0] || ''
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
      ? productDetail.value?.groupPrice2 ?? productDetail.value?.price ?? 0
      : productDetail.value?.groupPrice3 ?? productDetail.value?.price ?? 0
  const payload = {
    userId: userStore.userId,
    productId: productId,
    totalPrice: groupPrice,
    pickPointId: pickPointId,
    groupBuyId: action === 'join' ? 'TEMP_GROUP_001' : null
  }

  await createOrder(payload)

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
    pickupPoint: ''
  }
}

async function handleSubmitGroupBuy(action: 'start' | 'join') {
  if (isSubmitting.value) return
  if (!validateForm()) return
  if (productDetail.value?.stock !== undefined && productDetail.value.stock <= 0) {
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

  const safeProductId = productId.value // 这里的类型是 number
  const safePickPointId = pickPointId.value

  currentAction.value = action
  isSubmitting.value = true

  try {
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

onLoad(async (query) => {
  const id = Number(query?.id)
  productId.value = Number.isFinite(id) && id > 0 ? id : null

  const pp = Number(query?.pickPointId)
  pickPointId.value = Number.isFinite(pp) && pp > 0 ? pp : null

  if (pickPointId.value) {
    formData.value.pickupPoint = `自提点#${pickPointId.value}`
  }

  if (productId.value) {
    try {
      const info = await getProductDetail(productId.value)
      productDetail.value = info || null
      productName.value = info?.name || `商品#${productId.value}`
    } catch (error: any) {
      uni.showToast({ title: error?.message || '商品信息加载失败', icon: 'none' })
    }
  }

  if (pickPointId.value) {
    try {
      const point = await getPickPointDetail(pickPointId.value)
      if (point) {
        formData.value.pickupPoint = `${point.name}（${point.address}）`
      }
    } catch (error: any) {
      uni.showToast({ title: error?.message || '自提点信息加载失败', icon: 'none' })
    }
  }
})
</script>

<template>
  <view
    class="min-h-screen px-4 pt-4 space-y-4 bg-gray-50"
    style="padding-bottom: 140rpx;"
  >
    <text class="text-base font-bold text-fresh">拼团详情</text>

    <!-- 商品信息区 -->
    <view class="p-4 space-y-2 bg-white rounded-lg shadow-sm">
      <image
        v-if="coverImage"
        :src="coverImage"
        mode="aspectFill"
        class="w-full h-32 rounded-md bg-secondary"
      />
      <view v-else class="w-full h-32 rounded-md bg-secondary"></view>
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
        <text>已参与 1 人</text>
        <text>目标 3 人</text>
      </view>

      <view class="h-2 overflow-hidden bg-gray-200 rounded-full">
        <view class="w-1/3 h-full bg-primary"></view>
      </view>
    </view>

    <!-- 拼团表单 -->
    <view class="p-4 space-y-3 bg-white rounded-lg shadow-sm">
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
          {{ formData.pickupPoint || '默认自提点（后续接真实选择）' }}
        </text>
      </BaseField>
    </view>

    <!-- 占位：给底部固定按钮留出空间 -->
    <view class="h-8"></view>

    <view
      v-if="productDetail?.stock !== undefined && productDetail.stock <= 0"
      class="text-xs text-red-500 text-center"
    >
      库存不足，暂不可下单
    </view>

    <!-- 成团提示 -->
    <view
      class="bg-[#FFF7E6] border border-primary/30 text-primary rounded-lg p-3 text-sm"
    >
      🎉 已成团！请前往订单页查看取货信息
    </view>
    <view
      class="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-100 px-4 pt-3"
      style="padding-bottom: calc(env(safe-area-inset-bottom) + 12rpx);"
    >
      <view class="flex gap-3">
        <BaseButton
          class="flex-1"
          :loading="isSubmitting && currentAction === 'start'"
          :disabled="isSubmitting || (productDetail?.stock ?? 0) <= 0"
          text="发起拼团"
          @click="handleSubmitGroupBuy('start')"
        />
        <BaseButton
          class="flex-1"
          type="default"
          :loading="isSubmitting && currentAction === 'join'"
          :disabled="isSubmitting || (productDetail?.stock ?? 0) <= 0"
          text="加入拼团"
          @click="handleSubmitGroupBuy('join')"
        />
      </view>
    </view>
  </view>
</template>
