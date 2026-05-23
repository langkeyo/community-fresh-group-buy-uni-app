<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSmartImage from '@/components/base/BaseSmartImage.vue'
import { getOpenGroupList } from '@/services/order'
import { getProductDetail } from '@/services/product'
import { getProductList } from '@/services/product'
import { getProductReviewList } from '@/services/review'
import type { OpenGroupItem } from '@/api/order'
import type { ProductItem } from '@/types/product'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const loading = ref(true)
const errorMsg = ref('')
const product = ref<ProductItem | null>(null)
const recommendList = ref<ProductItem[]>([])
const openGroupList = ref<OpenGroupItem[]>([])
const reviewTextList = ref<string[]>([])

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

const imageList = computed(() => {
  return product.value?.images?.filter(Boolean) || []
})

const videoUrl = computed(() => product.value?.videoUrl || '')

const displayCommentList = computed(() => {
  return reviewTextList.value
})
const hasComments = computed(() => displayCommentList.value.length > 0)

const goToGroupBuy = (joinGroupId?: string) => {
  const pickPointId = Number(uni.getStorageSync('default_pick_point_id'))
  if (!pickPointId) {
    uni.showToast({ title: '请先选择自提点', icon: 'none' })
    uni.navigateTo({ url: '/pages/self-pick/self-pick' })
    return
  }
  if (!product.value) return
  const joinQuery = joinGroupId ? `&joinGroupId=${joinGroupId}` : ''
  uni.navigateTo({
    url: `/pages/group-buy/group-buy?id=${product.value.id}&pickPointId=${pickPointId}${joinQuery}`
  })
}

