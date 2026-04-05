<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import { getProductDetail } from '@/services/product'
import type { ProductItem } from '@/types/product'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const loading = ref(true)
const errorMsg = ref('')
const product = ref<ProductItem | null>(null)

const displayGroupPrice = computed(() => {
  if (!product.value) return '--'
  const price =
    product.value.groupPrice2 ?? product.value.groupPrice3 ?? product.value.price
  return price.toFixed(2)
})

const displayOriginPrice = computed(() => {
  if (!product.value) return '--'
  return product.value.price.toFixed(2)
})

const coverImage = computed(() => {
  return product.value?.images?.[0] || ''
})

const goToGroupBuy = () => {
  const pickPointId = Number(uni.getStorageSync('default_pick_point_id'))
  if (!pickPointId) {
    uni.showToast({ title: '请先选择自提点', icon: 'none' })
    uni.navigateTo({ url: '/pages/self-pick/self-pick' })
    return
  }
  if (!product.value) return
  uni.navigateTo({
    url: `/pages/group-buy/group-buy?id=${product.value.id}&pickPointId=${pickPointId}`
  })
}

const load = async (id: number) => {
  loading.value = true
  errorMsg.value = ''
  try {
    const detail = await getProductDetail(id)
    if (!detail) {
      errorMsg.value = '商品不存在或已下架'
      return
    }
    product.value = detail
  } catch (error: any) {
    errorMsg.value = error?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onLoad((query) => {
  const id = Number(query?.id)
  if (!Number.isFinite(id) || id <= 0) {
    errorMsg.value = '商品信息缺失'
    loading.value = false
    return
  }
  load(id)
})
</script>

<template>
  <view class="min-h-screen bg-gray-50 pb-24">
    <view v-if="loading" class="py-8 text-center">
      <text class="text-sm text-gray-400">加载中...</text>
    </view>

    <view v-else-if="errorMsg" class="py-8 text-center">
      <text class="text-sm text-red-500">{{ errorMsg }}</text>
    </view>

    <view v-else class="space-y-4">
      <image
        v-if="coverImage"
        :src="coverImage"
        mode="aspectFill"
        class="w-full h-56 bg-gray-200"
      />
      <view v-else class="w-full h-56 bg-gray-200"></view>

      <view class="px-4 space-y-2">
        <text class="text-lg font-bold text-fresh">{{ product?.name }}</text>
        <view class="flex items-center gap-2">
          <text class="text-xs text-primary">团购价</text>
          <text class="text-2xl font-bold text-primary">
            ￥{{ displayGroupPrice }}
          </text>
          <text class="text-xs text-gray-400 line-through">
            ￥{{ displayOriginPrice }}
          </text>
        </view>
        <text class="text-xs text-gray-500">
          库存：{{ product?.stock }}
        </text>
      </view>

      <view class="px-4">
        <view class="bg-white rounded-xl p-4 shadow-sm space-y-2">
          <text class="text-base font-bold text-fresh">商品信息</text>
          <text class="text-sm text-gray-600">分类：{{ product?.category }}</text>
          <text class="text-sm text-gray-600">
            团购价（2人/3人）：￥{{ displayGroupPrice }}
          </text>
        </view>
      </view>
    </view>

    <view class="fixed bottom-0 left-0 right-0 bg-white border-t p-3 pb-safe">
      <BaseButton
        class="w-full"
        :disabled="(product?.stock ?? 0) <= 0"
        :text="(product?.stock ?? 0) <= 0 ? '库存不足' : '立即拼团'"
        @click="goToGroupBuy"
      />
    </view>
  </view>
</template>
