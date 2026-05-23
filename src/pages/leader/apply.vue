<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const contactName = ref('')
const contactPhone = ref('')
const communityName = ref('')
const remark = ref('')
const submitting = ref(false)
const LEADER_APPLY_KEY = 'leader_apply_draft'

function hasSubmittedApply() {
  const raw = uni.getStorageSync(LEADER_APPLY_KEY)
  return Boolean(raw && typeof raw === 'object' && raw.submitAt)
}

onShow(() => {
  if (hasSubmittedApply()) {
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

function submitApply() {
  if (!validateForm() || submitting.value) return
  if (hasSubmittedApply()) {
    uni.showToast({ title: '您已提交申请，请等待审核', icon: 'none' })
    return
  }
  submitting.value = true

  const payload = {
    contactName: contactName.value.trim(),
    contactPhone: contactPhone.value.trim(),
    communityName: communityName.value.trim(),
    remark: remark.value.trim(),
    submitAt: Date.now()
  }
  uni.setStorageSync('leader_apply_draft', payload)

  setTimeout(() => {
    submitting.value = false
    uni.showToast({ title: '申请已提交', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  }, 300)
}
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-8 space-y-6">
    <view class="bg-white rounded-2xl p-7 shadow-sm space-y-6">
      <text class="text-2xl font-bold text-fresh block">团长申请</text>
      <text class="text-base text-gray-500 block">提交后由管理员审核开通团长权限</text>

      <input v-model="contactName" class="field field-input" placeholder="联系人姓名" />
      <input v-model="contactPhone" class="field field-input" placeholder="联系人手机号" type="number" :maxlength="11" />
      <input v-model="communityName" class="field field-input" placeholder="服务小区/自提点名称" />
      <textarea v-model="remark" class="field field-textarea h-44" placeholder="补充说明（可选）" :maxlength="120" />
    </view>

    <view
      class="bg-[#2F5233] text-white text-center py-5 rounded-2xl text-lg font-bold"
      :class="{ 'opacity-60': submitting }"
      @click="submitApply"
    >
      {{ submitting ? '提交中...' : '提交申请' }}
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
</style>
