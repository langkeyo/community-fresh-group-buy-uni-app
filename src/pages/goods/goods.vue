<script setup>
import { computed, onMounted, ref } from 'vue'

const goodsList = ref([])

const categories = ['全部', '蔬菜', '水果']
const sortList = ['默认', '价格', '销量']
const activeCategory = ref('全部')
const activeSort = ref('默认')
const keyword = ref('')
const loading = ref(false)

async function fetchGoods() {
  loading.value = true
  // 模拟请求
  await new Promise((resolve) => setTimeout(resolve, 1000))
  goodsList.value = [
    {
      id: 1,
      name: '本地有机番茄 500g',
      category: '蔬菜',
      price: '4.99',
      originalPrice: '8.00',
      sales: 1200
    },
    {
      id: 2,
      name: '进口香蕉 1kg',
      category: '水果',
      price: '9.90',
      originalPrice: '15.00',
      sales: 850
    },
    {
      id: 3,
      name: '本地小黄瓜 500g',
      category: '蔬菜',
      price: '3.20',
      originalPrice: '6.00',
      sales: 560
    }
  ]
  loading.value = false
}

const filteredGoods = computed(() => {
  let list =
    activeCategory.value === '全部'
      ? goodsList.value
      : goodsList.value.filter((item) => item.category === activeCategory.value)

  if (keyword.value.trim()) {
    list = list.filter((item) => item.name.includes(keyword.value.trim()))
  }

  if (activeSort.value === '价格') {
    list = [...list].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
  } else if (activeSort.value === '销量') {
    list = [...list].sort((a, b) => b.sales - a.sales)
  }

  return list
})

function goToGroupBuy(id) {
  uni.navigateTo({ url: `/pages/group-buy/group-buy?id=${id}` })
}

onMounted(() => {
  fetchGoods()
})
</script>

<template>
  <view class="min-h-screen bg-gray-50 px-4 pt-4 space-y-4">
    <!-- 标题 -->
    <text class="text-base font-bold text-fresh">商品列表</text>

    <!-- 搜索框 -->
    <view
      class="flex items-center bg-white rounded-full h-12 px-4 shadow-sm border border-gray-200"
    >
      <input
        type="text"
        v-model="keyword"
        placeholder="搜索商品/关键词..."
        class="flex-1 text-base"
      />
    </view>

    <!-- 分类栏 -->
    <view class="flex gap-2">
      <view
        v-for="item in categories"
        :key="item"
        class="text-sm px-3 py-1.5 rounded-full border"
        :class="
          item === activeCategory
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-gray-600 border-gray-200'
        "
        @click="activeCategory = item"
      >
        {{ item }}
      </view>
    </view>

    <!-- 排序栏 -->
    <view class="flex gap-2">
      <view
        v-for="item in sortList"
        :key="item"
        class="text-sm px-3 py-1.5 rounded-full border"
        :class="
          item === activeSort
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-gray-600 border-gray-200'
        "
        @click="activeSort = item"
        >{{ item }}</view
      >
    </view>

    <!-- 商品卡片列表 -->
    <view class="space-y-3">
      <view
        v-for="item in filteredGoods"
        :key="item.id"
        class="bg-white rounded-lg p-4 shadow-sm flex gap-3"
        @click="goToGroupBuy(item.id)"
      >
        <view class="w-20 h-20 bg-secondary rounded-md"></view>
        <view class="flex-1">
          <text class="block text-base font-bold text-fresh">{{
            item.name
          }}</text>
          <text class="block text-xs text-gray-500 mt-1"
            >已拼{{ item.sales }}件</text
          >
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

      <!-- 加载状态 -->
      <view v-if="loading" class="py-4 text-center">
        <text class="text-xs text-gray-400">加载中...</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!filteredGoods.length" class="py-8 text-center">
        <text class="text-sm text-gray-400">暂无商品，换个关键词试试</text>
      </view>

      <view v-else class="py-4 text-center">
        <text class="text-xs text-gray-400">- 没有更多了 -</text>
      </view>
    </view>
  </view>
</template>
