<script setup lang="ts">
import { getUserInfo } from '@/api/user'
import { DEFAULT_AVATAR_PATH } from '@/constants/ui'
import { getNoticeList } from '@/services/notice'
import { getSystemConfig } from '@/services/system-config'
import { useUserStore } from '@/stores/user'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'

const nickname = ref('未登录用户')
const avatar = ref('')
const unreadCount = ref(0)
const servicePhone = ref('400-800-1234')
const serviceWechat = ref('ligo-service')
const loading = ref(false)
const avatarLoadFailed = ref(false)
const userStore = useUserStore()
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080'

function toAbsoluteUrl(url: string): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('wxfile://')) return url
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`
  return `${API_BASE_URL}/${url}`
}

function isLikelyInvalidMiniProgramUrl(url: string): boolean {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)/i.test(url)
}

function getUserId(): number {
  const stored = uni.getStorageSync('userInfo')
  const info = stored ? (typeof stored === 'string' ? JSON.parse(stored) : stored) : null
  const id = Number(info?.id || 0)
  return Number.isFinite(id) && id > 0 ? id : 0
}

function ensureLogin(actionText = '操作'): boolean {
  const token = uni.getStorageSync('token')
  if (token) return true
  uni.showModal({
    title: '请先登录',
    content: `${actionText}需要登录后进行，是否前往登录页？`,
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({ url: '/pages/login/login' })
      }
    }
  })
  return false
}

async function loadData() {
  if (!ensureLogin('查看设置')) return
  loading.value = true
  try {
    const cached = uni.getStorageSync('userInfo')
    const cachedUser = cached
      ? typeof cached === 'string'
        ? JSON.parse(cached)
        : cached
      : null
    if (cachedUser?.avatar) {
      avatar.value = toAbsoluteUrl(String(cachedUser.avatar))
      avatarLoadFailed.value = false
    }

    const [userRes, config] = await Promise.all([getUserInfo(), getSystemConfig()])
    if ((userRes.code === 0 || userRes.code === 200) && userRes.data) {
      nickname.value = userRes.data.nickname || '社区用户'
      const resolvedAvatar = toAbsoluteUrl(userRes.data.avatar || cachedUser?.avatar || '')
      const fallbackAvatar = toAbsoluteUrl(cachedUser?.avatar || '')
      avatar.value = isLikelyInvalidMiniProgramUrl(resolvedAvatar)
        ? isLikelyInvalidMiniProgramUrl(fallbackAvatar)
          ? ''
          : fallbackAvatar
        : resolvedAvatar
      avatarLoadFailed.value = false
      uni.setStorageSync('userInfo', userRes.data)
      userStore.setUserId(Number(userRes.data.id))
    }
    servicePhone.value = config.servicePhone || servicePhone.value
    serviceWechat.value = config.serviceWechat || serviceWechat.value

    const userId = getUserId()
    if (userId > 0) {
      const notices = await getNoticeList(userId)
      unreadCount.value = notices.filter((item) => !item.read).length
    } else {
      unreadCount.value = 0
    }
  } catch (error) {
  } finally {
    loading.value = false
  }
}

function goNotice() {
  if (!ensureLogin('查看通知')) return
  uni.navigateTo({ url: '/pages/notice/notice' })
}

function goService() {
  uni.navigateTo({ url: '/pages/service/service' })
}

function goAccountSecurity() {
  if (!ensureLogin('查看账号安全')) return
  uni.navigateTo({ url: '/pages/account-security/account-security' })
}

function scanAction() {
  if (!ensureLogin('扫码')) return
  uni.scanCode({
    success: (res) => {
      const text = String(res.result || '').slice(0, 60)
      uni.showModal({
        title: '扫码结果',
        content: text || '已扫码，但内容为空',
        showCancel: false
      })
    },
    fail: () => {
      uni.showToast({ title: '扫码已取消', icon: 'none' })
    }
  })
}

function clearLocalCache() {
  if (!ensureLogin('清理缓存')) return
  uni.showModal({
    title: '清除缓存',
    content: '将清除本地缓存（保留登录态），是否继续？',
    success: (res) => {
      if (!res.confirm) return
      const token = uni.getStorageSync('token')
      const userInfo = uni.getStorageSync('userInfo')
      const userId = uni.getStorageSync('user_id')
      uni.clearStorageSync()
      if (token) uni.setStorageSync('token', token)
      if (userInfo) uni.setStorageSync('userInfo', userInfo)
      if (userId) uni.setStorageSync('user_id', userId)
      userStore.hydrateUserId()
      uni.showToast({ title: '缓存已清理', icon: 'success' })
    }
  })
}

function logout() {
  if (!ensureLogin('退出登录')) return
  uni.showModal({
    title: '退出登录',
    content: '确定退出当前账号吗？',
    success: (res) => {
      if (!res.confirm) return
      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')
      userStore.clearUserId()
      uni.showToast({ title: '已退出登录', icon: 'none' })
      setTimeout(() => {
        uni.navigateBack()
      }, 500)
    }
  })
}

onShow(() => {
  loadData()
})

function onAvatarError() {
  avatarLoadFailed.value = true
}
</script>

<template>
  <view class="settings-page">
    <view class="settings-card profile-card" @click="goAccountSecurity">
      <image
        :src="avatarLoadFailed ? DEFAULT_AVATAR_PATH : (avatar || DEFAULT_AVATAR_PATH)"
        mode="aspectFill"
        class="w-[96rpx] h-[96rpx] rounded-full overflow-hidden bg-gray-100 shrink-0"
        @error="onAvatarError"
      />
      <view class="profile-meta">
        <text class="profile-name">{{ nickname }}</text>
        <text class="profile-sub">{{ loading ? '同步数据中...' : '点击可编辑个人资料' }}</text>
      </view>
      <uni-icons type="right" size="16" color="#c4c4c4" />
    </view>

    <view class="settings-card">
      <view class="setting-row" @click="goNotice">
        <view class="row-left">
          <uni-icons type="notification" size="18" color="#f08800" />
          <text class="row-label">通知中心</text>
        </view>
        <view class="row-right">
          <text v-if="unreadCount > 0" class="dot-text">{{ unreadCount > 99 ? '99+' : unreadCount }}</text>
          <uni-icons type="right" size="16" color="#c4c4c4" />
        </view>
      </view>

      <view class="setting-row" @click="scanAction">
        <view class="row-left">
          <uni-icons type="scan" size="18" color="#2f5233" />
          <text class="row-label">扫一扫</text>
        </view>
        <uni-icons type="right" size="16" color="#c4c4c4" />
      </view>
      <view class="setting-row no-border" @click="goAccountSecurity">
        <view class="row-left">
          <uni-icons type="locked" size="18" color="#2f5233" />
          <text class="row-label">账号与安全</text>
        </view>
        <uni-icons type="right" size="16" color="#c4c4c4" />
      </view>
    </view>

    <view class="settings-card">
      <view class="setting-row" @click="goService">
        <view class="row-left">
          <uni-icons type="headphones" size="18" color="#2f5233" />
          <text class="row-label">联系客服</text>
        </view>
        <text class="row-meta">{{ servicePhone }}</text>
      </view>
      <view class="setting-row no-border">
        <view class="row-left">
          <uni-icons type="chat" size="18" color="#2f5233" />
          <text class="row-label">客服微信</text>
        </view>
        <text class="row-meta">{{ serviceWechat }}</text>
      </view>
    </view>

    <view class="settings-card">
      <view class="setting-row" @click="clearLocalCache">
        <view class="row-left">
          <uni-icons type="trash" size="18" color="#6b7280" />
          <text class="row-label">清理本地缓存</text>
        </view>
        <uni-icons type="right" size="16" color="#c4c4c4" />
      </view>
      <view class="setting-row no-border danger-row" @click="logout">
        <view class="row-left">
          <uni-icons type="closeempty" size="18" color="#ef4444" />
          <text class="row-label danger-text">退出登录</text>
        </view>
        <uni-icons type="right" size="16" color="#f1a3a3" />
      </view>
    </view>
  </view>
</template>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f6f7fb;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.settings-card {
  background: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 18rpx rgba(15, 23, 42, 0.05);
  padding: 0 24rpx;
}

.profile-card {
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.profile-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.profile-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #2f5233;
}

.profile-sub {
  font-size: 24rpx;
  color: #8b919f;
}

.setting-row {
  height: 90rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #eef1f5;
}

.setting-row.no-border {
  border-bottom: none;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.row-label {
  font-size: 28rpx;
  color: #243b2b;
}

.row-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.row-meta {
  font-size: 24rpx;
  color: #8a909e;
}

.dot-text {
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 8rpx;
  border-radius: 18rpx;
  background: #ef4444;
  color: #fff;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.danger-row .row-label,
.danger-text {
  color: #ef4444;
}
</style>
