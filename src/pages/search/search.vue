<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'
import BaseSmartImage from '@/components/base/BaseSmartImage.vue'
import { getProductList } from '@/services/product'
import type { ProductItem } from '@/types/product'
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const HISTORY_KEY = 'search_history_keywords'
const HOT_KEYWORDS = [
  '番茄',
  '土豆',
  '鸡蛋',
  '牛奶',
  '草莓',
  '生菜',
  '排骨',
  '三文鱼'
]
const SEARCH_MIN_LOADING_MS = 500
let searchRequestToken = 0
const keyword = ref('')
const searching = ref(false)
const hasSearched = ref(false)
const goodsList = ref<ProductItem[]>([])
const historyList = ref<string[]>([])
const normalizedKeyword = computed(() => keyword.value.trim())

const viewGoods = computed(() => {
  return goodsList.value.map((item) => ({
    ...item,
    groupPriceDisplay: (
      item.groupPrice2 ??
      item.groupPrice3 ??
      item.price
    ).toFixed(2),
    originPriceDisplay: item.price.toFixed(2),
    cover: item.images[0] || ''
  }))
})

const recommendList = computed(() => {
  const pool = [...historyList.value, ...HOT_KEYWORDS]
  const unique = Array.from(new Set(pool))
  const q = normalizedKeyword.value.toLowerCase()
  if (!q) return unique.slice(0, 8)
  return unique.filter((item) => item.toLowerCase().includes(q)).slice(0, 8)
})

function loadHistory() {
  const raw = uni.getStorageSync(HISTORY_KEY)
  if (!raw) {
    historyList.value = []
    return
  }
  const list = Array.isArray(raw) ? raw : []
  historyList.value = list.filter((x) => typeof x === 'string').slice(0, 8)
}

function saveHistory(term: string) {
  const normalized = term.trim()
  if (!normalized) return
  const next = [
    normalized,
    ...historyList.value.filter((x) => x !== normalized)
  ].slice(0, 8)
  historyList.value = next
  uni.setStorageSync(HISTORY_KEY, next)
}

function removeHistory(term: string) {
  const normalized = term.trim()
  if (!normalized) return
  const next = historyList.value.filter((x) => x !== normalized).slice(0, 8)
  historyList.value = next
  uni.setStorageSync(HISTORY_KEY, next)
}

