<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentRealnameAuth, submitRealnameAuth } from '@/api/user'
import { uploadBizFile } from '@/api/file'

const authType = ref<'personal' | 'company'>('personal')
const realName = ref('')
const idCardNo = ref('')
const companyName = ref('')
const licenseNo = ref('')
const contactPhone = ref('')
const idCardFrontUrl = ref('')
const idCardBackUrl = ref('')
const faceVerifyUrl = ref('')
const businessLicenseUrl = ref('')
const submitting = ref(false)

onShow(async () => {
  const res = await getCurrentRealnameAuth()
  if (res.data?.status === 'approved') {
    uni.showToast({ title: '已完成实名认证', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 300)
    return
  }
  if (res.data) {
    authType.value = (res.data.authType || 'personal') as any
    realName.value = res.data.realName || ''
    idCardNo.value = res.data.idCardNo || ''
    companyName.value = res.data.companyName || ''
    licenseNo.value = res.data.licenseNo || ''
    contactPhone.value = res.data.contactPhone || ''
    idCardFrontUrl.value = res.data.idCardFrontUrl || ''
    idCardBackUrl.value = res.data.idCardBackUrl || ''
    faceVerifyUrl.value = res.data.faceVerifyUrl || ''
    businessLicenseUrl.value = res.data.businessLicenseUrl || ''
  }
})

async function pickAndUpload(target: 'idFront' | 'idBack' | 'face' | 'license') {
  const choose = await new Promise<UniApp.ChooseImageSuccessCallbackResult>((resolve, reject) => {
    uni.chooseImage({ count: 1, success: resolve, fail: reject })
  }).catch(() => null)
  const filePath = choose?.tempFilePaths?.[0]
  if (!filePath) return
  uni.showLoading({ title: '上传中...' })
  try {
    const bizType = target === 'license' ? 'license' : target === 'face' ? 'face' : 'realname'
    const res = await uploadBizFile(filePath, bizType as any)
    const url = res.data?.url || ''
    if (!url) {
      uni.showToast({ title: '上传失败', icon: 'none' })
      return
    }
    if (target === 'idFront') idCardFrontUrl.value = url
    if (target === 'idBack') idCardBackUrl.value = url
    if (target === 'face') faceVerifyUrl.value = url
    if (target === 'license') businessLicenseUrl.value = url
    uni.showToast({ title: '上传成功', icon: 'success' })
  } finally {
    uni.hideLoading()
  }
}

async function verifyFaceWithWechat() {
  // #ifdef MP-WEIXIN
  if (!realName.value.trim() || !idCardNo.value.trim()) {
    uni.showToast({ title: '请先填写姓名和身份证号', icon: 'none' })
    return
  }
  const facialApi = (uni as any).startFacialRecognitionVerify
  if (typeof facialApi === 'function') {
    try {
      await new Promise<void>((resolve, reject) => {
        facialApi({
          name: realName.value.trim(),
          idCardNumber: idCardNo.value.trim(),
          checkAliveType: 2,
          success: () => resolve(),
          fail: (err: any) => reject(err)
        })
      })
      faceVerifyUrl.value = `wechat_face_verified:${Date.now()}`
      uni.showToast({ title: '微信人脸核验通过', icon: 'success' })
      return
    } catch {
      uni.showToast({ title: '微信核验失败，改为上传核验照', icon: 'none' })
    }
  }
  // #endif
  await pickAndUpload('face')
}

function validateForm() {
  if (!realName.value.trim()) return uni.showToast({ title: '请填写姓名', icon: 'none' }), false
  if (authType.value === 'personal') {
    if (!idCardNo.value.trim()) return uni.showToast({ title: '请填写身份证号', icon: 'none' }), false
    if (!idCardFrontUrl.value || !idCardBackUrl.value) return uni.showToast({ title: '请上传身份证正反面', icon: 'none' }), false
    if (!faceVerifyUrl.value) return uni.showToast({ title: '请完成人脸核验', icon: 'none' }), false
  }
  if (authType.value === 'company') {
    if (!companyName.value.trim() || !licenseNo.value.trim()) return uni.showToast({ title: '请填写企业信息', icon: 'none' }), false
    if (!businessLicenseUrl.value) return uni.showToast({ title: '请上传营业执照', icon: 'none' }), false
  }
  return true
}

async function submit() {
  if (submitting.value || !validateForm()) return
  submitting.value = true
  try {
    const res = await submitRealnameAuth({
      authType: authType.value,
      realName: realName.value.trim(),
      idCardNo: idCardNo.value.trim(),
      companyName: companyName.value.trim(),
      licenseNo: licenseNo.value.trim(),
      contactPhone: contactPhone.value.trim(),
      idCardFrontUrl: idCardFrontUrl.value,
      idCardBackUrl: idCardBackUrl.value,
      faceVerifyUrl: faceVerifyUrl.value,
      businessLicenseUrl: businessLicenseUrl.value
    })
    if (res.code !== 0 && res.code !== 200) {
      uni.showToast({ title: res.message || '提交失败', icon: 'none' })
      submitting.value = false
      return
    }
    uni.showToast({ title: '实名申请已提交', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-8 space-y-6">
    <view class="bg-white rounded-2xl p-7 shadow-sm space-y-6">
      <text class="text-2xl font-bold text-fresh block">实名认证</text>
      <view class="tabs">
        <view class="tab" :class="{ active: authType === 'personal' }" @click="authType = 'personal'">个人认证</view>
        <view class="tab" :class="{ active: authType === 'company' }" @click="authType = 'company'">企业认证</view>
      </view>
      <input v-model="realName" class="field field-input" placeholder="真实姓名" />
      <input v-model="contactPhone" class="field field-input" placeholder="联系电话（选填）" type="number" :maxlength="11" />

      <template v-if="authType === 'personal'">
        <input v-model="idCardNo" class="field field-input" placeholder="身份证号" />
        <view class="upload-grid">
          <view class="upload-item" @click="pickAndUpload('idFront')">{{ idCardFrontUrl ? '已上传身份证人像面' : '上传身份证人像面' }}</view>
          <view class="upload-item" @click="pickAndUpload('idBack')">{{ idCardBackUrl ? '已上传身份证国徽面' : '上传身份证国徽面' }}</view>
          <view class="upload-item upload-item-face" @click="verifyFaceWithWechat">{{ faceVerifyUrl ? '已完成人脸核验' : '微信人脸核验/上传核验照' }}</view>
        </view>
      </template>

      <template v-else>
        <input v-model="companyName" class="field field-input" placeholder="企业名称" />
        <input v-model="licenseNo" class="field field-input" placeholder="营业执照号" />
        <view class="upload-item" @click="pickAndUpload('license')">{{ businessLicenseUrl ? '已上传营业执照' : '上传营业执照' }}</view>
      </template>
    </view>

    <view class="bg-[#2F5233] text-white text-center py-5 rounded-2xl text-lg font-bold" :class="{ 'opacity-60': submitting }" @click="submit">
      {{ submitting ? '提交中...' : '提交实名认证' }}
    </view>
  </view>
</template>

<style scoped>
.tabs { display: flex; gap: 16rpx; }
.tab { flex: 1; text-align: center; padding: 16rpx 0; border-radius: 20rpx; background: #f1f5f9; color: #475569; }
.tab.active { background: #2f5233; color: #fff; }
.field { width: 100%; border: 1rpx solid #e5e7eb; border-radius: 24rpx; padding: 26rpx 28rpx; font-size: 32rpx; color: #334155; background: #fff; box-sizing: border-box; }
.field-input { height: 88rpx; line-height: 88rpx; padding-top: 0; padding-bottom: 0; }
.upload-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; }
.upload-item { border: 1rpx dashed #94a3b8; color: #334155; border-radius: 18rpx; padding: 22rpx; text-align: center; font-size: 26rpx; background: #f8fafc; }
.upload-item-face { grid-column: 1 / -1; }
</style>
