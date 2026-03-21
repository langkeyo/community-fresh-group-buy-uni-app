<script setup lang="ts">
import { ref } from 'vue'

const ORDER_REFRESH_FLAG = 'order_need_refresh'
const isSubmitting = ref(false)
const currentAction = ref<'start' | 'join' | ''>('')
const formData = ref({
  groupType: 2,
  receiverName: '',
  mobile: '',
  pickupPoint: ''
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

  if (!formData.value.pickupPoint.trim()) {
    uni.showToast({
      title: '请选择自提点',
      icon: 'none'
    })
    return false
  }

  return true
}

async function submitGroupBuy(
  action: 'start' | 'join',
  data: typeof formData.value
) {
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (action === 'start') {
    console.log('发起拼团数据：', data)
    return
  }

  console.log('加入拼团数据：', data)
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

  currentAction.value = action
  isSubmitting.value = true

  try {
    await submitGroupBuy(action, formData.value)

    resetForm()
    uni.setStorageSync(ORDER_REFRESH_FLAG, true)
    uni.switchTab({
      url: '/pages/order/order'
    })
  } catch (error) {
    uni.showToast({
      title: '拼团提交失败',
      icon: 'none'
    })
  } finally {
    isSubmitting.value = false
    currentAction.value = ''
  }
}
</script>

<template>
  <view class="min-h-screen px-4 pt-4 space-y-4 bg-gray-50">
    <text class="text-base font-bold text-fresh">拼团详情</text>

    <!-- 商品信息区 -->
    <view class="p-4 space-y-2 bg-white rounded-lg shadow-sm">
      <view class="w-full h-32 rounded-md bg-secondary"></view>
      <text class="text-base font-bold text-fresh">本地有机番茄 500g</text>
      <view class="flex items-center gap-2">
        <text class="text-xs text-primary">￥</text>
        <text class="text-lg font-bold text-primary">4.99</text>
        <text class="text-xs text-gray-400 line-through">￥8.00</text>
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
        <view
          class="text-sm px-3 py-1.5 rounded-full"
          :class="
            formData.groupType === 2
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 border border-gray-200'
          "
          @click="formData.groupType = 2"
          >2人团</view
        >
        <view
          class="text-sm px-3 py-1.5 rounded-full"
          :class="
            formData.groupType === 3
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 border border-gray-200'
          "
          @click="formData.groupType = 3"
          >3人团</view
        >
      </view>

      <!-- 收件人 -->
      <view class="px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
        <input
          v-model="formData.receiverName"
          type="text"
          placeholder="收件人姓名"
          class="text-base"
        />
      </view>

      <!-- 电话 -->
      <!-- 这里 type="number" 会优先弹起数字键盘，优化用户输入体验 -->
      <view class="px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
        <input
          v-model="formData.mobile"
          type="number"
          :maxlength="11"
          placeholder="手机号"
          class="text-base"
        />
      </view>

      <!-- 自提点 -->
      <view class="px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
        <input
          v-model="formData.pickupPoint"
          type="text"
          placeholder="选择自提点"
          class="text-base"
        />
      </view>
    </view>

    <!-- 按钮区 -->
    <view class="flex gap-3">
      <view
        hover-class="scale-95"
        class="flex-1 py-3 text-base text-center text-white transition-all duration-300 border rounded-full border-primary"
        :class="isSubmitting ? 'bg-primary/60 opacity-60' : 'bg-primary'"
        @click="handleSubmitGroupBuy('start')"
      >
        {{
          isSubmitting && currentAction === 'start' ? '提交中...' : '发起拼团'
        }}
      </view>
      <view
        hover-class="scale-95"
        class="flex-1 py-3 text-base text-center transition-all duration-300 border rounded-full border-primary text-primary"
        :class="isSubmitting ? 'bg-white/60 opacity-60' : 'bg-white'"
        @click="handleSubmitGroupBuy('join')"
      >
        {{
          isSubmitting && currentAction === 'join' ? '加入中...' : '加入拼团'
        }}
      </view>
    </view>

    <!-- 成团提示 -->
    <view
      class="bg-[#FFF7E6] border border-primary/30 text-primary rounded-lg p-3 text-sm"
    >
      🎉 已成团！请前往订单页查看取货信息
    </view>
  </view>
</template>
