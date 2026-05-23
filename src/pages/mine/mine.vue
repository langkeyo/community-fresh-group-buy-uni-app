<script setup lang="ts">
import { ref } from 'vue'
import BaseSmartImage from '@/components/base/BaseSmartImage.vue'
import { getUserInfo } from '@/api/user' // 引入咱们封装好的接口
import { getLeaderWorkbench } from '@/services/order'
import { useUserStore } from '@/stores/user'
import type { UserInfo } from '@/types/user' // 引入类型定义
import { DEFAULT_AVATAR_PATH } from '@/constants/ui'
import { resolveAvatarUrl } from '@/utils/avatar'
import { onShow } from '@dcloudio/uni-app' // 生命周期钩子

// --- 状态定义 ---
const isLogin = ref(false)
const userInfo = ref<UserInfo | null>(null)
const leaderSummaryText = ref('进入工作台查看待核销订单')
const userStore = useUserStore()
const LEADER_APPLY_KEY = 'leader_apply_draft'
const hasPendingLeaderApply = ref(false)

// 默认的工具栏数据
const tools = [
  { name: '通知中心', icon: 'notification', color: '#F08800', route: '/pages/notice/notice' },
  { name: '设置', icon: 'gear', color: '#2F5233', route: '/pages/settings/settings' },
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
      const parsedUser =
        typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser
      if (parsedUser && typeof parsedUser === 'object') {
        parsedUser.avatar = resolveAvatarUrl(parsedUser.avatar)
      }
      userInfo.value = parsedUser
    }
    // 悄悄在后台更新一下最新用户信息
    fetchUserInfo()
    loadLeaderSummary()
    refreshLeaderApplyStatus()
  } else {
    isLogin.value = false
    userInfo.value = null
    leaderSummaryText.value = '登录后可查看团长工作台'
    hasPendingLeaderApply.value = false
  }
}

const refreshLeaderApplyStatus = () => {
  const raw = uni.getStorageSync(LEADER_APPLY_KEY)
  hasPendingLeaderApply.value = Boolean(raw && typeof raw === 'object' && raw.submitAt)
}

const handleLogin = () => {
  if (isLogin.value) {
    uni.navigateTo({ url: '/pages/account-security/account-security' })
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
    if ((res.code === 0 || res.code === 200) && res.data) {
      updateLocalUser(res.data)
    }
  } catch (e) {
    console.error('更新用户信息失败', e)
  }
}

// 统一更新本地存储和响应式变量
const updateLocalUser = (user: UserInfo) => {
  user.avatar = resolveAvatarUrl(user.avatar)
  userInfo.value = user
  uni.setStorageSync('userInfo', user)
  userStore.setUserId(Number(user.id))
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
  if (hasPendingLeaderApply.value) {
    uni.showToast({ title: '已提交申请，请等待管理员审核', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/pages/leader/apply' })
}

const quickScan = () => {
  if (!isLogin.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  uni.scanCode({
    success: (res) => {
      handleScanResult(String(res.result || '').trim())
    }
  })
}

const handleScanResult = (raw: string) => {
  if (!raw) {
    uni.showToast({ title: '扫码内容为空', icon: 'none' })
    return
  }

  const productMatch = raw.match(/(?:product[:=])(\d+)/i)
  if (productMatch?.[1]) {
    uni.navigateTo({ url: `/pages/goods/detail?id=${Number(productMatch[1])}` })
    return
  }

  const orderMatch = raw.match(/(?:order[:=])(\d+)/i)
  if (orderMatch?.[1]) {
    uni.navigateTo({ url: `/pages/order/detail?id=${Number(orderMatch[1])}` })
    return
  }

  const groupMatch = raw.match(/(?:group[:=]|joinGroupId=)(\d+)/i)
  if (groupMatch?.[1]) {
    uni.navigateTo({ url: `/pages/group-buy/group-buy?joinGroupId=${Number(groupMatch[1])}` })
    return
  }

  if (raw.includes('/pages/goods/detail')) {
    uni.navigateTo({ url: raw.replace(/^https?:\/\/[^/]+/i, '') })
    return
  }
  if (raw.includes('/pages/order/detail')) {
    uni.navigateTo({ url: raw.replace(/^https?:\/\/[^/]+/i, '') })
    return
  }
  if (raw.includes('/pages/group-buy/group-buy')) {
    uni.navigateTo({ url: raw.replace(/^https?:\/\/[^/]+/i, '') })
    return
  }

  uni.showModal({
    title: '扫码结果',
    content: raw.slice(0, 120),
    confirmText: '复制',
    success: (r) => {
      if (!r.confirm) return
      uni.setClipboardData({
        data: raw,
        success: () => uni.showToast({ title: '已复制', icon: 'success' })
      })
    }
  })
}

const handleSetting = () => {
  if (!isLogin.value) return uni.showToast({ title: '请先登录', icon: 'none' })
  uni.navigateTo({ url: '/pages/settings/settings' })
}

const handleToolClick = (route: string) => {
  const loginRequiredRoutes = [
    '/pages/notice/notice',
    '/pages/settings/settings',
    '/pages/address/address'
  ]
  if (loginRequiredRoutes.includes(route) && !isLogin.value) {
    uni.showModal({
      title: '请先登录',
      content: '该功能需要登录后使用，是否前往登录页？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/login/login' })
        }
      }
    })
    return
  }
  uni.navigateTo({ url: route })
}
</script>

