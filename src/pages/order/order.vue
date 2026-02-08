<script setup lang="ts">
import { ref, computed } from 'vue'

// --- 类型定义 ---
type OrderStatus = 'pending' | 'success' | 'picked' | 'cancelled'

interface Order {
  id: string
  goodsName: string
  image: string
  price: string
  count: number
  status: OrderStatus
  statusText: string
  pickPoint: string
  time: string
}

// --- 响应式数据 ---
const currentTab = ref(0)
const tabs = ['全部', '待成团', '待提货', '已完成']

// 模拟订单数据
const orderList = ref<Order[]>([
  {
    id: 'ORD2023110101',
    goodsName: '海南树上熟贵妃芒 5斤装',
    image: 'https://loremflickr.com/200/200/fruit,mango?lock=50',
    price: '19.90',
    count: 1,
    status: 'pending',
    statusText: '待成团',
    pickPoint: '阳光花园一期A站',
    time: '2023-11-01 14:20'
  },
  {
    id: 'ORD2023102502',
    goodsName: '农家土鸡蛋 30枚 礼盒装',
    image: 'https://loremflickr.com/200/200/egg?lock=51',
    price: '25.80',
    count: 2,
    status: 'success',
    statusText: '待提货',
    pickPoint: '阳光花园一期A站',
    time: '2023-10-25 09:15'
  },
  {
    id: 'ORD2023101005',
    goodsName: '深海冷冻大虾 1kg',
    image: 'https://loremflickr.com/200/200/shrimp?lock=52',
    price: '45.00',
    count: 1,
    status: 'picked',
    statusText: '已提货',
    pickPoint: '滨江壹号菜鸟驿站',
    time: '2023-10-10 18:30'
  }
])

// --- 计算属性 ---
const filteredList = computed(() => {
  if (currentTab.value === 0) return orderList.value
  if (currentTab.value === 1)
    return orderList.value.filter((o) => o.status === 'pending')
  if (currentTab.value === 2)
    return orderList.value.filter((o) => o.status === 'success')
  if (currentTab.value === 3)
    return orderList.value.filter((o) => o.status === 'picked')
  return []
})

// --- 方法 ---
const handleTabClick = (index: number) => {
  currentTab.value = index
}

// 模拟确认提货
const confirmPick = (order: Order) => {
  uni.showModal({
    title: '确认提货',
    content: '请确认您已在自提点拿到商品',
    success: (res) => {
      if (res.confirm) {
        order.status = 'picked'
        order.statusText = '已提货'
        uni.showToast({ title: '提货成功', icon: 'success' })
      }
    }
  })
}
</script>

<template>
  <view class="min-h-screen bg-[#F8F8F8] pb-4">
    <!-- Tab 导航 -->
    <view class="flex bg-white sticky top-0 z-10 border-b border-gray-100">
      <view
        v-for="(tab, index) in tabs"
        :key="index"
        class="flex-1 py-3 text-center text-sm relative"
        @click="handleTabClick(index)"
      >
        <text
          :class="
            currentTab === index ? 'text-[#F08800] font-bold' : 'text-gray-600'
          "
          >{{ tab }}</text
        >
        <view
          v-if="currentTab === index"
          class="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#F08800]"
        ></view>
      </view>
    </view>

    <!-- 列表 -->
    <view class="p-3">
      <view
        v-for="item in filteredList"
        :key="item.id"
        class="bg-white rounded-lg p-3 mb-3 shadow-sm"
      >
        <!-- 头部：单号与状态 -->
        <view
          class="flex justify-between items-center mb-3 pb-2 border-b border-gray-50"
        >
          <text class="text-xs text-gray-500">订单号: {{ item.id }}</text>
          <text
            class="text-xs font-bold"
            :class="{
              'text-[#F08800]': item.status === 'pending',
              'text-[#2F5233]': item.status === 'success',
              'text-gray-400': item.status === 'picked'
            }"
            >{{ item.statusText }}</text
          >
        </view>

        <!-- 内容 -->
        <view class="flex">
          <image
            :src="item.image"
            mode="aspectFill"
            class="w-20 h-20 rounded bg-gray-200 mr-3 flex-shrink-0"
          />
          <view class="flex-1 flex flex-col justify-between py-1">
            <text class="text-sm text-[#2F5233] font-bold line-clamp-2">{{
              item.goodsName
            }}</text>
            <view class="flex justify-between items-center mt-2">
              <text class="text-xs text-gray-500">数量 x{{ item.count }}</text>
              <text class="text-base text-[#2F5233] font-bold"
                >￥{{ item.price }}</text
              >
            </view>
          </view>
        </view>

        <!-- 底部：自提点与操作 -->
        <view
          class="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center"
        >
          <view class="flex items-center text-xs text-gray-500">
            <text class="mr-1">📍</text>
            <text>{{ item.pickPoint }}</text>
          </view>

          <button
            v-if="item.status === 'success'"
            class="bg-[#F08800] text-white text-xs px-4 py-1.5 rounded-full m-0 leading-none active:opacity-80"
            @click="confirmPick(item)"
          >
            确认提货
          </button>
          <button
            v-else-if="item.status === 'pending'"
            class="bg-white border border-gray-200 text-gray-500 text-xs px-3 py-1.5 rounded-full m-0 leading-none"
            open-type="share"
          >
            邀请好友
          </button>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="filteredList.length === 0" class="py-10 text-center">
        <text class="text-gray-400 text-sm">暂无相关订单</text>
      </view>
    </view>
  </view>
</template>
