<script setup lang="ts">
import { ref } from 'vue'
import { login, getUserInfo } from '@/api/user' // 引入咱们封装好的接口
import { getLeaderWorkbench } from '@/services/order'
import type { UserInfo } from '@/types/user' // 引入类型定义
import { onShow } from '@dcloudio/uni-app' // 生命周期钩子

// --- 状态定义 ---
const isLogin = ref(false)
const userInfo = ref<UserInfo | null>(null)
const leaderSummaryText = ref('进入工作台查看待核销订单')

// 默认的工具栏数据
const tools = [
  { name: '收货地址', icon: 'location', color: '#F08800', route: '/pages/address/address' },
  { name: '自提网点', icon: 'location', color: '#2F5233', route: '/pages/self-pick/self-pick' },
  { name: '联系客服', icon: 'headphones', color: '#2F5233', route: '/pages/service/service' },
  { name: '常见问题', icon: 'help', color: '#666666', route: '/pages/faq/faq' },
  { name: '关于我们', icon: 'info', color: '#666666', route: '/pages/about/about' }
]

// --- 生命周期 ---
onShow(() => {
  checkLoginStatus()
})

// --- 核心逻辑 ---

// 检查登录状态
const checkLoginStatus = () => {
  const token = uni.getStorageSync('token')
  if (token) {
    isLogin.value = true
    // 尝试从本地获取用户信息缓存，避免每次都闪烁
    const storedUser = uni.getStorageSync('userInfo')
    if (storedUser) {
      // storedUser 可能是 string 也可能是 object，安全解析一下
      userInfo.value =
        typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser
    }
    // 悄悄在后台更新一下最新用户信息
    fetchUserInfo()
    loadLeaderSummary()
  } else {
    isLogin.value = false
    userInfo.value = null
    leaderSummaryText.value = '登录后可查看团长工作台'
  }
}

const handleLogin = () => {
  if (isLogin.value) {
    // 如果已经登录了，点头像可能想看个人详情，或者啥也不做
    return
  }

  // 没登录？走！去登录页！
  uni.navigateTo({
    url: '/pages/login/login'
  })
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await getUserInfo()
    if (res.code === 0 && res.data) {
      updateLocalUser(res.data)
    }
  } catch (e) {
    console.error('更新用户信息失败', e)
  }
}

// 统一更新本地存储和响应式变量
const updateLocalUser = (user: UserInfo) => {
  userInfo.value = user
  uni.setStorageSync('userInfo', user)
  loadLeaderSummary()
}

const loadLeaderSummary = async () => {
  if (!isLogin.value || !userInfo.value?.isLeader || !userInfo.value?.id) {
    leaderSummaryText.value = '进入工作台查看待核销订单'
    return
  }

  const pickPointId = Number(uni.getStorageSync('default_pick_point_id'))
  if (!pickPointId) {
    leaderSummaryText.value = '请先选择默认自提点'
    return
  }

  try {
    const data = await getLeaderWorkbench(userInfo.value.id, pickPointId)
    leaderSummaryText.value = `今日核销 ${data.pickedTodayCount} | 待核销 ${data.pendingCount}`
  } catch (error: any) {
    leaderSummaryText.value = '工作台数据加载失败，点击重试'
  }
}

// --- 页面跳转逻辑 ---

const goToLeader = () => {
  uni.navigateTo({ url: '/pages/leader/leader' })
}

const applyLeader = () => {
  // 暂时模拟申请
  uni.showModal({
    title: '申请团长',
    content: '确定要申请成为团长吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '申请已提交', icon: 'success' })
      }
    }
  })
}

const handleSetting = () => {
  if (!isLogin.value) return uni.showToast({ title: '请先登录', icon: 'none' })
  // 这里可以跳转到设置页，或者退出登录
  uni.showActionSheet({
    itemList: ['退出登录'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.removeStorageSync('token')
        uni.removeStorageSync('userInfo')
        checkLoginStatus()
        uni.showToast({ title: '已退出', icon: 'none' })
      }
    }
  })
}

const handleToolClick = (route: string) => {
  uni.navigateTo({ url: route })
}
</script>

