<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import { computed, onMounted, ref } from 'vue'
import { getProductList } from '@/services/product'
import type { ProductItem } from '@/types/product'

const goodsList = ref<ProductItem[]>([])

const sortList = ['默认', '价格', '库存']
const activeCategory = ref('all')
const activeSort = ref('默认')
const keyword = ref('')
const loading = ref(false)

const CATEGORY_LABEL: Record<string, string> = {
  vegetable: '蔬菜',
  fruit: '水果',
  meat: '肉类',
  seafood: '海鲜'
}

async function fetchGoods() {
  loading.value = true
  try {
    goodsList.value = await getProductList()
  } catch (error: any) {
    uni.showToast({ title: error?.message || '商品加载失败', icon: 'none' })
    goodsList.value = []
  }
  loading.value = false
}

const filteredGoods = computed(() => {
  let list = goodsList.value

  if (activeCategory.value !== 'all') {
    list = list.filter((item) => item.category === activeCategory.value)
  }

  if (keyword.value.trim()) {
    list = list.filter((item) => item.name.includes(keyword.value.trim()))
  }

  if (activeSort.value === '价格') {
    list = [...list].sort((a, b) => a.price - b.price)
  } else if (activeSort.value === '库存') {
    list = [...list].sort((a, b) => b.stock - a.stock)
  }

  return list
})

const viewGoods = computed(() => {
  return filteredGoods.value.map((item) => ({
    ...item,
    categoryLabel: CATEGORY_LABEL[item.category] || item.category || '未分类',
    groupPriceDisplay: (
      item.groupPrice2 ?? item.groupPrice3 ?? item.price
    ).toFixed(2),
    originPriceDisplay: item.price.toFixed(2),
    cover: item.images[0] || ''
  }))
})

function goToGroupBuy(id: string | number) {
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
        placeholder-class="text-gray-400 text-sm"
        class="flex-1 text-sm base-input base-input--search"
      />
    </view>

    <!-- 分类栏 -->
    <view class="flex gap-2">
      <BaseButton
        :type="activeCategory === 'all' ? 'primary' : 'default'"
        text="全部"
        @click="activeCategory = 'all'"
      />
      <BaseButton
        v-for="item in Array.from(new Set(goodsList.map((g) => g.category))).filter(Boolean)"
        :key="item"
        :type="item === activeCategory ? 'primary' : 'default'"
        :text="CATEGORY_LABEL[item] || item"
        @click="activeCategory = item"
      />
    </view>

    <!-- 排序栏 -->
    <view class="flex gap-2">
      <BaseButton
        v-for="item in sortList"
        :key="item"
        :type="item === activeSort ? 'primary' : 'default'"
        :text="item"
        @click="activeSort = item"
      />
    </view>

    <!-- 商品卡片列表 -->
    <view class="space-y-3">
      <BaseCard
        v-for="item in viewGoods"
        :key="item.id"
        @click="goToGroupBuy(item.id)"
      >
        <view class="flex gap-3">
          <image
            v-if="item.cover"
            :src="item.cover"
            mode="aspectFill"
            class="w-20 h-20 bg-secondary rounded-md"
          />
          <view v-else class="w-20 h-20 bg-secondary rounded-md"></view>
          <view class="flex-1">
            <text class="block text-base font-bold text-fresh">{{
              item.name
            }}</text>
            <text class="block text-xs text-gray-500 mt-1"
              >商品编号：{{ item.id }}</text
            >
            <view class="mt-2 flex items-center gap-2">
              <text class="text-xs text-primary">团购价</text>
              <text class="text-base font-bold text-primary">
                ￥{{ item.groupPriceDisplay }}
              </text>
              <text class="text-xs text-gray-400 line-through"
                >￥{{ item.originPriceDisplay }}</text
              >
              <text class="text-xs text-gray-400">库存 {{ item.stock }}</text>
            </view>
          </view>
        </view>
      </BaseCard>

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
