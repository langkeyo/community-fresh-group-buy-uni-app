<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'

// --- 类型定义 ---
interface Banner {
  id: number
  image: string
  link: string
}
interface Leader {
  id: number
  name: string
  avatar: string
  community: string
  heat: number
  members: number
}
interface Product {
  id: number
  name: string
  image: string
  price: string
  originalPrice: string
  people: number
  sales: number
}

// --- 数据 Mock ---
const bannerList = ref<Banner[]>([
  {
    id: 1,
    image: 'https://loremflickr.com/750/300/supermarket,vegetables?lock=10',
    link: '/pages/goods/goods?cate=vegetable'
  },
  {
    id: 2,
    image: 'https://loremflickr.com/750/300/fruit,market?lock=11',
    link: '/pages/goods/goods?cate=fruit'
  },
  {
    id: 3,
    image: 'https://loremflickr.com/750/300/meat,fresh?lock=12',
    link: '/pages/goods/goods?cate=meat'
  }
])

// ⚠️ 注意：这里图标改用了 uni-icons 的 type 名称，背景色保留
const categoryList = [
  {
    name: '新鲜蔬菜',
    value: 'vegetable',
    icon: 'cart-filled',
    color: '#2F5233',
    bgColor: 'bg-green-100'
  },
  {
    name: '时令水果',
    value: 'fruit',
    icon: 'gift-filled',
    color: '#d32f2f',
    bgColor: 'bg-red-100'
  },
  {
    name: '肉禽蛋品',
    value: 'meat',
    icon: 'fire-filled',
    color: '#e65100',
    bgColor: 'bg-orange-100'
  },
  {
    name: '海鲜水产',
    value: 'seafood',
    icon: 'flag-filled',
    color: '#1565c0',
    bgColor: 'bg-blue-100'
  }
]

const leaderList = ref<Leader[]>([
  {
    id: 101,
    name: '王阿姨',
    avatar: 'https://placehold.co/100x100/FF5722/FFFFFF?text=王',
    community: '阳光花园一期',
    heat: 98,
    members: 245
  },
  {
    id: 102,
    name: '李大哥',
    avatar: 'https://placehold.co/100x100/2196F3/FFFFFF?text=李',
    community: '幸福里小区',
    heat: 85,
    members: 120
  },
  {
    id: 103,
    name: '张小姐',
    avatar: 'https://placehold.co/100x100/9C27B0/FFFFFF?text=张',
    community: '滨江壹号',
    heat: 76,
    members: 89
  }
])

const hotProductList = ref<Product[]>([
  {
    id: 1,
    name: '本地有机红番茄 500g 自然熟',
    image: 'https://loremflickr.com/300/300/tomato?lock=20',
    price: '4.99',
    originalPrice: '8.00',
    people: 3,
    sales: 1200
  },
  {
    id: 2,
    name: '进口香蕉 1kg 软糯香甜',
    image: 'https://loremflickr.com/300/300/banana?lock=21',
    price: '9.90',
    originalPrice: '15.00',
    people: 2,
    sales: 850
  },
  {
    id: 3,
    name: '鲜活大明虾 400g 极速冷冻',
    image: 'https://loremflickr.com/300/300/shrimp?lock=22',
    price: '28.80',
    originalPrice: '45.00',
    people: 5,
    sales: 300
  },
  {
    id: 4,
    name: '农家土鸡蛋 10枚装 破损包赔',
    image: 'https://loremflickr.com/300/300/eggs?lock=23',
    price: '12.50',
    originalPrice: '18.00',
    people: 2,
    sales: 2100
  }
])

const hasMore = ref(false)

// --- 逻辑方法 ---
onLoad(() => console.log('首页加载完成'))
onPullDownRefresh(() => {
  setTimeout(() => {
    uni.stopPullDownRefresh()
    uni.showToast({ title: '刷新成功', icon: 'none' })
  }, 1000)
})

const handleBannerClick = (item: Banner) => {
  uni.setStorageSync('temp_category', 'all')
  uni.switchTab({ url: '/pages/goods/goods' })
}
const goToSearch = () => {
  uni.switchTab({ url: '/pages/goods/goods' })
}
const goToCategory = (category: string) => {
  uni.setStorageSync('temp_category', category)
  uni.switchTab({ url: '/pages/goods/goods' })
}
const goToAiFood = () => {
  uni.navigateTo({ url: '/pages/ai-food/ai-food' })
}
const goToGroupBuy = (id: number) => {
  uni.navigateTo({ url: `/pages/group-buy/group-buy?id=${id}` })
}
</script>

