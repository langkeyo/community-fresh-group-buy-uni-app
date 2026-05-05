<script setup lang="ts">
import { getUserList } from '@/api/user'
import BaseSmartImage from '@/components/base/BaseSmartImage.vue'
import { DEFAULT_AVATAR_PATH } from '@/constants/ui'
import { getNoticeList } from '@/services/notice'
import { getProductList } from '@/services/product'
import { getSystemConfig } from '@/services/system-config'
import type { RecommendMenuItem } from '@/types/system-config'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'

const PENDING_GOODS_CATEGORY_KEY = 'pending_goods_category'
const HOME_AI_DOT_READ_KEY = 'home_ai_dot_read'
const HOME_GROUP_FEED_DOT_READ_KEY = 'home_group_feed_dot_read'

const categoryList = ref<RecommendMenuItem[]>([])
const bannerList = ref<
  {
    id: number
    title: string
    imageUrl: string
    productId: number
    badgeText: string
  }[]
>([])

const hotProductList = ref<
  {
    id: number
    name: string
    image: string
    groupLabel: string
    stockLabel: string
    price: string
    originalPrice: string
  }[]
>([])

const leaderList = ref<
  {
    id: number
    name: string
    avatar: string
    community: string
    membersLabel: string
  }[]
>([])

const hotLoading = ref(false)
const noticeText = ref('')
const aiDotVisible = ref(false)
const groupFeedDotVisible = ref(false)
const noticeUnreadCount = ref(0)
const groupFeedList = ref<string[]>([])

function maskMobile(mobile?: string) {
  const text = String(mobile || '').trim()
  if (!/^1\d{10}$/.test(text)) return '联系方式待完善'
  return `${text.slice(0, 3)}****${text.slice(7)}`
}

async function loadHomeData() {
  hotLoading.value = true
  try {
    const config = await getSystemConfig()
    noticeText.value = config.noticeText || ''
    categoryList.value = config.recommendMenus || []

    const products = await getProductList()
    const productMap = new Map(products.map((item) => [item.id, item]))
    bannerList.value = (config.homeBanners || [])
      .map((item, idx) => {
        const product = productMap.get(item.productId)
        return {
          id: item.productId || idx + 1,
          title: item.title || product?.name || '推荐商品',
          imageUrl: item.imageUrl || product?.images?.[0] || '',
          productId: item.productId,
          badgeText: item.badgeText || ''
        }
      })
      .filter((item) => Number(item.productId) > 0)
    if (!bannerList.value.length) {
      bannerList.value = products.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.name,
        imageUrl: item.images?.[0] || '',
        productId: item.id,
        badgeText: ''
      }))
    }
    hotProductList.value = products.slice(0, 4).map((item) => {
      const groupPrice = item.groupPrice2 ?? item.groupPrice3 ?? item.price
      const groupPeople = item.groupPrice3 != null ? 3 : 2
      return {
        id: item.id,
        name: item.name,
        image: item.images?.[0] || '',
        groupLabel: `${groupPeople}人团`,
        stockLabel: `库存${item.stock}`,
        price: groupPrice.toFixed(2),
        originalPrice: item.price.toFixed(2)
      }
    })
    groupFeedList.value = products.slice(0, 6).map((item, idx) => {
      const size = item.groupPrice3 != null ? 3 : 2
      return `第${idx + 1}组正在拼「${item.name}」${size}人团`
    })

    const usersRes = await getUserList()
    const leaders = (usersRes.data || []).filter((u) => Boolean(u?.isLeader))
    leaderList.value = leaders.slice(0, 1).map((item) => ({
      id: item.id,
      name: item.nickname || `团长#${item.id}`,
      avatar: item.avatar || DEFAULT_AVATAR_PATH,
      community: `联系方式：${maskMobile(item.mobile)}`,
      membersLabel: `团长ID #${item.id}`
    }))

    const stored = uni.getStorageSync('userInfo')
    const userInfo = stored
      ? typeof stored === 'string'
        ? JSON.parse(stored)
        : stored
      : null
    const userId = Number(userInfo?.id || 0)
    if (userId > 0) {
      const notices = await getNoticeList(userId)
      noticeUnreadCount.value = notices.filter((item) => !item.read).length
    } else {
      noticeUnreadCount.value = 0
    }
  } catch (error: any) {
    uni.showToast({
      title: error?.message || '首页数据加载失败',
      icon: 'none'
    })
    hotProductList.value = []
    leaderList.value = []
    noticeUnreadCount.value = 0
  } finally {
    hotLoading.value = false
  }
}

onShow(() => {
  aiDotVisible.value = !Boolean(uni.getStorageSync(HOME_AI_DOT_READ_KEY))
  groupFeedDotVisible.value = !Boolean(uni.getStorageSync(HOME_GROUP_FEED_DOT_READ_KEY))
  loadHomeData()
})

