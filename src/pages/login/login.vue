<script setup lang="ts">
import { login, getUserInfo } from '@/api/user'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// TODO: 后续大量用户改 userId:string
const handleWechatLogin = async () => {
  uni.showLoading({ title: '登录中...' })

  try {
    // 1. 拿 Code
    const { code } = await uni.login({ provider: 'weixin' })
    if (!code) throw new Error('获取微信Code失败')

    // 2. 调后端
    const res = await login(code)
    console.log('登录结果:', res)

    // 3. 存 Token
    const token = res.data.token
    if (token) {
      uni.setStorageSync('token', token)

      // 4. 顺手把用户信息也存了 (如果有的话)，没有就再调一次 info 接口
      if (res.data.userInfo) {
        const uid = Number(res.data.userInfo.id)
        if (!Number.isSafeInteger(uid)) {
          throw new Error('用户ID超出安全范围，请改为字符串ID方案')
        }
        uni.setStorageSync('userInfo', res.data.userInfo)
        userStore.setUserId(uid)
      } else {
        // 如果登录接口没返回用户信息，稍微花点时间去拉取一下
        const infoRes = await getUserInfo()
        if (infoRes.data) {
          const uid = Number(infoRes.data.id)
          if (!Number.isSafeInteger(infoRes.data.id)) {
            throw new Error('用户ID超出安全范围，请改为字符串ID方案')
          }
          uni.setStorageSync('userInfo', infoRes.data)
          userStore.setUserId(uid)
        }
      }

      uni.showToast({ title: '登录成功', icon: 'success' })

      // 5. 关键动作：登录成功后，延迟 1.5秒 返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  } catch (error) {
    console.error('登录异常:', error)
    // request.ts 里有弹窗，这里就不重复弹了，或者根据需要弹一个
  } finally {
    uni.hideLoading()
  }
}
</script>

<template>
  <view class="flex flex-col items-center justify-center h-screen bg-white">
    <!-- Logo 区域 -->
    <view class="flex flex-col items-center mb-12 text-center">
      <view
        class="w-24 h-24 bg-[#F08800] rounded-2xl flex items-center justify-center mb-4 shadow-lg rotate-3"
      >
        <text class="text-5xl">🥬</text>
      </view>
      <text class="text-2xl font-bold text-[#2F5233] tracking-wider"
        >邻里鲜拼</text
      >
      <text class="mt-2 text-sm text-gray-400">社区生鲜 · 每日必达</text>
    </view>

    <!-- 登录按钮 -->
    <button
      class="bg-[#07C160] text-white w-4/5 rounded-full py-3 text-lg font-bold flex items-center justify-center active:opacity-90 shadow-md transition-all active:scale-95"
      @click="handleWechatLogin"
    >
      <!-- 这里可以用个简单的微信图标 SVG 或者 uni-icons -->
      <text class="mr-2">⚡</text> 微信一键登录
    </button>

    <!-- 协议声明 -->
    <view class="mt-6 text-xs text-gray-400">
      登录即代表同意 <text class="text-[#F08800]">《用户服务协议》</text>
    </view>
  </view>
</template>

<style scoped>
/* 既然用了 Tailwind，这里基本不用写啥样式了 */
</style>