function clearHistory() {
  historyList.value = []
  uni.removeStorageSync(HISTORY_KEY)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function doSearch(term?: string) {
  const token = ++searchRequestToken
  const query = (term ?? keyword.value).trim()
  keyword.value = query
  hasSearched.value = true
  searching.value = true
  const startedAt = Date.now()
  let nextGoodsList: ProductItem[] = []
  let searchErrorMsg = ''
  try {
    nextGoodsList = await getProductList(query || undefined)
    if (query && nextGoodsList.length > 0) {
      saveHistory(query)
    } else if (query) {
      removeHistory(query)
    }
  } catch (error: any) {
    nextGoodsList = []
    searchErrorMsg = error?.message || '搜索失败，请重试'
  }

  const elapsed = Date.now() - startedAt
  if (elapsed < SEARCH_MIN_LOADING_MS) {
    await sleep(SEARCH_MIN_LOADING_MS - elapsed)
  }

  if (token !== searchRequestToken) return

  goodsList.value = nextGoodsList
  if (searchErrorMsg) {
    uni.showToast({ title: searchErrorMsg, icon: 'none' })
  }
  searching.value = false
}

function onKeywordInput() {
  hasSearched.value = false
}

function goToDetail(id: number) {
  uni.navigateTo({ url: `/pages/goods/detail?id=${id}` })
}

function goToGroupBuy(id: number) {
  const pickPointId = Number(uni.getStorageSync('default_pick_point_id'))
  if (!pickPointId) {
    uni.showToast({ title: '请先选择自提点', icon: 'none' })
    uni.navigateTo({ url: '/pages/self-pick/self-pick' })
    return
  }
  uni.navigateTo({
    url: `/pages/group-buy/group-buy?id=${id}&pickPointId=${pickPointId}`
  })
}

onLoad((query) => {
  loadHistory()
  const q = String(query?.q || '').trim()
  if (q) {
    doSearch(q)
  }
})
</script>

<template>
  <view class="min-h-screen bg-gray-50 px-4 pt-4 space-y-4">
    <view
      class="h-14 p-1 bg-white border border-gray-200 rounded-full shadow-sm"
    >
      <view class="flex items-center h-full px-2 bg-gray-100 rounded-full">
        <view class="flex items-center flex-1 h-full px-2 rounded-full">
          <uni-icons type="search" size="18" color="#9CA3AF" />
          <input
            v-model="keyword"
            type="text"
            confirm-type="search"
            placeholder="输入商品名称/关键词"
            placeholder-class="text-gray-400 text-base"
            class="flex-1 ml-2 text-base h-full"
            @input="onKeywordInput"
            @confirm="doSearch()"
          />
        </view>
        <view
          class="h-full ml-2 px-6 rounded-full flex items-center justify-center bg-gradient-to-b from-orange-400 to-primary transition-opacity duration-150"
          :class="searching ? 'opacity-75' : 'opacity-100'"
          hover-class="opacity-85"
          :hover-stay-time="120"
          @click="!searching && doSearch()"
        >
          <view v-if="searching" class="search-btn__spinner"></view>
          <text class="text-sm text-white font-medium">搜索</text>
        </view>
      </view>
    </view>

    <view
      v-if="normalizedKeyword && recommendList.length"
      class="bg-white rounded-lg p-4 shadow-sm space-y-3"
    >
      <view class="flex items-center justify-between">
        <text class="text-sm font-bold text-fresh">推荐搜索</text>
        <text class="text-xs text-gray-400">点击即可搜索</text>
      </view>
      <view class="flex flex-wrap gap-2">
        <view
          v-for="item in recommendList"
          :key="item"
          class="px-3 py-1.5 rounded-full bg-orange-50 text-xs text-primary border border-orange-100"
          @click="doSearch(item)"
        >
          {{ item }}
        </view>
      </view>
    </view>

    <view
      class="bg-white rounded-lg p-4 shadow-sm space-y-3"
      v-if="historyList.length"
    >
      <view class="flex items-center justify-between">
        <text class="text-sm font-bold text-fresh">最近搜索</text>
        <text class="text-xs text-gray-400" @click="clearHistory">清空</text>
      </view>
      <view class="flex flex-wrap gap-2">
        <view
          v-for="item in historyList"
          :key="item"
          class="px-3 py-1.5 rounded-full bg-gray-100 text-xs text-gray-600"
          @click="doSearch(item)"
        >
          {{ item }}
        </view>
      </view>
    </view>

    <view class="space-y-3">
      <BaseCard
        v-for="item in viewGoods"
        :key="item.id"
        class="goods-card"
        @click="goToDetail(item.id)"
      >
        <view class="flex gap-3 h-32">
          <BaseSmartImage
            :src="item.cover"
            class-name="w-32 h-32 bg-secondary rounded-md flex-shrink-0"
            fallback-bg="#eef2f7"
            fallback-color="#667085"
            :fallback-text="item.name"
          />
          <view class="flex-1 min-w-0 h-32 flex flex-col overflow-hidden">
            <text class="block text-base font-bold text-fresh line-clamp-2">{{
              item.name
            }}</text>
            <text class="block text-xs text-gray-500 mt-1"
              >商品编号：{{ item.id }}</text
            >
            <view class="flex-1 flex items-center gap-2">
              <text class="text-xs text-primary">团购价</text>
              <text class="text-base font-bold text-primary"
                >￥{{ item.groupPriceDisplay }}</text
              >
              <text class="text-xs text-gray-400 line-through"
                >￥{{ item.originPriceDisplay }}</text
              >
            </view>
          </view>
          <view class="h-32 flex items-end pb-1 flex-shrink-0">
          <view
              class="buy-btn"
              hover-class="opacity-80"
              :hover-stay-time="100"
              @click.stop="goToGroupBuy(item.id)"
            >
              去拼团
            </view>
          </view>
        </view>
      </BaseCard>

      <view v-if="searching" class="py-4 text-center">
        <text class="text-xs text-gray-400">搜索中...</text>
      </view>
      <view
        v-else-if="hasSearched && normalizedKeyword && !viewGoods.length"
        class="py-8 text-center"
      >
        <text class="text-sm text-gray-400">没有找到相关商品，换个词试试</text>
      </view>
      <view
        v-else-if="!hasSearched && normalizedKeyword && !viewGoods.length"
        class="py-8 text-center"
      >
        <text class="text-sm text-gray-400"
          >可点上方推荐词，或点击右侧搜索</text
        >
      </view>
      <view
        v-else-if="!hasSearched && !normalizedKeyword && !viewGoods.length"
        class="py-8 text-center"
      >
        <text class="text-sm text-gray-400">输入关键词开始搜索</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.search-btn__spinner {
  width: 20rpx;
  height: 20rpx;
  margin-right: 8rpx;
  border-radius: 9999rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  flex-shrink: 0;
  animation: search-btn-spin 0.6s linear infinite;
}

@keyframes search-btn-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.goods-card:active {
  transform: scale(0.995);
}

.buy-btn {
  padding: 10rpx 24rpx;
  border-radius: 9999rpx;
  border: 1rpx solid #f08800;
  background: #f08800;
  color: #fff;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.buy-btn:active {
  background: #e67700;
}
</style>
