<script setup lang="ts">
import { ref } from 'vue'

// --- 模拟数据 ---
const stats = ref({
  commission: '1,280.50',
  todayIncome: '45.00',
  members: 126,
  orders: 8
})

const pendingAuditList = ref([
  {
    id: 101,
    user: '陈阿姨',
    goods: '红富士苹果 5斤',
    time: '10:30',
    status: 'pending'
  },
  {
    id: 102,
    user: '张建国',
    goods: '大白菜 2颗',
    time: '11:15',
    status: 'pending'
  }
])

// --- 方法 ---
const handleAudit = (id: number) => {
  uni.showToast({ title: '核销成功', icon: 'success' })
  // 移除该项
  pendingAuditList.value = pendingAuditList.value.filter(
    (item) => item.id !== id
  )
}
</script>

<template>
  <view class="min-h-screen bg-[#F8F8F8]">
    <!-- 头部卡片 -->
    <view class="bg-[#F08800] px-4 pt-4 pb-12 rounded-b-[40rpx]">
      <view class="flex items-center mb-6">
        <image
          src="https://placehold.co/100x100/FFFFFF/F08800?text=Avatar"
          class="w-12 h-12 rounded-full border-2 border-white mr-3"
        />
        <view>
          <text class="text-white font-bold text-lg block">王阿姨（团长）</text>
          <text class="text-white/80 text-xs">阳光花园一期自提点</text>
        </view>
      </view>

      <view class="flex justify-between text-white">
        <view class="flex flex-col">
          <text class="text-3xl font-bold">{{ stats.commission }}</text>
          <text class="text-xs opacity-80">累计佣金(元)</text>
        </view>
        <view class="flex flex-col items-end">
          <text class="text-xl font-bold">{{ stats.todayIncome }}</text>
          <text class="text-xs opacity-80">今日预估(元)</text>
        </view>
      </view>
    </view>

    <!-- 数据概览 -->
    <view
      class="mx-4 -mt-8 bg-white rounded-xl shadow-sm p-4 flex justify-around mb-4"
    >
      <view class="flex flex-col items-center">
        <text class="text-lg font-bold text-[#2F5233]">{{
          stats.members
        }}</text>
        <text class="text-xs text-gray-500">我的团员</text>
      </view>
      <view class="w-[1px] bg-gray-100 h-8"></view>
      <view class="flex flex-col items-center">
        <text class="text-lg font-bold text-[#2F5233]">{{ stats.orders }}</text>
        <text class="text-xs text-gray-500">今日订单</text>
      </view>
      <view class="w-[1px] bg-gray-100 h-8"></view>
      <view class="flex flex-col items-center">
        <text class="text-lg font-bold text-[#2F5233]">98%</text>
        <text class="text-xs text-gray-500">好评率</text>
      </view>
    </view>

    <!-- 待核销订单 -->
    <view class="px-4">
      <view
        class="text-base font-bold text-[#2F5233] mb-3 border-l-4 border-[#F08800] pl-2"
        >待核销订单</view
      >

      <view
        v-for="item in pendingAuditList"
        :key="item.id"
        class="bg-white p-3 rounded-lg mb-2 shadow-sm flex items-center justify-between"
      >
        <view>
          <view class="text-sm font-bold text-gray-800">{{ item.user }}</view>
          <text class="text-xs text-gray-500">{{ item.goods }}</text>
          <text class="text-xs text-gray-400 ml-2">{{ item.time }}</text>
        </view>
        <button
          class="bg-[#E8F5E9] text-[#2F5233] text-xs px-3 py-1 rounded-full border border-[#2F5233]/20 m-0"
          @click="handleAudit(item.id)"
        >
          确认提货
        </button>
      </view>

      <view
        v-if="pendingAuditList.length === 0"
        class="text-center py-6 text-gray-400 text-xs"
      >
        今日订单已全部核销完成
      </view>
    </view>
  </view>
</template>
