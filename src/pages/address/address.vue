<script setup lang="ts">
import { getPickPointDetail } from '@/services/pick-point'
import { notifyInfo, notifySuccess } from '@/utils/notify'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'

const defaultPickName = ref('未设置默认自提点')
const defaultPickAddress = ref('请先到自提网点页面设置默认自提点')
const loading = ref(false)
const preferredDeliveryTime = ref('周末送达')
const preferredContactTime = ref('白天可联系')
const timeRangeOptions = ['白天可联系', '晚间可联系', '全天可联系']
const deliveryOptions = ['周末送达', '工作日送达', '不限送达时间']

const DELIVERY_KEY = 'address_pref_delivery'
const CONTACT_KEY = 'address_pref_contact'

const loadDefaultPickPoint = async () => {
  const id = Number(uni.getStorageSync('default_pick_point_id'))
  if (!id) {
    defaultPickName.value = '未设置默认自提点'
    defaultPickAddress.value = '请先到自提网点页面设置默认自提点'
    return
  }

  loading.value = true
  try {
    const detail = await getPickPointDetail(id)
    defaultPickName.value = detail?.name || '未设置默认自提点'
    defaultPickAddress.value =
      detail?.address || '请先到自提网点页面设置默认自提点'
  } catch (error: any) {
    defaultPickName.value = '默认自提点加载失败'
    defaultPickAddress.value = '请返回重试或重新选择自提点'
  } finally {
    loading.value = false
  }
}

const goToPickPointPage = () => {
  uni.navigateTo({ url: '/pages/self-pick/self-pick' })
}

const loadAddressPreference = () => {
  const delivery = String(uni.getStorageSync(DELIVERY_KEY) || '').trim()
  const contact = String(uni.getStorageSync(CONTACT_KEY) || '').trim()
  preferredDeliveryTime.value = deliveryOptions.includes(delivery) ? delivery : '周末送达'
  preferredContactTime.value = timeRangeOptions.includes(contact) ? contact : '白天可联系'
}

const copyPickAddress = () => {
  const text = `${defaultPickName.value} ${defaultPickAddress.value}`.trim()
  if (!text || defaultPickName.value === '未设置默认自提点') {
    notifyInfo('请先设置默认自提点')
    return
  }
  uni.setClipboardData({ data: text })
}

const goEditAddressPreference = () => {
  uni.showActionSheet({
    itemList: ['编辑送达偏好', '编辑联系时间'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.showActionSheet({
          itemList: deliveryOptions,
          success: (r) => {
            const value = deliveryOptions[r.tapIndex]
            preferredDeliveryTime.value = value
            uni.setStorageSync(DELIVERY_KEY, value)
            notifySuccess('送达偏好已更新')
          }
        })
      } else if (res.tapIndex === 1) {
        uni.showActionSheet({
          itemList: timeRangeOptions,
          success: (r) => {
            const value = timeRangeOptions[r.tapIndex]
            preferredContactTime.value = value
            uni.setStorageSync(CONTACT_KEY, value)
            notifySuccess('联系时间已更新')
          }
        })
      }
    }
  })
}

onShow(() => {
  loadDefaultPickPoint()
  loadAddressPreference()
})
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-6">
    <view class="bg-white rounded-xl p-6 shadow-sm">
      <view class="flex items-center justify-between mb-4">
        <text class="text-lg font-bold text-fresh">收货地址详情</text>
        <view class="px-4 py-1.5 text-sm rounded-full border border-primary text-primary" @click="goEditAddressPreference">
          编辑
        </view>
      </view>

      <view class="space-y-4">
        <view class="detail-row">
          <text class="detail-label">收货方式</text>
          <text class="detail-value">社区自提</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">默认自提点</text>
          <text class="detail-value">{{ defaultPickName }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">详细地址</text>
          <text class="detail-value">{{ defaultPickAddress }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">送达偏好</text>
          <text class="detail-value">{{ preferredDeliveryTime }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">联系时间</text>
          <text class="detail-value">{{ preferredContactTime }}</text>
        </view>
      </view>

      <text v-if="loading" class="text-xs text-gray-400 block mt-3">默认自提点加载中...</text>

      <view class="mt-5 flex gap-3">
        <view class="px-4 py-2 text-sm rounded-full border border-primary text-primary" @click="goToPickPointPage">
          切换自提点
        </view>
        <view class="px-4 py-2 text-sm rounded-full border border-gray-200 text-gray-600" @click="copyPickAddress">
          复制地址
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.wxss-page-fix {
  display: block;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  flex: 0 0 150rpx;
  color: #8c8c8c;
  font-size: 26rpx;
  line-height: 1.5;
}

.detail-value {
  flex: 1;
  text-align: right;
  color: #262626;
  font-size: 28rpx;
  line-height: 1.5;
  word-break: break-all;
}
</style>

