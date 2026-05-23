<script setup lang="ts">
import { computed, ref } from 'vue'

const scene = ref<'product' | 'group' | 'order'>('product')
const productId = ref('1')
const groupId = ref('10001')
const orderId = ref('1')
const qrUrl = ref('')
const loading = ref(false)

const qrContent = computed(() => {
  if (scene.value === 'product') return `product:${Number(productId.value || 0)}`
  if (scene.value === 'group') return `group:${Number(groupId.value || 0)}`
  return `order:${Number(orderId.value || 0)}`
})

function buildQrUrl(content: string) {
  const encoded = encodeURIComponent(content)
  return `https://api.qrserver.com/v1/create-qr-code/?size=720x720&margin=12&data=${encoded}`
}

function validate() {
  if (scene.value === 'product' && Number(productId.value) <= 0) return '请输入有效商品ID'
  if (scene.value === 'group' && Number(groupId.value) <= 0) return '请输入有效拼团ID'
  if (scene.value === 'order' && Number(orderId.value) <= 0) return '请输入有效订单ID'
  return ''
}

function doGenerate() {
  const msg = validate()
  if (msg) {
    uni.showToast({ title: msg, icon: 'none' })
    return
  }
  loading.value = true
  qrUrl.value = buildQrUrl(qrContent.value)
  setTimeout(() => {
    loading.value = false
    uni.showToast({ title: '生成成功', icon: 'success' })
  }, 180)
}

function copyPayload() {
  uni.setClipboardData({
    data: qrContent.value,
    success: () => uni.showToast({ title: '已复制二维码内容', icon: 'success' })
  })
}
</script>

<template>
  <view class="page">
    <view class="card">
      <text class="title">推广二维码</text>
      <view class="row">
        <view
          class="chip"
          :class="{ active: scene === 'product' }"
          @click="scene = 'product'"
        >商品推广</view>
        <view
          class="chip"
          :class="{ active: scene === 'group' }"
          @click="scene = 'group'"
        >拼团邀请</view>
        <view
          class="chip"
          :class="{ active: scene === 'order' }"
          @click="scene = 'order'"
        >订单查询</view>
      </view>

      <input
        v-if="scene === 'product'"
        v-model="productId"
        class="ipt mt-4"
        type="number"
        placeholder="请输入商品ID（如 1）"
      />
      <input
        v-else-if="scene === 'group'"
        v-model="groupId"
        class="ipt mt-4"
        type="number"
        placeholder="请输入拼团ID（如 10001）"
      />
      <input
        v-else
        v-model="orderId"
        class="ipt mt-4"
        type="number"
        placeholder="请输入订单ID（如 1）"
      />

      <view class="payload">
        <text class="payload-label">扫码载荷</text>
        <text class="payload-val">{{ qrContent }}</text>
      </view>

      <view class="btn" @click="doGenerate">{{ loading ? '生成中...' : '生成二维码' }}</view>
    </view>

    <view v-if="qrUrl" class="card qr-wrap">
      <image class="qr-img" :src="qrUrl" mode="widthFix" />
      <view class="copy-btn" @click="copyPayload">复制扫码内容</view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #f6f7fb; padding: 24rpx; }
.card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 20rpx; }
.title { display: block; font-size: 30rpx; color: #1f3b2b; font-weight: 700; margin-bottom: 16rpx; }
.ipt { height: 84rpx; border: 1rpx solid #e5e7eb; border-radius: 14rpx; padding: 0 20rpx; font-size: 28rpx; }
.row { display: flex; gap: 12rpx; margin-top: 16rpx; }
.chip { padding: 10rpx 20rpx; border-radius: 999rpx; background: #fff7e6; color: #8a5a00; font-size: 24rpx; border: 1rpx solid #f5d59f; }
.chip.active { background: #f08800; color: #fff; border-color: #f08800; }
.btn { margin-top: 20rpx; height: 86rpx; border-radius: 43rpx; background: #f08800; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 30rpx; font-weight: 700; }
.qr-wrap { display: flex; align-items: center; justify-content: center; }
.qr-img { width: 520rpx; }
.payload { margin-top: 16rpx; background: #f8fafc; border-radius: 12rpx; padding: 12rpx 16rpx; }
.payload-label { display: block; font-size: 22rpx; color: #6b7280; }
.payload-val { display: block; margin-top: 4rpx; font-size: 26rpx; color: #1f2937; font-weight: 600; }
.copy-btn { margin-top: 20rpx; padding: 12rpx 24rpx; border-radius: 999rpx; border: 1rpx solid #2f5233; color: #2f5233; font-size: 24rpx; }
</style>
