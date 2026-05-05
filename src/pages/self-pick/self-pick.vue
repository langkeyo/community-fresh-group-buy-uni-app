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
const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase())

// --- 计算属性 ---
const filteredPoints = computed(() => {
  const q = normalizedKeyword.value
  if (!q) return points.value
  return points.value.filter((p) => {
    const name = p.name.toLowerCase()
    const address = p.address.toLowerCase()
    return name.includes(q) || address.includes(q)
  })
})

// --- 方法 ---
const openMap = (point: PickPointItem) => {
  const latitude = Number(point.latitude)
  const longitude = Number(point.longitude)
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    // 微信小程序内会调用腾讯地图能力打开定位
    uni.openLocation({
      latitude,
      longitude,
      name: point.name,
      address: point.address
    })
    return
  }

  uni.showModal({
    title: '暂不支持一键导航',
    content: '当前网点未配置腾讯地图坐标，无法精准导航。是否复制地址到剪贴板？',
    confirmText: '复制地址',
    success: (res) => {
      if (!res.confirm) return
      uni.setClipboardData({
        data: `${point.name} ${point.address}`
      })
    }
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
    <view
      class="bg-white px-4 pt-3 pb-2 sticky top-0 border-b border-gray-100 z-10"
    >
      <view
        class="h-14 p-1 bg-white border border-gray-200 rounded-full shadow-sm"
      >
        <view class="h-full flex items-center px-3 bg-gray-100 rounded-full">
          <uni-icons type="search" size="18" color="#9CA3AF" />
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索附近自提点/小区"
            placeholder-class="text-gray-400 text-base"
            class="flex-1 ml-2 text-base text-[#2F5233] h-full"
          />
          <view
            v-if="keyword"
            class="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center"
            @click="keyword = ''"
          >
            <text class="text-xs text-gray-500">×</text>
          </view>
        </view>
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