function goToProductPage(category?: string) {
  if (category) {
    uni.setStorageSync(PENDING_GOODS_CATEGORY_KEY, category)
  } else {
    uni.removeStorageSync(PENDING_GOODS_CATEGORY_KEY)
  }
  uni.switchTab({ url: '/pages/goods/goods' })
}

function goToSearchPage() {
  uni.navigateTo({ url: '/pages/search/search' })
}

function goToNoticePage() {
  uni.navigateTo({ url: '/pages/notice/notice' })
}

function goToAiFoodPage() {
  aiDotVisible.value = false
  uni.setStorageSync(HOME_AI_DOT_READ_KEY, true)
  uni.navigateTo({ url: '/pages/ai-food/ai-food' })
}

function markGroupFeedRead() {
  if (!groupFeedDotVisible.value) return
  groupFeedDotVisible.value = false
  uni.setStorageSync(HOME_GROUP_FEED_DOT_READ_KEY, true)
}

function goToBanner(item: { productId: number }) {
  goToHotGroupBuy(item.productId)
}

function goToHotGroupBuy(productId: number) {
  const storedPickId = Number(uni.getStorageSync('default_pick_point_id'))
  const hasDefaultPick = Number.isFinite(storedPickId) && storedPickId > 0

  if (!hasDefaultPick) {
    uni.showToast({
      title: '请先选择默认自提点',
      icon: 'none'
    })
    uni.navigateTo({ url: '/pages/self-pick/self-pick' })
    return
  }

  uni.navigateTo({
    url: `/pages/group-buy/group-buy?id=${productId}&pickPointId=${storedPickId}`
  })
}
</script>

