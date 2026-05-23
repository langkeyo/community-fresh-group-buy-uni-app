<script setup lang="ts">
import { uploadAvatar } from '@/api/file'
import { getUserInfo, updateUserProfile } from '@/api/user'
import { DEFAULT_AVATAR_PATH } from '@/constants/ui'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'

const nickname = ref('')
const mobile = ref('')
const avatar = ref('')
const saving = ref(false)
const uploading = ref(false)
const avatarLoadFailed = ref(false)

const mobileRule = /^1\d{10}$/
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

function toServerPath(url: string): string {
  if (!url) return ''
  if (url.startsWith('wxfile://')) return url
  if (url.startsWith(API_BASE_URL)) {
    const rest = url.slice(API_BASE_URL.length)
    return rest.startsWith('/') ? rest : `/${rest}`
  }
  return url
}

async function loadProfile() {
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

    const res = await getUserInfo()
    if ((res.code === 0 || res.code === 200) && res.data) {
      nickname.value = res.data.nickname || ''
      mobile.value = res.data.mobile || ''
      const resolvedAvatar = toAbsoluteUrl(
        res.data.avatar || cachedUser?.avatar || ''
      )
      const fallbackAvatar = toAbsoluteUrl(cachedUser?.avatar || '')
      avatar.value = isLikelyInvalidMiniProgramUrl(resolvedAvatar)
        ? isLikelyInvalidMiniProgramUrl(fallbackAvatar)
          ? ''
          : fallbackAvatar
        : resolvedAvatar
      avatarLoadFailed.value = false
    }
  } catch (error) {}
}

function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const filePath = res.tempFilePaths?.[0]
      if (!filePath) return
      avatar.value = filePath
      avatarLoadFailed.value = false
      uploading.value = true
      try {
        const uploadRes = await uploadAvatar(filePath)
        const url = uploadRes.data?.url || ''
        if (!url) {
          uni.showToast({ title: '头像上传失败', icon: 'none' })
          return
        }
        avatar.value = toAbsoluteUrl(url)
        avatarLoadFailed.value = false
        uni.showToast({ title: '头像上传成功', icon: 'success' })
      } catch (error: any) {
        uni.showToast({ title: error?.message || '头像上传失败', icon: 'none' })
      } finally {
        uploading.value = false
      }
    }
  })
}

function validateForm(): string {
  const name = nickname.value.trim()
  if (!name) return '昵称不能为空'
  if (name.length > 20) return '昵称最多20个字符'
  const m = mobile.value.trim()
  if (m && !mobileRule.test(m)) return '手机号格式不正确'
  return ''
}

async function saveProfile() {
  const errorMsg = validateForm()
  if (errorMsg) {
    uni.showToast({ title: errorMsg, icon: 'none' })
    return
  }
  if (saving.value) return
  saving.value = true
  try {
    const res = await updateUserProfile({
      nickname: nickname.value.trim(),
      avatar: toServerPath(avatar.value.trim()),
      mobile: mobile.value.trim()
    })
    if (res.code !== 0 && res.code !== 200) {
      uni.showToast({ title: res.message || '保存失败', icon: 'none' })
      return
    }
    if (res.data) {
      res.data.avatar = toAbsoluteUrl(res.data.avatar || '')
      uni.setStorageSync('userInfo', res.data)
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onShow(() => {
  loadProfile()
})

function onAvatarError() {
  avatarLoadFailed.value = true
}
</script>

<template>
  <view class="secure-page">
    <view class="secure-card">
      <text class="title">个人资料</text>
      <view class="avatar-row" @click="chooseAvatar">
        <text class="label">头像</text>
        <view class="avatar-action">
          <image
            :src="avatarLoadFailed ? DEFAULT_AVATAR_PATH : (avatar || DEFAULT_AVATAR_PATH)"
            mode="aspectFill"
            class="w-[96rpx] h-[96rpx] rounded-full overflow-hidden bg-gray-100 shrink-0"
            @error="onAvatarError"
          />
          <view v-if="uploading" class="uploading-dot"></view>
        </view>
      </view>

      <view class="field-row">
        <text class="label">昵称</text>
        <input
          v-model="nickname"
          class="field-input"
          :maxlength="20"
          placeholder="请输入昵称"
        />
      </view>

      <view class="field-row no-border">
        <text class="label">手机号</text>
        <input
          v-model="mobile"
          class="field-input"
          :maxlength="11"
          type="number"
          placeholder="选填，11位手机号"
        />
      </view>
    </view>

    <view
      class="save-btn"
      :class="{ disabled: saving || uploading }"
      @click="saveProfile"
    >
      {{ saving ? '保存中...' : '保存资料' }}
    </view>
  </view>
</template>

<style scoped>
.secure-page {
  min-height: 100vh;
  background: #f6f7fb;
  padding: 24rpx;
}

.secure-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 18rpx rgba(15, 23, 42, 0.05);
}

.title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1f3b2b;
  margin-bottom: 18rpx;
}

.avatar-row,
.field-row {
  min-height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #eef1f5;
}

.field-row.no-border {
  border-bottom: none;
}

.label {
  color: #243b2b;
  font-size: 28rpx;
  font-weight: 600;
}

.avatar-action {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.avatar-image {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  overflow: hidden;
}

.uploading-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #f08800;
}

.field-input {
  width: 420rpx;
  text-align: right;
  font-size: 28rpx;
  color: #111827;
}

.save-btn {
  margin-top: 28rpx;
  height: 88rpx;
  border-radius: 44rpx;
  background: #f08800;
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.save-btn.disabled {
  opacity: 0.7;
}
</style>
