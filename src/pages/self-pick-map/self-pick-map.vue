<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import { getPickPointList } from '@/services/pick-point'
import type { PickPointItem } from '@/types/pick-point'
import { onMounted, ref } from 'vue'

const loading = ref(false)
const points = ref<PickPointItem[]>([])
const selectedId = ref<number | null>(null)
const centerLat = ref(39.9042)
const centerLng = ref(116.4074)
const userLat = ref<number | null>(null)
const userLng = ref<number | null>(null)

const mapMarkers = ref<any[]>([])
const mapCircles = ref<any[]>([])

function rebuildMarkers() {
  mapMarkers.value = points.value
    .filter((x) => Number.isFinite(Number(x.latitude)) && Number.isFinite(Number(x.longitude)))
    .map((x) => ({
      id: x.id,
      latitude: Number(x.latitude),
      longitude: Number(x.longitude),
      title: x.name,
      width: selectedId.value === x.id ? 34 : 28,
      height: selectedId.value === x.id ? 34 : 28
    }))
}

async function locateUser() {
  try {
    const res = await uni.getLocation({ type: 'gcj02' })
    centerLat.value = Number(res.latitude)
    centerLng.value = Number(res.longitude)
    userLat.value = Number(res.latitude)
    userLng.value = Number(res.longitude)
    mapCircles.value = [
      {
        latitude: userLat.value,
        longitude: userLng.value,
        radius: 24,
        color: '#3B82F633',
        fillColor: '#3B82F644',
        strokeWidth: 2
      }
    ]
  } catch {
    // ignore
  }
}

async function loadData() {
  loading.value = true
  try {
    points.value = await getPickPointList()
    const stored = Number(uni.getStorageSync('default_pick_point_id'))
    selectedId.value = Number.isFinite(stored) && stored > 0 ? stored : points.value[0]?.id || null
    const selected = points.value.find((x) => x.id === selectedId.value)
    if (selected?.latitude && selected?.longitude) {
      centerLat.value = Number(selected.latitude)
      centerLng.value = Number(selected.longitude)
    }
    rebuildMarkers()
  } catch (e: any) {
    uni.showToast({ title: e?.message || '自提点加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function onMarkerTap(e: any) {
  const id = Number(e?.detail?.markerId)
  if (!id) return
  selectedId.value = id
  rebuildMarkers()
}

function selectPoint(point: PickPointItem) {
  selectedId.value = point.id
  if (point.latitude && point.longitude) {
    centerLat.value = Number(point.latitude)
    centerLng.value = Number(point.longitude)
  }
  rebuildMarkers()
}

function confirmPick() {
  const selected = points.value.find((x) => x.id === selectedId.value)
  if (!selected) {
    uni.showToast({ title: '请先选择自提点', icon: 'none' })
    return
  }
  uni.setStorageSync('default_pick_point_id', selected.id)
  uni.setStorageSync('default_pick_point_name', selected.name)
  uni.showToast({ title: '已设置默认自提点', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 350)
}

onMounted(async () => {
  await locateUser()
  await loadData()
})
</script>

<template>
  <view class="page">
    <map
      class="map"
      :latitude="centerLat"
      :longitude="centerLng"
      :markers="mapMarkers"
      :circles="mapCircles"
      :scale="14"
      @markertap="onMarkerTap"
    />

    <view class="sheet">
      <view class="sheet-title">选择自提点</view>
      <scroll-view class="list" scroll-y>
        <view
          v-for="item in points"
          :key="item.id"
          class="item"
          :class="{ active: item.id === selectedId }"
          @click="selectPoint(item)"
        >
          <text class="name">{{ item.name }}</text>
          <text class="addr">{{ item.address }}</text>
        </view>
      </scroll-view>
      <BaseButton text="设为默认自提点" @click="confirmPick" />
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #f6f7fb; }
.map { width: 100%; height: 58vh; }
.sheet {
  background: #fff; border-top-left-radius: 24rpx; border-top-right-radius: 24rpx;
  margin-top: -8rpx; padding: 18rpx 24rpx 24rpx;
}
.sheet-title { font-size: 30rpx; font-weight: 700; color: #1f3b2b; margin-bottom: 12rpx; }
.list { max-height: 30vh; }
.item { padding: 16rpx 8rpx; border-bottom: 1rpx solid #eef1f5; }
.item.active { background: #fff7ed; }
.name { display:block; font-size: 28rpx; color: #243b2b; font-weight: 600; }
.addr { display:block; margin-top: 6rpx; font-size: 24rpx; color: #6b7280; }
</style>