<template>
  <view class="min-h-screen bg-gray-50 px-4 pt-4 space-y-5">
    <view
      v-if="noticeText"
      class="section-card notice-card"
    >
      <text class="text-xs text-orange-700">{{ noticeText }}</text>
      <view
        class="notice-entry"
        @click="goToNoticePage"
      >
        <text class="text-[22rpx] text-orange-600">通知</text>
        <view
          v-if="noticeUnreadCount > 0"
          class="ml-1 min-w-[28rpx] h-[28rpx] px-1 rounded-full bg-red-500 text-white text-[20rpx] flex items-center justify-center"
        >
          {{ noticeUnreadCount > 99 ? '99+' : noticeUnreadCount }}
        </view>
      </view>
    </view>

    <!-- 搜索框 -->
    <view
      class="search-entry"
      @click="goToSearchPage"
    >
      <text class="text-gray-400 text-base">搜索今日特价生鲜...</text>
    </view>

    <!-- 轮播图 -->
    <view class="mt-4 section-card p-0 overflow-hidden">
      <swiper
        class="h-40 w-full"
        indicator-dots
        autoplay
        circular
        :interval="4000"
        indicator-active-color="#F08800"
      >
        <swiper-item
          v-for="item in bannerList"
          :key="item.id"
          class="relative"
          @click="goToBanner(item)"
        >
          <BaseSmartImage
            :src="item.imageUrl"
            class-name="w-full h-full"
            fallback-bg="#f08800"
            fallback-color="#ffffff"
            :fallback-text="item.title"
          />
          <view
            v-if="item.badgeText"
            class="absolute top-2 left-2 bg-black/55 text-white text-[20rpx] px-2 py-0.5 rounded-full"
          >
            {{ item.badgeText }}
          </view>
        </swiper-item>
      </swiper>
      <view v-if="!bannerList.length" class="h-40 bg-white flex items-center justify-center">
        <text class="text-xs text-gray-400">暂无轮播数据</text>
      </view>
    </view>

    <!-- 分类 -->
    <view class="section-card">
      <view class="flex">
        <view
          v-for="item in categoryList"
          :key="item.value"
          class="w-1/4 text-center"
          @click="goToProductPage(item.value)"
        >
          <view
            class="w-14 h-14 mx-auto flex rounded-full items-center justify-center"
            :class="item.bg"
          >
            <!-- <text class="text-sm font-bold" :class="item.color">{{
              item.name[0]
            }}</text> -->
            <uni-icons :type="item.icon" :color="item.iconColor" size="22" />
          </view>
          <text class="block mt-2 text-sm text-fresh">{{ item.name }}</text>
        </view>
      </view>
    </view>

    <!-- AI 模块 -->
    <view
      class="section-card bg-gradient-to-r from-secondary to-white flex items-center justify-between"
      @click="goToAiFoodPage"
    >
      <view>
        <view class="flex items-center">
          <text class="block text-sm font-bold text-fresh">AI 食材搭配助手</text>
          <view v-if="aiDotVisible" class="w-2 h-2 rounded-full bg-red-500 ml-2"></view>
        </view>
        <text class="block text-sm text-gray-500">不知道吃什么？问问AI</text>
      </view>
      <view class="bg-primary text-white text-sm px-3 py-1.5 rounded-full">
        立即体验
      </view>
    </view>

    <view class="section-card px-4 py-3" @click="markGroupFeedRead">
      <view class="flex items-center">
        <view class="flex items-center mr-3">
          <text class="text-xs text-primary font-bold leading-normal">实时拼单</text>
          <view
            v-if="groupFeedDotVisible"
            class="w-2 h-2 rounded-full bg-red-500 ml-1.5 shrink-0"
          ></view>
        </view>
        <swiper
          class="flex-1 feed-swiper"
          vertical
          autoplay
          circular
          :interval="2400"
          :duration="500"
        >
          <swiper-item v-for="(item, idx) in groupFeedList" :key="idx" class="feed-swiper-item">
            <text class="text-xs text-gray-600 line-clamp-1 feed-item-text">{{ item }}</text>
          </swiper-item>
        </swiper>
      </view>
    </view>

    <!-- 热门拼团 -->
    <view class="space-y-2">
      <text class="text-base font-bold text-fresh">限时火热拼团</text>

      <view class="grid grid-cols-2 gap-4">
        <view
          v-for="item in hotProductList"
          :key="item.id"
          class="section-card p-4 tap-card"
          @click="goToHotGroupBuy(item.id)"
        >
          <!-- <view class="w-full h-20 bg-secondary rounded-md mb-2"></view> -->
          <BaseSmartImage
            :src="item.image"
            class-name="w-full h-20 rounded-md mb-2"
            fallback-bg="#eef2f7"
            fallback-color="#667085"
            :fallback-text="item.name"
          />
          <text class="text-sm text-fresh font-bold line-clamp-2">{{
            item.name
          }}</text>

          <view class="mt-2 flex items-center gap-1">
            <text
              class="text-xs text-primary border border-primary px-1 rounded"
              >{{ item.groupLabel }}</text
            >
            <text class="text-xs text-gray-500 bg-gray-100 px-1 rounded"
              >{{ item.stockLabel }}</text
            >
          </view>

          <view class="mt-2">
            <text class="text-xs text-primary">￥</text>
            <text class="text-base font-bold text-primary">{{
              item.price
            }}</text>
            <text class="text-xs text-gray-400 line-through ml-1"
              >￥{{ item.originalPrice }}</text
            >
          </view>
        </view>
      </view>
      <view v-if="hotLoading" class="py-2 text-center">
        <text class="text-xs text-gray-400">加载中...</text>
      </view>
      <view v-else-if="!hotProductList.length" class="py-2 text-center">
        <text class="text-xs text-gray-400">暂无可拼团商品</text>
      </view>
    </view>

    <!-- 团长模块 -->
    <view class="section-card p-4 space-y-2" v-if="leaderList.length">
      <text class="text-base font-bold text-fresh">今日明星团长</text>

      <view class="bg-secondary rounded-lg p-4 flex items-center gap-4">
        <BaseSmartImage
          :src="leaderList[0].avatar"
          class-name="w-14 h-14 rounded-full border border-white/80 overflow-hidden bg-white"
          fallback-bg="#fff7ed"
          fallback-color="#f08800"
          fallback-text="团长"
        />
        <view class="flex-1">
          <text class="block text-sm font-bold text-fresh">{{
            leaderList[0].name
          }}</text>
          <text class="block text-xs text-gray-500">{{
            leaderList[0].community
          }}</text>
        </view>
        <text class="text-xs text-gray-600"
          >{{ leaderList[0].membersLabel }}</text
        >
      </view>
    </view>

    <!-- 底部提示 -->
    <view class="py-4 text-center">
      <text class="text-xs text-gray-400">- 到底了，去看看别的吧 -</text>
    </view>
  </view>
</template>

<style scoped>
.section-card {
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 20rpx rgba(15, 23, 42, 0.05);
  padding: 16rpx;
}

.notice-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1rpx solid #f9c692;
  background: #fff7ed;
}

.notice-entry {
  margin-left: 12rpx;
  padding: 6rpx 12rpx;
  border-radius: 9999rpx;
  border: 1rpx solid #f9c692;
  background: #fff;
  display: flex;
  align-items: center;
}

.search-entry {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 9999rpx;
  height: 56rpx;
  padding: 0 20rpx;
  border: 1rpx solid #e5e7eb;
  box-shadow: 0 4rpx 12rpx rgba(15, 23, 42, 0.04);
}

.tap-card:active {
  transform: scale(0.99);
}

.feed-swiper {
  height: 40rpx;
}

.feed-swiper-item {
  display: flex;
  align-items: center;
}

.feed-item-text {
  line-height: 1.5;
  padding-right: 8rpx;
}
</style>
