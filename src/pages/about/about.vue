<script setup lang="ts">
const versions = [
  { label: '版本', value: 'V1.0.0' },
  { label: '平台', value: '微信小程序' },
  { label: '开发', value: '社区生鲜团购团队' }
]
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-6 space-y-6">
    <view class="bg-white rounded-xl p-6 shadow-sm">
      <text class="text-lg font-bold text-fresh block mb-3">关于我们</text>
      <text class="text-sm text-gray-500 block">
        我们致力于为社区用户提供更方便、更便宜、更稳定的生鲜团购服务。
      </text>
    </view>

    <view class="bg-white rounded-xl p-6 shadow-sm">
      <view v-for="item in versions" :key="item.label" class="flex justify-between py-3 border-b border-gray-100">
        <text class="text-base text-gray-600">{{ item.label }}</text>
        <text class="text-base text-gray-800">{{ item.value }}</text>
      </view>
    </view>
  </view>
</template>