const goToService = () => {
  uni.navigateTo({ url: '/pages/service/service' })
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
    const list = await getProductList()
    const sameCategory = list.filter(
      (item) => item.id !== detail.id && item.category === detail.category
    )
    const fallback = list.filter((item) => item.id !== detail.id)
    recommendList.value = (sameCategory.length ? sameCategory : fallback).slice(0, 4)
    const pickPointId = Number(uni.getStorageSync('default_pick_point_id'))
    if (Number.isFinite(pickPointId) && pickPointId > 0) {
      openGroupList.value = await getOpenGroupList(detail.id, pickPointId)
    } else {
      openGroupList.value = []
    }
    const reviews = await getProductReviewList(detail.id, 10)
    reviewTextList.value = reviews.map((item) => `${item.userNickname || '用户'}：${item.content}`)
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

onPullDownRefresh(async () => {
  const id = product.value?.id
  if (id) {
    await load(id)
  }
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="min-h-screen bg-gray-50" style="padding-bottom: calc(220rpx + var(--safe-bottom))">
    <view v-if="loading" class="py-8 text-center">
      <text class="text-sm text-gray-400">加载中...</text>
    </view>

    <view v-else-if="errorMsg" class="py-8 text-center">
      <text class="text-sm text-red-500">{{ errorMsg }}</text>
    </view>

    <view v-else class="space-y-4">
      <swiper
        v-if="imageList.length"
        class="w-full h-56 bg-gray-200"
        indicator-dots
        circular
        autoplay
        :interval="3000"
      >
        <swiper-item v-for="img in imageList" :key="img">
          <BaseSmartImage
            :src="img"
            class-name="w-full h-56"
            fallback-bg="#eef2f7"
            fallback-color="#667085"
            fallback-text="商品图片"
          />
        </swiper-item>
      </swiper>
      <view v-else class="w-full h-56 bg-gray-200"></view>

      <view v-if="videoUrl" class="px-4">
        <view class="bg-white rounded-xl p-3 shadow-sm space-y-2">
          <text class="text-sm font-bold text-fresh">商品视频</text>
          <video
            :src="videoUrl"
            class="w-full h-48 rounded-lg bg-black"
            controls
            object-fit="cover"
            :show-center-play-btn="true"
          />
        </view>
      </view>

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
          <text
            v-if="(product?.stock ?? 0) <= 10"
            class="text-red-400 ml-1"
            >库存紧张</text
          >
        </text>
      </view>

      <view class="px-4">
        <view class="bg-white rounded-xl p-4 shadow-sm space-y-2">
          <text class="text-base font-bold text-fresh">商品信息</text>
          <view class="flex items-center justify-between text-sm">
            <text class="text-gray-500">分类</text>
            <text class="text-gray-700">{{ product?.category || '-' }}</text>
          </view>
          <view class="flex items-center justify-between text-sm">
            <text class="text-gray-500">团购价（2/3人）</text>
            <text class="text-primary font-bold">￥{{ displayGroupPrice }}</text>
          </view>
        </view>
      </view>

      <view class="px-4" v-if="openGroupList.length">
        <view class="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <view class="flex items-center justify-between">
            <text class="text-base font-bold text-fresh">正在拼团</text>
          </view>
          <view
            v-for="item in openGroupList"
            :key="item.groupBuyId"
            class="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC]"
          >
            <view class="min-w-0 pr-3">
              <text class="block text-sm text-fresh line-clamp-1">拼团号：{{ item.groupBuyId.slice(0, 12) }}</text>
              <text class="block text-[22rpx] text-gray-500 mt-1">已参团{{ item.currentCount }}人 · 目标{{ item.targetCount }}人</text>
            </view>
            <BaseButton class="join-btn" text="加入拼团" @click="goToGroupBuy(item.groupBuyId)" />
          </view>
        </view>
      </view>

      <view class="px-4">
        <view class="bg-white rounded-xl p-4 shadow-sm">
          <view class="flex items-center justify-between mb-2">
            <text class="text-base font-bold text-fresh">买家评价</text>
          </view>
          <swiper
            v-if="hasComments"
            class="comment-swiper"
            vertical
            autoplay
            circular
            :interval="2200"
            :duration="500"
          >
            <swiper-item v-for="(item, idx) in displayCommentList" :key="idx" class="comment-item">
              <text class="text-sm text-gray-600 line-clamp-1">{{ item }}</text>
            </swiper-item>
          </swiper>
          <view v-else class="comment-empty">
            <view class="comment-empty-icon">
              <uni-icons type="staff-filled" size="22" color="#94a3b8" />
            </view>
            <text class="text-sm text-gray-500 mt-2 block">暂无评论</text>
            <text class="text-xs text-gray-400 mt-1 block">等你来成为第一个评论的人</text>
          </view>
          <view class="mt-3 pt-3 border-t border-gray-100">
            <text class="text-xs text-gray-400">请在订单详情页完成收货后进行评价</text>
          </view>
        </view>
      </view>

      <view class="px-4 pb-2" v-if="recommendList.length">
        <view class="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <view class="flex items-center justify-between">
            <text class="text-base font-bold text-fresh">猜你想看</text>
          </view>
          <view class="grid grid-cols-2 gap-3">
            <view
              v-for="item in recommendList"
              :key="item.id"
              class="bg-[#F8FAFC] rounded-lg p-2 active:opacity-85"
              @click="load(item.id)"
            >
              <BaseSmartImage
                :src="item.images?.[0] || ''"
                class-name="w-full h-24 rounded-md bg-gray-200"
                fallback-bg="#eef2f7"
                fallback-color="#667085"
                :fallback-text="item.name"
              />
              <text class="block text-[24rpx] text-fresh font-bold mt-2 line-clamp-1">{{ item.name }}</text>
              <text class="block text-[22rpx] text-primary mt-1">
                ￥{{ (item.groupPrice2 ?? item.groupPrice3 ?? item.price).toFixed(2) }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="fixed bottom-0 left-0 right-0 bg-white border-t p-3 safe-bottom-padding">
      <view class="flex items-center gap-3">
        <BaseButton class="flex-1 detail-cta-btn" type="default" text="联系客服" @click="goToService" />
        <BaseButton
          class="flex-[1.4] detail-cta-btn"
          :disabled="(product?.stock ?? 0) <= 0"
          :text="(product?.stock ?? 0) <= 0 ? '库存不足' : '立即拼团'"
          @click="goToGroupBuy"
        />
      </view>
    </view>
  </view>
</template>

<style scoped>
.comment-swiper {
  height: 52rpx;
}

.comment-item {
  display: flex;
  align-items: center;
}

.comment-empty {
  min-height: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.comment-empty-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 9999rpx;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-cta-btn :deep(view) {
  min-height: 76rpx;
  padding-left: 24rpx;
  padding-right: 24rpx;
}

.detail-cta-btn :deep(text) {
  font-size: 26rpx;
  line-height: 36rpx;
}

.join-btn :deep(view) {
  min-height: 64rpx;
  padding-left: 18rpx;
  padding-right: 18rpx;
}

.join-btn :deep(text) {
  font-size: 24rpx;
}
</style>
