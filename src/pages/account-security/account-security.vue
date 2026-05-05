<script setup lang="ts">
import { getUserInfo } from '@/api/user'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'

const nickname = ref('社区用户')
const mobileMasked = ref('未绑定')

function maskMobile(mobile?: string) {
  const text = String(mobile || '').trim()
  if (!/^1\d{10}$/.test(text)) return '未绑定'
  return `${text.slice(0, 3)}****${text.slice(7)}`
}

async function loadProfile() {
  try {
    const res = await getUserInfo()
    if (res.code === 0 && res.data) {
      nickname.value = res.data.nickname || '社区用户'
      mobileMasked.value = maskMobile(res.data.mobile)
    }
  } catch (error) {}
}

function relogin() {
  uni.navigateTo({ url: '/pages/login/login' })
}

function goService() {
  uni.navigateTo({ url: '/pages/service/service' })
}

onShow(() => {
  loadProfile()
})
</script>

<template>
  <view class="secure-page">
    <view class="secure-card">
      <text class="title">账号信息</text>
      <view class="row"><text class="label">昵称</text><text class="value">{{ nickname }}</text></view>
      <view class="row"><text class="label">手机</text><text class="value">{{ mobileMasked }}</text></view>
      <view class="row"><text class="label">登录方式</text><text class="value">微信授权登录</text></view>
    </view>

    <view class="secure-card">
      <text class="title">安全说明</text>
      <text class="desc">1. 当前账号不使用站内密码，忘记密码场景不适用。</text>
      <text class="desc">2. 头像与昵称来自微信授权，需在微信侧修改后重新登录同步。</text>
      <text class="desc">3. 如需人工处理账号问题，请联系平台客服。</text>
    </view>

    <view class="secure-card">
      <view class="action" @click="relogin">重新登录同步授权信息</view>
      <view class="action" @click="goService">联系人工客服</view>
    </view>
  </view>
</template>

<style scoped>
.secure-page {
  min-height: 100vh;
  background: #f6f7fb;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
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
.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}
.label { color: #667085; font-size: 26rpx; }
.value { color: #1f2937; font-size: 26rpx; }
.desc {
  display: block;
  font-size: 24rpx;
  color: #667085;
  line-height: 1.7;
  margin-bottom: 10rpx;
}
.action {
  height: 82rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2f5233;
  font-size: 26rpx;
  margin-bottom: 12rpx;
}
</style>

