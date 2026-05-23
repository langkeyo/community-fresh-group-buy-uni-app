<script setup lang="ts">
import { getUserList } from '@/api/user'
import BaseSmartImage from '@/components/base/BaseSmartImage.vue'
import { DEFAULT_AVATAR_PATH } from '@/constants/ui'
import { getNoticeList } from '@/services/notice'
import { getOrderList } from '@/services/order'
import { getProductList } from '@/services/product'
import { getSystemConfig } from '@/services/system-config'
import type { RecommendMenuItem } from '@/types/system-config'
import { resolveAvatarUrl } from '@/utils/avatar'
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
const groupFeedList = ref<{ text: string; productId: number }[]>([])
const currentUserInfo = ref<any | null>(null)
const locationLabel = ref('点击定位并选择自提点')
const homeOrderTip = ref('上午下单预计当日18:00后可提货，下午下单预计次日10:00后可提货')
const pendingGroupCount = ref(0)
const pendingPickupCount = ref(0)
const aiEntryVisible = ref(false)

function parseTime(ts?: string) {
  if (!ts) return null
  const date = new Date(String(ts).replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

function syncOrderTabBadge(count: number) {
  if (count > 0) {
    uni.setTabBarBadge({
      index: 2,
      text: count > 99 ? '99+' : String(count)
    })
  } else {
    uni.removeTabBarBadge({ index: 2 })
  }
}

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
    aiEntryVisible.value = Boolean(config.aiAssistantEnabled)

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
      return {
        text: `第${idx + 1}组正在拼「${item.name}」${size}人团`,
        productId: item.id
      }
    })

    const usersRes = await getUserList()
    const leaders = (usersRes.data || []).filter((u) => Boolean(u?.isLeader))
    leaderList.value = leaders.slice(0, 1).map((item) => ({
      id: item.id,
      name: item.nickname || `团长#${item.id}`,
      avatar: resolveAvatarUrl(item.avatar, DEFAULT_AVATAR_PATH),
      community: `联系方式：${maskMobile(item.mobile)}`,
      membersLabel: `团长ID #${item.id}`
    }))

    const stored = uni.getStorageSync('userInfo')
    const userInfo = stored
      ? typeof stored === 'string'
        ? JSON.parse(stored)
        : stored
      : null
    currentUserInfo.value = userInfo
    const userId = Number(userInfo?.id || 0)
    if (userId > 0) {
      const notices = await getNoticeList(userId)
      noticeUnreadCount.value = notices.filter((item) => !item.read).length
      try {
        const orders = await getOrderList(userId)
        pendingGroupCount.value = orders.filter((x) => x.status === 1).length
        pendingPickupCount.value = orders.filter((x) => x.status === 2).length
        syncOrderTabBadge(pendingGroupCount.value + pendingPickupCount.value)
        const latest = orders
          .filter((x) => x.status === 1 || x.status === 2)
          .sort((a, b) => {
            const ta = parseTime(a.createTime)?.getTime() || 0
            const tb = parseTime(b.createTime)?.getTime() || 0
            return tb - ta
          })[0]
        if (latest) {
          if (latest.status === 1) {
            homeOrderTip.value = '待成团订单将在成团后约2小时内可提货，请留意订单通知'
          } else {
            const hour = parseTime(latest.createTime)?.getHours() ?? 9
            homeOrderTip.value =
              hour < 12
                ? '该订单预计今日18:00后可提货，请关注订单详情提醒'
                : '该订单预计次日10:00后可提货，请关注订单详情提醒'
          }
        }
      } catch {
        pendingGroupCount.value = 0
        pendingPickupCount.value = 0
        syncOrderTabBadge(0)
      }
    } else {
      noticeUnreadCount.value = 0
      pendingGroupCount.value = 0
      pendingPickupCount.value = 0
      syncOrderTabBadge(0)
    }

    const pickName = String(uni.getStorageSync('default_pick_point_name') || '').trim()
    locationLabel.value = pickName || '点击定位并选择自提点'
  } catch (error: any) {
    uni.showToast({
      title: error?.message || '首页数据加载失败',
      icon: 'none'
    })
    hotProductList.value = []
    leaderList.value = []
    noticeUnreadCount.value = 0
    pendingGroupCount.value = 0
    pendingPickupCount.value = 0
    syncOrderTabBadge(0)
    locationLabel.value = '点击定位并选择自提点'
    aiEntryVisible.value = false
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

function goToPickPointPage() {
  uni.navigateTo({ url: '/pages/self-pick-map/self-pick-map' })
}

function goToNoticePage() {
  if (!ensureLogin('查看通知')) return
  uni.navigateTo({ url: '/pages/notice/notice' })
}

function ensureLogin(actionText = '继续操作'): boolean {
  const token = uni.getStorageSync('token')
  if (token) return true
  uni.showModal({
    title: '请先登录',
    content: `${actionText}需要先登录，是否前往登录页？`,
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({ url: '/pages/login/login' })
      }
    }
  })
  return false
}

