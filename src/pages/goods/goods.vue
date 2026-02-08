<script setup lang="ts">
import { ref } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

interface Product {
  id: number
  name: string
  category: string
  image: string
  price: number
  originalPrice: number
  sales: number
}
type SortType = 'default' | 'sales' | 'price'
type PriceOrder = 'asc' | 'desc'

const searchKeyword = ref('')
const activeCategory = ref('all')
const currentSort = ref<SortType>('default')
const priceOrder = ref<PriceOrder>('asc')
const isLoading = ref(false)
const hasMore = ref(true)

const rawData: Product[] = [
  {
    id: 1,
    name: '本地有机红番茄 500g',
    category: 'vegetable',
    image: 'https://loremflickr.com/400/400/tomato,vegetable?lock=1',
    price: 4.99,
    originalPrice: 8.0,
    sales: 1200
  },
  {
    id: 2,
    name: '进口香蕉 1kg',
    category: 'fruit',
    image: 'https://loremflickr.com/400/400/banana,fruit?lock=2',
    price: 9.9,
    originalPrice: 15.0,
    sales: 850
  },
  {
    id: 3,
    name: '鲜活大明虾 400g',
    category: 'seafood',
    image: 'https://loremflickr.com/400/400/shrimp,seafood?lock=3',
    price: 28.8,
    originalPrice: 45.0,
    sales: 300
  },
  {
    id: 4,
    name: '农家土鸡蛋 10枚',
    category: 'meat',
    image: 'https://loremflickr.com/400/400/eggs,food?lock=4',
    price: 12.5,
    originalPrice: 18.0,
    sales: 2100
  },
  {
    id: 5,
    name: '云南小瓜 500g',
    category: 'vegetable',
    image: 'https://loremflickr.com/400/400/zucchini,vegetable?lock=5',
    price: 3.5,
    originalPrice: 5.0,
    sales: 450
  },
  {
    id: 6,
    name: '新鲜猪五花 500g',
    category: 'meat',
    image: 'https://loremflickr.com/400/400/pork,meat?lock=6',
    price: 18.9,
    originalPrice: 25.0,
    sales: 670
  }
]

const goodsList = ref<Product[]>([])
const categories = [
  { label: '全部', value: 'all' },
  { label: '蔬菜', value: 'vegetable' },
  { label: '水果', value: 'fruit' },
  { label: '肉禽', value: 'meat' },
  { label: '海鲜', value: 'seafood' }
]

onShow(() => {
  const tempCate = uni.getStorageSync('temp_category')
  if (tempCate) {
    activeCategory.value = tempCate
    uni.removeStorageSync('temp_category')
    resetAndLoad()
  } else if (goodsList.value.length === 0) {
    resetAndLoad()
  }
})

onPullDownRefresh(() => {
  resetAndLoad(() => uni.stopPullDownRefresh())
})
onReachBottom(() => {
  if (!isLoading.value && hasMore.value) loadMoreData()
})

const resetAndLoad = (callback?: () => void) => {
  isLoading.value = true
  hasMore.value = true
  goodsList.value = []
  setTimeout(() => {
    loadMoreData()
    if (callback) callback()
  }, 500)
}

const loadMoreData = () => {
  isLoading.value = true
  let result = rawData.filter(
    (item) =>
      (activeCategory.value === 'all' ||
        item.category === activeCategory.value) &&
      item.name.includes(searchKeyword.value)
  )
  if (currentSort.value === 'sales') result.sort((a, b) => b.sales - a.sales)
  else if (currentSort.value === 'price')
    result.sort((a, b) =>
      priceOrder.value === 'asc' ? a.price - b.price : b.price - a.price
    )

  if (goodsList.value.length < result.length * 2)
    goodsList.value = [...goodsList.value, ...result]
  else hasMore.value = false
  isLoading.value = false
}