<template>
  <view class="min-h-screen bg-[#F8F8F8]">
    <!-- 1. 头部背景 -->
    <view class="bg-[#F08800] px-6 pt-12 pb-16 rounded-b-[40rpx] relative">
      <!-- 顶部设置图标 -->
      <view class="absolute top-12 right-6" @click="handleSetting">
        <uni-icons type="gear-filled" size="24" color="#ffffff"></uni-icons>
      </view>

      <!-- 登录/用户信息区域 -->
      <view class="flex items-center" @click="handleLogin">
        <!-- 头像：已登录显示头像，未登录显示默认 -->
        <image
          :src="userInfo?.avatar || '/static/logo.webp'"
          mode="aspectFill"
          class="w-16 h-16 rounded-full border-2 border-white bg-white mr-4"
        />

        <view class="flex flex-col text-white">
          <!-- 昵称 -->
          <text class="text-xl font-bold mb-1">
            {{ isLogin ? userInfo?.nickname || '社区老铁' : '点击登录 / 注册' }}
          </text>

          <!-- 会员标签 -->
          <view
            class="flex items-center bg-black/10 px-2 py-0.5 rounded-full self-start"
          >
            <uni-icons
              type="vip"
              size="14"
              color="#FFD700"
              class="mr-1"
            ></uni-icons>
            <text class="text-xs opacity-90">
              {{
                isLogin
                  ? userInfo?.isLeader
                    ? '🏅 金牌团长'
                    : '🥬 普通会员'
                  : '登录立享优惠'
              }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 2. 资产卡片 (注意：目前后端还没返回余额和积分，先做兜底显示) -->
    <view
      class="mx-4 -mt-10 bg-white rounded-xl shadow-sm p-4 flex justify-around mb-4 relative z-10"
    >
      <view class="flex flex-col items-center">
        <text class="text-lg font-bold text-[#2F5233]">
          {{ '0.00' }}
          <!-- {{ userInfo?.balance || '0.00' }} 等后端加了字段用这个 -->
        </text>
        <text class="text-xs text-gray-500">余额</text>
      </view>
      <view class="w-[1px] bg-gray-100 h-8"></view>
      <view class="flex flex-col items-center">
        <text class="text-lg font-bold text-[#2F5233]">
          {{ 0 }}
          <!-- {{ userInfo?.coupons || 0 }} -->
        </text>
        <text class="text-xs text-gray-500">优惠券</text>
      </view>
      <view class="w-[1px] bg-gray-100 h-8"></view>
      <view class="flex flex-col items-center">
        <text class="text-lg font-bold text-[#2F5233]">0</text>
        <text class="text-xs text-gray-500">积分</text>
      </view>
    </view>

    <!-- 3. 团长入口 (根据 isLeader 状态动态显示) -->
    <view class="mx-4 mb-4">
      <!-- 已经是团长 -->
      <view
        v-if="isLogin && userInfo?.isLeader"
        class="bg-gradient-to-r from-[#2F5233] to-[#4a7c50] rounded-xl p-4 flex justify-between items-center text-white shadow-lg active:opacity-90 transition-opacity"
        @click="goToLeader"
      >
        <view class="flex items-center">
          <view
            class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3"
          >
            <uni-icons type="shop" size="24" color="#ffffff"></uni-icons>
          </view>
          <view>
            <text class="font-bold text-lg block">团长工作台</text>
            <text class="text-xs opacity-80">{{ leaderSummaryText }}</text>
          </view>
        </view>
        <uni-icons type="right" size="16" color="#ffffff"></uni-icons>
      </view>

      <!-- 不是团长 / 未登录 -->
      <view
        v-else
        class="bg-[#E8F5E9] rounded-xl p-4 flex justify-between items-center active:bg-[#dceddd] transition-colors"
        @click="applyLeader"
      >
        <view class="flex items-center">
          <uni-icons
            type="staff-filled"
            size="28"
            color="#2F5233"
            class="mr-3"
          ></uni-icons>
          <view>
            <text class="font-bold text-[#2F5233] text-lg block"
              >招募社区团长</text
            >
            <text class="text-xs text-gray-500">0元入驻，月赚3000+</text>
          </view>
        </view>
        <view
          class="bg-[#2F5233] text-white px-3 py-1.5 rounded-full text-xs flex items-center"
        >
          立即申请
          <uni-icons
            type="arrowright"
            size="12"
            color="#ffffff"
            class="ml-1"
          ></uni-icons>
        </view>
      </view>
    </view>

    <!-- 4. 常用功能列表 -->
    <view class="bg-white mx-4 rounded-xl shadow-sm overflow-hidden">
      <view
        v-for="(item, index) in tools"
        :key="index"
        class="flex items-center justify-between p-5 border-b border-gray-50 active:bg-gray-50"
        @click="handleToolClick(item.route)"
      >
        <view class="flex items-center">
          <view class="mr-3 w-6 flex justify-center">
            <uni-icons
              :type="item.icon"
              size="24"
              :color="item.color"
            ></uni-icons>
          </view>
          <text class="text-base text-[#2F5233]">{{ item.name }}</text>
        </view>
        <uni-icons type="right" size="16" color="#cccccc"></uni-icons>
      </view>
    </view>

    <!-- 底部版本号 -->
    <view class="py-8 text-center flex flex-col items-center">
      <uni-icons
        type="cloud-download"
        size="20"
        color="#e5e7eb"
        class="mb-1"
      ></uni-icons>
      <text class="text-[24rpx] text-gray-300"
        >Ligo生鲜 V1.0.0 Built by UniApp</text
      >
    </view>
  </view>
</template>

<style>
/* 样式保持不变 */
</style>