function goToAiFoodPage() {
  if (!aiEntryVisible.value) {
    uni.showToast({ title: 'AI功能暂未开启', icon: 'none' })
    return
  }
  aiDotVisible.value = false
  uni.setStorageSync(HOME_AI_DOT_READ_KEY, true)
  uni.navigateTo({ url: '/pages/ai-food/ai-food' })
}

function markGroupFeedRead() {
  if (!groupFeedDotVisible.value) return
  groupFeedDotVisible.value = false
  uni.setStorageSync(HOME_GROUP_FEED_DOT_READ_KEY, true)
}

function goToGroupFeedItem(item: { productId: number }) {
  markGroupFeedRead()
  goToHotGroupBuy(item.productId)
}

function goToBanner(item: { productId: number }) {
  goToProductDetail(item.productId)
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

function goToProductDetail(productId: number) {
  uni.navigateTo({ url: `/pages/goods/detail?id=${productId}` })
}

function goToLeaderEntry() {
  if (!ensureLogin('进入团长入口')) return
  if (currentUserInfo.value?.isLeader) {
    uni.navigateTo({ url: '/pages/leader/leader' })
    return
  }
  uni.navigateTo({ url: '/pages/mine/mine' })
}
</script>

<template>
  <view class="min-h-screen bg-gray-50 px-4 pt-4 space-y-5 safe-bottom-padding">
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

    <view class="section-card order-tip-card">
      <view class="flex items-center justify-between">
        <text class="text-sm font-bold text-fresh">订单提醒</text>
        <text class="text-[22rpx] text-orange-600">待成团{{ pendingGroupCount }} · 待取货{{ pendingPickupCount }}</text>
      </view>
      <text class="block text-[22rpx] text-gray-500 mt-2">{{ homeOrderTip }}</text>
    </view>

    <!-- 搜索框 -->
    <view class="flex items-center gap-2">
      <view
        class="location-entry"
        @click="goToPickPointPage"
      >
        <uni-icons type="location-filled" size="16" color="#F08800" />
        <text class="text-[22rpx] text-[#2F5233] line-clamp-1 ml-1">{{ locationLabel }}</text>
      </view>
      <view
        class="search-entry flex-1"
        @click="goToSearchPage"
      >
        <text class="text-gray-400 text-base">搜索今日特价生鲜...</text>
      </view>
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
      v-if="aiEntryVisible"
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

    <view class="section-card px-4 py-3">
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
            <swiper-item v-for="(item, idx) in groupFeedList" :key="idx" class="feed-swiper-item" @click="goToGroupFeedItem(item)">
              <text class="text-xs text-gray-600 line-clamp-1 feed-item-text">{{ item.text }}</text>
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
          @click="goToProductDetail(item.id)"
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
      <view class="flex items-center justify-between">
        <text class="text-base font-bold text-fresh">今日明星团长</text>
        <text class="text-xs text-primary" @click="goToLeaderEntry">
          {{ currentUserInfo?.isLeader ? '进入团长工作台' : '查看团长入口' }}
        </text>
      </view>

      <view
        class="bg-secondary rounded-lg p-4 flex items-center gap-4 active:opacity-90"
        @click="goToLeaderEntry"
      >
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
        <view class="text-right">
          <text class="block text-xs text-gray-600"
            >{{ leaderList[0].membersLabel }}</text
          >
          <text class="block text-[20rpx] text-primary mt-1">可点击查看</text>
        </view>
      </view>
    </view>

    <view class="section-card p-4 space-y-2" v-else>
      <view class="flex items-center justify-between">
        <text class="text-base font-bold text-fresh">团长入口</text>
        <text class="text-xs text-gray-500">订单核销与管理都在团长工作台</text>
      </view>
      <view
        class="bg-[#F6FBF7] border border-[#D8EAD9] rounded-lg p-4 flex items-center justify-between active:opacity-90"
        @click="goToLeaderEntry"
      >
        <view>
          <text class="block text-sm font-bold text-[#2F5233]">
            {{ currentUserInfo?.isLeader ? '进入团长工作台' : '申请成为团长' }}
          </text>
          <text class="block text-xs text-gray-500 mt-1">
            {{ currentUserInfo?.isLeader ? '核销、查看待办、回看最近核销' : '当前账号未开通团长权限，可前往“我的”页提交申请' }}
          </text>
        </view>
        <text class="text-xs text-primary">{{ currentUserInfo?.isLeader ? '去查看' : '去申请' }}</text>
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

.order-tip-card {
  border: 1rpx solid #fed7aa;
  background: #fffbeb;
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

.location-entry {
  display: flex;
  align-items: center;
  background: #fff7ed;
  border-radius: 9999rpx;
  height: 56rpx;
  padding: 0 18rpx;
  border: 1rpx solid #f9c692;
  max-width: 320rpx;
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
