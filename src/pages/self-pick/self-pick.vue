<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import { getPickPointList } from '@/services/pick-point'
import type { PickPointItem } from '@/types/pick-point'
import { ref, computed, onMounted } from 'vue'

const keyword = ref('')
const points = ref<PickPointItem[]>([])
const loading = ref(false)
const selectedPickId = ref<number | null>(null)

// --- 计算属性 ---
const filteredPoints = computed(() => {
  return points.value
    .filter(
      (p) => p.name.includes(keyword.value) || p.address.includes(keyword.value)
    )
})

// --- 方法 ---
const openMap = (point: PickPointItem) => {
  // 模拟打开地图
  uni.openLocation({
    latitude: 39.909, // Mock 坐标
    longitude: 116.397,
    name: point.name,
    address: point.address
  })
}

const loadPickPoints = async () => {
  loading.value = true
  try {
    points.value = await getPickPointList()
  } catch (error: any) {
    uni.showToast({ title: error?.message || '自提点加载失败', icon: 'none' })
    points.value = []
  } finally {
    loading.value = false
  }
}

const syncSelectedPick = () => {
  const stored = Number(uni.getStorageSync('default_pick_point_id'))
  selectedPickId.value = Number.isFinite(stored) && stored > 0 ? stored : null
}

const setDefaultPick = (point: PickPointItem) => {
  uni.setStorageSync('default_pick_point_id', point.id)
  selectedPickId.value = point.id
  uni.showToast({ title: '已设为默认自提点', icon: 'success' })
}

onMounted(() => {
  loadPickPoints()
  syncSelectedPick()
})
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
          class="flex-1 text-sm text-[#2F5233] base-input"
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

      <BaseCard v-for="point in filteredPoints" :key="point.id" class="mb-3">
        <view class="flex justify-between items-start mb-2">
          <text class="text-base font-bold text-[#2F5233]">{{
            point.name
          }}</text>
          <BaseTag
            :kind="point.id === selectedPickId ? 'success' : 'info'"
            :text="point.id === selectedPickId ? '默认' : '自提点'"
          />
        </view>

        <text class="text-xs text-gray-500 mb-1"
          >地址：{{ point.address }}</text
        >
        <view class="flex gap-2 pt-2 mt-auto">
          <BaseButton
            type="default"
            :text="point.id === selectedPickId ? '默认自提点' : '设为默认'"
            @click="setDefaultPick(point)"
          />
          <BaseButton text="导航前往" @click="openMap(point)" />
        </view>
      </BaseCard>

      <view v-if="loading" class="py-4 text-center">
        <text class="text-xs text-gray-400">加载中...</text>
      </view>

      <view v-else-if="!filteredPoints.length" class="py-6 text-center">
        <text class="text-xs text-gray-400">暂无自提点</text>
      </view>
    </view>
  </view>
</template>
