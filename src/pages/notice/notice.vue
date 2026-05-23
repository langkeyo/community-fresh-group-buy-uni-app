<script setup lang="ts">
import { getNoticeList, markNoticeRead } from '@/services/notice'
import type { NoticeItem } from '@/types/notice'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'

const list = ref<NoticeItem[]>([])
const loading = ref(false)
const errorMsg = ref('')
const NOTICE_REFRESH_KEY = 'notice_need_refresh'

function getCurrentUserId(): number {
  const stored = uni.getStorageSync('userInfo')
  const info = stored ? (typeof stored === 'string' ? JSON.parse(stored) : stored) : null
  const id = Number(info?.id || 0)
  return Number.isFinite(id) && id > 0 ? id : 0
}

function goLogin() {
  uni.navigateTo({ url: '/pages/login/login' })
}

async function loadData() {
  const userId = getCurrentUserId()
  if (!userId) {
    list.value = []
    errorMsg.value = '请先登录后查看通知'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    list.value = await getNoticeList(userId)
    uni.setStorageSync(NOTICE_REFRESH_KEY, true)
  } catch (error: any) {
    errorMsg.value = error?.message || '通知加载失败'
  } finally {
    loading.value = false
  }
}

async function openNotice(item: NoticeItem) {
  const userId = getCurrentUserId()
  if (!userId) return
  if (!item.read) {
    try {
      await markNoticeRead(item.id, userId)
      item.read = true
      uni.setStorageSync(NOTICE_REFRESH_KEY, true)
    } catch (error) {}
  }
  uni.showModal({
    title: item.title || '通知详情',
    content: item.content || '暂无内容',
    showCancel: false
  })
}

onShow(() => {
  loadData()
})
</script>

<template>
  <view class="min-h-screen bg-gray-50 px-4 pt-4">
    <view class="mb-3 flex items-center justify-between">
      <text class="text-base font-bold text-fresh">通知中心</text>
      <text class="text-xs text-gray-400">点击可标记已读</text>
    </view>

    <view v-if="loading" class="py-8 text-center">
      <text class="text-sm text-gray-400">加载中...</text>
    </view>

    <view v-else-if="errorMsg" class="py-8 text-center">
      <text class="text-sm text-red-500 block mb-2">{{ errorMsg }}</text>
      <view class="inline-block text-xs px-3 py-1 rounded-full border border-gray-200 mr-2" @click="loadData">重试</view>
      <view
        v-if="errorMsg.includes('请先登录')"
        class="inline-block text-xs px-3 py-1 rounded-full border border-orange-200 text-orange-600"
        @click="goLogin"
      >
        去登录
      </view>
    </view>

    <view v-else-if="!list.length" class="py-8 text-center">
      <text class="text-sm text-gray-400">暂无通知</text>
    </view>

    <view v-else class="space-y-3">
      <view
        v-for="item in list"
        :key="item.id"
        class="bg-white rounded-lg p-4 shadow-sm"
        @click="openNotice(item)"
      >
        <view class="flex items-start justify-between">
          <text class="text-sm font-bold text-fresh pr-2 line-clamp-1">{{ item.title }}</text>
          <view v-if="!item.read" class="w-2 h-2 rounded-full bg-red-500 mt-1 flex-shrink-0"></view>
        </view>
        <text class="text-xs text-gray-500 line-clamp-2 mt-2">{{ item.content }}</text>
        <text class="text-[22rpx] text-gray-400 mt-2 block">{{ item.createTime || '-' }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.wxss-page-fix {
  display: block;
}
</style>

