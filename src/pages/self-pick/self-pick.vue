<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import { ref, computed } from 'vue'

// --- 模拟数据 ---
interface PickPoint {
  id: number
  name: string
  address: string
  distance: number // km
  time: string
  phone: string
}

const keyword = ref('')
const points = ref<PickPoint[]>([
  {
    id: 1,
    name: '阳光花园一期A站',
    address: '阳光大道88号10栋101',
    distance: 0.2,
    time: '09:00-20:00',
    phone: '13800138000'
  },
  {
    id: 2,
    name: '幸福里正门便利店',
    address: '幸福路66号',
    distance: 0.8,
    time: '08:00-22:00',
    phone: '13900139000'
  },
  {
    id: 3,
    name: '滨江壹号菜鸟驿站',
    address: '滨江东路5号',
    distance: 1.5,
    time: '10:00-21:00',
    phone: '13700137000'
  },
  {
    id: 4,
    name: '老街坊社区中心',
    address: '中山西路202号',
    distance: 2.3,
    time: '09:00-18:00',
    phone: '13600136000'
  }
])

// --- 计算属性 ---
const filteredPoints = computed(() => {
  return points.value
    .filter(
      (p) => p.name.includes(keyword.value) || p.address.includes(keyword.value)
    )
    .sort((a, b) => a.distance - b.distance)
})

// --- 方法 ---
const openMap = (point: PickPoint) => {
  // 模拟打开地图
  uni.openLocation({
    latitude: 39.909, // Mock 坐标
    longitude: 116.397,
    name: point.name,
    address: point.address
  })
}

const callPhone = (phone: string) => {
  uni.makePhoneCall({ phoneNumber: phone })
}
</script>

<template>
  <view class="min-h-screen bg-[#F8F8F8]">
    <!-- 搜索栏 -->
    <view class="bg-white p-3 sticky top-0 border-b border-gray-100 z-10">
      <view class="bg-[#F8F8F8] rounded-full flex items-center px-3 h-10">
        <text class="text-gray-400 mr-2">🔍</text>
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索附近自提点/小区"
          placeholder-class="text-gray-400 text-sm"
          class="flex-1 text-sm text-[#2F5233] px-3 py-2"
        />
      </view>
    </view>

    <!-- 列表 -->
    <view class="p-3">
      <view class="flex justify-between items-center mb-2 px-1">
        <text class="text-xs text-gray-500"
          >附近共有 {{ filteredPoints.length }} 个自提点</text
        >
        <text class="text-xs text-[#F08800]">📍 当前定位：阳光花园</text>
      </view>

      <BaseCard
        v-for="point in filteredPoints"
        :key="point.id"
        class="mb-3"
      >
        <view class="flex justify-between items-start mb-2">
          <text class="text-base font-bold text-[#2F5233]">{{
            point.name
          }}</text>
          <BaseTag :kind="'warning'" :text="`${point.distance}km`" />
        </view>

        <text class="text-xs text-gray-500 mb-1"
          >地址：{{ point.address }}</text
        >
        <text class="text-xs text-gray-500 mb-3">营业：{{ point.time }}</text>

        <view class="flex gap-2 pt-2 mt-auto">
          <BaseButton type="default" text="联系团长" @click="callPhone(point.phone)" />
          <BaseButton text="导航前往" @click="openMap(point)" />
        </view>
      </BaseCard>
    </view>
  </view>
</template>
