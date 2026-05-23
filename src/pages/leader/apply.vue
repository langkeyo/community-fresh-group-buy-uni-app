<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getLatestLeaderApply, submitLeaderApply, getUserInfo } from '@/api/user'

const contactName = ref('')
const contactPhone = ref('')
const communityName = ref('')
const remark = ref('')
const submitting = ref(false)
const mode = ref<'leader' | 'bind_pick_point'>('leader')
const hasPending = ref(false)
const latestRejectReason = ref('')

async function refreshApplyStatus() {
  const res = await getLatestLeaderApply(mode.value)
  hasPending.value = !!(res.data && res.data.status === 'pending')
  latestRejectReason.value = res.data?.status === 'rejected' ? (res.data?.rejectReason || '') : ''
}

onShow(async (query) => {
  mode.value = query?.mode === 'bind_pick_point' ? 'bind_pick_point' : 'leader'
  if (mode.value === 'leader') {
    const infoRes = await getUserInfo()
    if (infoRes.data?.realnameStatus !== 'approved') {
      uni.showToast({ title: '请先完成实名认证', icon: 'none' })
      setTimeout(() => uni.navigateTo({ url: '/pages/realname/auth' }), 300)
      return
    }
  }
  await refreshApplyStatus()
  if (hasPending.value) {
    uni.showToast({ title: '您已提交申请，请等待审核', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 300)
  }
})

function validateForm() {
  if (!contactName.value.trim()) {
    uni.showToast({ title: '请填写联系人', icon: 'none' })
    return false
  }
  if (!/^1\d{10}$/.test(contactPhone.value.trim())) {
    uni.showToast({ title: '请填写正确手机号', icon: 'none' })
    return false
  }
  if (!communityName.value.trim()) {
    uni.showToast({ title: '请填写服务小区', icon: 'none' })
    return false
  }
  return true
}

async function submitApply() {
  if (!validateForm() || submitting.value) return
  if (hasPending.value) {
    uni.showToast({ title: '您已提交申请，请等待审核', icon: 'none' })
    return
  }
  submitting.value = true

  try {
    const res = await submitLeaderApply({
      applyType: mode.value,
      contactName: contactName.value.trim(),
      contactPhone: contactPhone.value.trim(),
      communityName: communityName.value.trim(),
      remark: remark.value.trim()
    })
    if (res.code !== 0 && res.code !== 200) {
      uni.showToast({ title: res.message || '提交失败', icon: 'none' })
      submitting.value = false
      return
    }
    submitting.value = false
    uni.showToast({ title: mode.value === 'bind_pick_point' ? '站点管理申请已提交' : '申请已提交', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  } catch {
    submitting.value = false
  }
}
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-8 space-y-6">
    <view class="bg-white rounded-2xl p-7 shadow-sm space-y-6">
      <text class="text-2xl font-bold text-fresh block">团长申请</text>
      <text class="text-base text-gray-500 block">
        {{ mode === 'bind_pick_point' ? '提交后由管理员审核并绑定可管理的自提点' : '提交后由管理员审核开通团长权限' }}
      </text>

      <input v-model="contactName" class="field field-input" placeholder="联系人姓名" />
      <input v-model="contactPhone" class="field field-input" placeholder="联系人手机号" type="number" :maxlength="11" />
      <input v-model="communityName" class="field field-input" :placeholder="mode === 'bind_pick_point' ? '希望管理的自提点名称' : '服务小区/自提点名称'" />
      <textarea v-model="remark" class="field field-textarea h-44" placeholder="补充说明（可选）" :maxlength="120" />
      <view v-if="latestRejectReason" class="reject-box">
        <text class="reject-title">上次驳回原因</text>
        <text class="reject-content">{{ latestRejectReason }}</text>
      </view>
    </view>

    <view
      class="bg-[#2F5233] text-white text-center py-5 rounded-2xl text-lg font-bold"
      :class="{ 'opacity-60': submitting }"
      @click="submitApply"
    >
      {{ submitting ? '提交中...' : (mode === 'bind_pick_point' ? '提交站点管理申请' : '提交申请') }}
    </view>
  </view>
</template>

<style scoped>
.field {
  width: 100%;
  border: 1rpx solid #e5e7eb;
  border-radius: 24rpx;
  padding: 26rpx 28rpx;
  font-size: 32rpx;
  color: #334155;
  background: #fff;
  box-sizing: border-box;
}

.field-input {
  height: 88rpx;
  line-height: 88rpx;
  padding-top: 0;
  padding-bottom: 0;
}

.field-textarea {
  line-height: 1.6;
}

.reject-box {
  padding: 20rpx 24rpx;
  border-radius: 18rpx;
  background: #fff7ed;
  border: 1rpx solid #fed7aa;
}

.reject-title {
  display: block;
  color: #9a3412;
  font-size: 24rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.reject-content {
  display: block;
  color: #c2410c;
  font-size: 24rpx;
  line-height: 1.5;
}
</style>