<template>
  <view class="min-h-screen bg-[#F8F8F8]">
    <!-- 1. 头部背景 -->
    <view class="bg-[#F08800] px-6 pt-12 pb-16 rounded-b-[40rpx] relative">
      <!-- 顶部设置图标 -->
      <view class="absolute top-12 right-24" @click="quickScan">
        <uni-icons type="scan" size="24" color="#ffffff"></uni-icons>
      </view>
      <view class="absolute top-12 right-6" @click="handleSetting">
        <uni-icons type="gear-filled" size="24" color="#ffffff"></uni-icons>
      </view>

      <!-- 登录/用户信息区域 -->
      <view class="flex items-center" @click="handleLogin">
        <!-- 头像：已登录显示头像，未登录显示默认 -->
        <BaseSmartImage
          :src="userInfo?.avatar || DEFAULT_AVATAR_PATH"
          class-name="w-16 h-16 rounded-full border-2 border-white bg-white mr-4 overflow-hidden"
          fallback-bg="#ffffff"
          fallback-color="#2f5233"
          fallback-text="头像"
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

    <!-- 2. 团长入口 (根据 isLeader 状态动态显示) -->
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

      <!-- 未登录 -->
      <view
        v-else-if="!isLogin"
        class="bg-[#FFF7E6] rounded-xl p-4 flex justify-between items-center active:bg-[#ffefcc] transition-colors"
        @click="handleLogin"
      >
        <view class="flex items-center">
          <uni-icons
            type="person-filled"
            size="28"
            color="#F08800"
            class="mr-3"
          ></uni-icons>
          <view>
            <text class="font-bold text-[#8a5a00] text-lg block">登录后可申请团长</text>
            <text class="text-xs text-gray-500">请先完成账号登录</text>
          </view>
        </view>
        <view
          class="bg-[#F08800] text-white px-3 py-1.5 rounded-full text-xs flex items-center"
        >
          去登录
          <uni-icons
            type="arrowright"
            size="12"
            color="#ffffff"
            class="ml-1"
          ></uni-icons>
        </view>
      </view>

      <!-- 已登录但不是团长 -->
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
              >{{ hasPendingLeaderApply ? '团长申请审核中' : '申请团长权限' }}</text
            >
            <text class="text-xs text-gray-500">{{
              hasPendingLeaderApply ? '请耐心等待审核结果' : '管理员审核后开通'
            }}</text>
          </view>
        </view>
        <view
          class="bg-[#2F5233] text-white px-3 py-1.5 rounded-full text-xs flex items-center"
          :class="{ 'opacity-70': hasPendingLeaderApply }"
        >
          {{ hasPendingLeaderApply ? '审核中' : '去申请' }}
          <uni-icons
            type="arrowright"
            size="12"
            color="#ffffff"
            class="ml-1"
          ></uni-icons>
        </view>
      </view>
    </view>

    <!-- 3. 常用功能列表 -->
    <view class="panel-card mx-4 overflow-hidden">
      <view
        v-for="(item, index) in tools"
        :key="index"
        class="tool-row"
        @click="handleToolClick(item.route)"
      >
        <view class="tool-left">
          <view class="tool-icon-wrap">
            <uni-icons
              :type="item.icon"
              size="24"
              :color="item.color"
            ></uni-icons>
          </view>
          <text class="tool-name">{{ item.name }}</text>
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
.panel-card {
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 20rpx rgba(15, 23, 42, 0.05);
}

.tool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 20rpx;
  border-bottom: 1rpx solid #f1f5f9;
}

.tool-row:active {
  background: #f8fafc;
}

.tool-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.tool-icon-wrap {
  width: 42rpx;
  display: flex;
  justify-content: center;
}

.tool-name {
  font-size: 30rpx;
  color: #2f5233;
}
</style>