const handleCategoryChange = (cate: string) => {
  activeCategory.value = cate
  resetAndLoad()
}
const handleSortChange = (type: SortType) => {
  if (type === 'price' && currentSort.value === 'price')
    priceOrder.value = priceOrder.value === 'asc' ? 'desc' : 'asc'
  else {
    currentSort.value = type
    if (type === 'price') priceOrder.value = 'asc'
  }
  resetAndLoad()
}
const goToDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/group-buy/group-buy?id=${id}` })
}
</script>

<template>
  <view class="min-h-screen bg-[#F8F8F8] flex flex-col">
    <!-- 固定头部 -->
    <view class="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <!-- 搜索框 -->
      <view class="bg-[#F08800] p-3">
        <view class="bg-white rounded-full flex items-center px-3 h-9">
          <uni-icons
            type="search"
            size="18"
            color="#9ca3af"
            class="mr-2"
          ></uni-icons>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索生鲜商品..."
            placeholder-class="text-gray-400 text-sm"
            class="flex-1 text-sm text-[#2F5233] h-full"
            confirm-type="search"
            @confirm="() => resetAndLoad"
          />
          <!-- 修复点：清除按钮 -->
          <view
            v-if="searchKeyword"
            class="flex items-center justify-center pl-2"
            @click=";(searchKeyword = ''), resetAndLoad()"
          >
            <uni-icons type="clear" size="18" color="#9ca3af"></uni-icons>
          </view>
        </view>
      </view>

      <!-- 分类Tab -->
      <scroll-view
        scroll-x
        class="whitespace-nowrap bg-white border-b border-gray-100"
      >
        <view class="flex px-2">
          <view
            v-for="(cate, index) in categories"
            :key="index"
            class="px-4 py-3 relative flex items-center justify-center"
            @click="handleCategoryChange(cate.value)"
          >
            <text
              class="text-sm transition-colors duration-200"
              :class="
                activeCategory === cate.value
                  ? 'text-[#F08800] font-bold'
                  : 'text-gray-600'
              "
              >{{ cate.label }}</text
            >
            <view
              v-if="activeCategory === cate.value"
              class="absolute bottom-0 w-6 h-0.5 bg-[#F08800] rounded-full"
            ></view>
          </view>
        </view>
      </scroll-view>

      <!-- 排序条 (修复三角箭头) -->
      <view
        class="flex items-center justify-around py-2 bg-white border-b border-gray-100"
      >
        <view
          class="text-sm"
          :class="
            currentSort === 'default'
              ? 'text-[#F08800] font-bold'
              : 'text-gray-600'
          "
          @click="handleSortChange('default')"
          >综合</view
        >
        <view
          class="text-sm"
          :class="
            currentSort === 'sales'
              ? 'text-[#F08800] font-bold'
              : 'text-gray-600'
          "
          @click="handleSortChange('sales')"
          >销量</view
        >
        <view
          class="flex items-center text-sm"
          :class="
            currentSort === 'price'
              ? 'text-[#F08800] font-bold'
              : 'text-gray-600'
          "
          @click="handleSortChange('price')"
        >
          <text>价格</text>
          <view class="flex flex-col ml-1 -space-y-1.5">
            <!-- 上三角 -->
            <uni-icons
              type="top-filled"
              size="10"
              :color="
                currentSort === 'price' && priceOrder === 'asc'
                  ? '#F08800'
                  : '#e5e7eb'
              "
            ></uni-icons>
            <!-- 下三角 -->
            <uni-icons
              type="bottom-filled"
              size="10"
              :color="
                currentSort === 'price' && priceOrder === 'desc'
                  ? '#F08800'
                  : '#e5e7eb'
              "
            ></uni-icons>
          </view>
        </view>
      </view>
    </view>

    <view class="h-[240rpx]"></view>

    <!-- 商品列表 -->
    <view class="p-3">
      <view
        v-if="!isLoading && goodsList.length === 0"
        class="flex flex-col items-center justify-center py-20"
      >
        <text class="text-4xl mb-4">🥬</text>
        <text class="text-gray-400 text-sm">暂无相关商品，换个词试试？</text>
      </view>

      <view class="grid grid-cols-2 gap-3">
        <view
          v-for="(item, index) in goodsList"
          :key="index"
          class="bg-[#E8F5E9] rounded-lg overflow-hidden shadow-sm flex flex-col"
          @click="goToDetail(item.id)"
        >
          <image
            :src="item.image"
            mode="aspectFill"
            class="w-full h-36 bg-gray-200"
          />
          <view class="p-2 flex flex-col flex-1">
            <text
              class="text-sm font-bold text-[#2F5233] leading-snug line-clamp-2 h-10 mb-1"
              >{{ item.name }}</text
            >
            <view class="flex items-center mb-2"
              ><text class="text-xs text-gray-500"
                >已拼{{ item.sales }}件</text
              ></view
            >
            <view class="mt-auto flex justify-between items-center">
              <view class="flex flex-col">
                <view class="flex items-baseline"
                  ><text class="text-xs text-[#F08800] font-bold">￥</text
                  ><text class="text-lg text-[#F08800] font-bold">{{
                    item.price
                  }}</text></view
                >
                <text class="text-[20rpx] text-gray-400 line-through"
                  >￥{{ item.originalPrice }}</text
                >
              </view>
              <view
                class="bg-[#F08800] text-white text-xs px-2 py-1 rounded-full shadow-sm active:opacity-80"
                >去拼团</view
              >
            </view>
          </view>
        </view>
      </view>
      <view v-if="goodsList.length > 0" class="py-4 text-center">
        <text class="text-xs text-gray-400">{{
          isLoading
            ? '加载中...'
            : hasMore
            ? '上拉加载更多'
            : '- 底线也是有底线的 -'
        }}</text>
      </view>
    </view>
  </view>
</template>