<template>
  <view class="min-h-screen bg-[#F8F8F8] pb-4">
    <!-- 1. 顶部自定义导航 -->
    <view class="bg-[#F08800] px-4 pb-4 pt-2">
      <!-- 搜索框 (uni-icons 版本) -->
      <view
        class="flex items-center bg-white rounded-full h-10 px-4 active:opacity-90 transition-opacity"
        @click="goToSearch"
      >
        <uni-icons
          type="search"
          size="18"
          color="#9ca3af"
          class="mr-2"
        ></uni-icons>
        <text class="text-gray-400 text-sm">搜索今日特价生鲜...</text>
      </view>
    </view>

    <!-- 2. 轮播图 -->
    <swiper
      class="h-40 w-full bg-white"
      circular
      autoplay
      :interval="4000"
      indicator-dots
      indicator-active-color="#F08800"
    >
      <swiper-item
        v-for="(item, index) in bannerList"
        :key="index"
        @click="handleBannerClick(item)"
      >
        <image :src="item.image" mode="aspectFill" class="w-full h-full" />
      </swiper-item>
    </swiper>

    <!-- 3. 分类入口 (uni-icons 版本) -->
    <view class="bg-white py-4 mb-2 flex flex-wrap shadow-sm">
      <view
        v-for="(cate, index) in categoryList"
        :key="index"
        class="w-1/4 flex flex-col items-center justify-center mb-2"
        @click="goToCategory(cate.value)"
      >
        <!-- 这里的图标容器 -->
        <view
          class="w-12 h-12 rounded-full mb-1 flex items-center justify-center"
          :class="cate.bgColor"
        >
          <uni-icons
            :type="cate.icon"
            size="26"
            :color="cate.color"
          ></uni-icons>
        </view>
        <text class="text-xs text-[#2F5233]">{{ cate.name }}</text>
      </view>
    </view>

    <!-- 4. AI食材助手入口 -->
    <view
      class="mx-3 mb-3 bg-gradient-to-r from-[#E8F5E9] to-[#ffffff] p-3 rounded-lg flex justify-between items-center shadow-sm border border-[#2F5233]/10 active:scale-[0.99] transition-transform"
      @click="goToAiFood"
    >
      <view class="flex items-center">
        <!-- 换个好看的AI图标 -->
        <view
          class="mr-3 bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
        >
          <uni-icons
            type="chatboxes-filled"
            size="24"
            color="#F08800"
          ></uni-icons>
        </view>
        <view>
          <view class="text-[#2F5233] font-bold text-sm">AI食材搭配助手</view>
          <text class="text-xs text-gray-500 mt-0.5">不知道吃什么？问问AI</text>
        </view>
      </view>
      <view
        class="bg-[#F08800] text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center"
      >
        立即体验
        <uni-icons
          type="arrowright"
          size="12"
          color="#fff"
          class="ml-1"
        ></uni-icons>
      </view>
    </view>

    <!-- 5. 今日推荐团长 -->
    <view class="bg-white mx-3 mb-3 p-3 rounded-lg shadow-sm">
      <view class="flex justify-between items-center mb-3">
        <text
          class="text-base font-bold text-[#2F5233] border-l-4 border-[#F08800] pl-2"
          >今日明星团长</text
        >
        <view class="flex items-center text-xs text-gray-400">
          查看更多
          <uni-icons type="right" size="12" color="#9ca3af"></uni-icons>
        </view>
      </view>
      <scroll-view scroll-x class="whitespace-nowrap w-full">
        <view
          v-for="(leader, index) in leaderList"
          :key="index"
          class="inline-block w-64 mr-3 bg-[#E8F5E9] p-3 rounded-lg align-top"
        >
          <view class="flex items-center mb-2">
            <image
              :src="leader.avatar"
              class="w-10 h-10 rounded-full border-2 border-white mr-2 bg-gray-200"
            />
            <view>
              <text class="block text-sm font-bold text-[#2F5233]">{{
                leader.name
              }}</text>
              <text class="block text-xs text-gray-500 truncate w-32">{{
                leader.community
              }}</text>
            </view>
          </view>
          <view
            class="flex justify-between items-center bg-white/60 rounded px-2 py-1"
          >
            <view class="flex items-center">
              <uni-icons
                type="fire-filled"
                size="12"
                color="#F08800"
                class="mr-1"
              ></uni-icons>
              <text class="text-xs text-[#F08800]">{{ leader.heat }}</text>
            </view>
            <text class="text-xs text-gray-600"
              >{{ leader.members }}人跟团</text
            >
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 6. 热门拼团商品 -->
    <view class="px-3">
      <view class="flex items-center mb-3">
        <text
          class="text-base font-bold text-[#2F5233] border-l-4 border-[#F08800] pl-2"
          >限时火热拼团</text
        >
        <view
          class="ml-auto flex items-center bg-[#F08800]/10 px-2 py-0.5 rounded text-xs text-[#F08800]"
        >
          <uni-icons
            type="loop"
            size="12"
            color="#F08800"
            class="mr-1"
          ></uni-icons>
          <text class="mr-1">距结束</text>
          <text class="font-mono font-bold">08:12:45</text>
        </view>
      </view>

      <view class="grid grid-cols-2 gap-3">
        <view
          v-for="(goods, index) in hotProductList"
          :key="index"
          class="bg-white rounded-lg overflow-hidden shadow-sm flex flex-col"
          @click="goToGroupBuy(goods.id)"
        >
          <image
            :src="goods.image"
            mode="aspectFill"
            class="w-full h-32 bg-gray-100"
          />
          <view class="p-2 flex flex-col flex-1">
            <text
              class="text-sm text-[#2F5233] font-bold line-clamp-2 mb-1 min-h-[40rpx]"
              >{{ goods.name }}</text
            >
            <view class="flex flex-wrap gap-1 mb-2">
              <text
                class="text-[20rpx] text-[#F08800] border border-[#F08800] px-1 rounded"
                >{{ goods.people }}人团</text
              >
              <text class="text-[20rpx] text-gray-500 bg-gray-100 px-1 rounded"
                >已拼{{ goods.sales }}件</text
              >
            </view>
            <view class="mt-auto flex justify-between items-end">
              <view>
                <text class="text-xs text-[#F08800]">￥</text>
                <text class="text-lg font-bold text-[#F08800]">{{
                  goods.price
                }}</text>
                <text class="text-xs text-gray-400 line-through ml-1"
                  >￥{{ goods.originalPrice }}</text
                >
              </view>
              <view
                class="bg-[#F08800] w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              >
                <uni-icons type="plusempty" size="16" color="#fff"></uni-icons>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="py-4 text-center">
        <text class="text-xs text-gray-400">{{
          hasMore ? '加载中...' : '- 到底了，去看看别的吧 -'
        }}</text>
      </view>
    </view>
  </view>
</template>
