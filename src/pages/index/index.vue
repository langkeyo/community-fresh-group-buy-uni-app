<script setup lang="ts">
import { getUserList } from '@/api/user'
import { getProductList } from '@/services/product'
import { getSystemConfig } from '@/services/system-config'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'

const PENDING_GOODS_CATEGORY_KEY = 'pending_goods_category'

const bannerList = [
  {
    id: 1,
    image: 'https://loremflickr.com/750/300/supermarket,vegetables?lock=10',
    link: '/pages/goods/goods'
  }
]

const categoryList = [
  {
    name: '蔬菜',
    value: 'vegetable',
    bg: 'bg-green-100',
    color: 'text-green-600',
    icon: 'fire-filled',
    iconColor: '#16a34a'
  },
  {
    name: '水果',
    value: 'fruit',
    bg: 'bg-red-100',
    color: 'text-red-600',
    icon: 'gift-filled',
    iconColor: '#dc2626'
  },
  {
    name: '肉蛋',
    value: 'meat',
    bg: 'bg-orange-100',
    color: 'text-orange-600',
    icon: 'cart-filled',
    iconColor: '#ea580c'
  },
  {
    name: '海鲜',
    value: 'seafood',
    bg: 'bg-blue-100',
    color: 'text-blue-600',
    icon: 'flag-filled',
    iconColor: '#2563eb'
  }
]

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
    community: string
    membersLabel: string
  }[]
>([])

const hotLoading = ref(false)
const noticeText = ref('')

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

    const products = await getProductList()
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

    const usersRes = await getUserList()
    const leaders = (usersRes.data || []).filter((u) => Boolean(u?.isLeader))
    leaderList.value = leaders.slice(0, 1).map((item) => ({
      id: item.id,
      name: item.nickname || `团长#${item.id}`,
      community: `联系方式：${maskMobile(item.mobile)}`,
      membersLabel: `团长ID #${item.id}`
    }))
  } catch (error: any) {
    uni.showToast({
      title: error?.message || '首页数据加载失败',
      icon: 'none'
    })
    hotProductList.value = []
    leaderList.value = []
    noticeText.value = ''
  } finally {
    hotLoading.value = false
  }
}

onShow(() => {
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

function goToAiFoodPage() {
  uni.navigateTo({ url: '/pages/ai-food/ai-food' })
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
      class="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3"
    >
      <text class="text-xs text-orange-700">{{ noticeText }}</text>
    </view>

    <!-- 搜索框 -->
    <view
      class="flex items-center bg-white rounded-full h-14 px-5 text-base shadow-sm border border-gray-200"
      @click="goToSearchPage"
    >
      <text class="text-gray-400 text-base">搜索今日特价生鲜...</text>
    </view>

    <!-- 轮播图 -->
    <view class="mt-4">
      <swiper
        class="h-40 w-full bg-white rounded-lg overflow-hidden"
        indicator-dots
        autoplay
        circular
        :interval="4000"
        indicator-active-color="#F08800"
      >
        <swiper-item v-for="item in bannerList" :key="item.id">
          <image :src="item.image" mode="aspectFill" class="w-full h-full" />
        </swiper-item>
      </swiper>
    </view>

    <!-- 分类 -->
    <view class="bg-white rounded-lg p-4 shadow-sm">
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
      class="bg-gradient-to-r from-secondary to-white rounded-lg p-4 flex items-center justify-between shadow-sm"
      @click="goToAiFoodPage"
    >
      <view>
        <text class="block text-sm font-bold text-fresh">AI 食材搭配助手</text>
        <text class="block text-sm text-gray-500">不知道吃什么？问问AI</text>
      </view>
      <view class="bg-primary text-white text-sm px-3 py-1.5 rounded-full">
        立即体验
      </view>
    </view>

    <!-- 热门拼团 -->
    <view class="space-y-2">
      <text class="text-base font-bold text-fresh">限时火热拼团</text>

      <view class="grid grid-cols-2 gap-4">
        <view
          v-for="item in hotProductList"
          :key="item.id"
          class="bg-white rounded-lg p-4 shadow-sm"
          @click="goToHotGroupBuy(item.id)"
        >
          <!-- <view class="w-full h-20 bg-secondary rounded-md mb-2"></view> -->
          <image
            :src="item.image"
            class="w-full h-20 rounded-md mb-2"
            mode="aspectFill"
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
    <view class="bg-white rounded-lg p-4 shadow-sm space-y-2" v-if="leaderList.length">
      <text class="text-base font-bold text-fresh">今日明星团长</text>

      <view class="bg-secondary rounded-lg p-4 flex items-center gap-4">
        <view class="w-14 h-14 bg-white rounded-full"></view>
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
