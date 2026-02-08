<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// --- 类型定义 ---
interface ProductDetail {
  id: number
  name: string
  desc: string
  images: string[]
  price2: number
  price3: number
  originalPrice: number
  sales: number
  unit: string
  category: string
}
interface ActiveGroup {
  id: number
  userAvatar: string
  userName: string
  missing: number
  timeLeft: string
}

// --- 数据 ---
const productId = ref<number>(0)
const product = ref<ProductDetail | null>(null)
const groupType = ref<2 | 3>(2)
const formData = ref({ name: '', phone: '', pickUpPoint: '' })
const pickUpPoints = [
  '阳光花园一期A站',
  '幸福里正门便利店',
  '滨江壹号菜鸟驿站',
  '老街坊社区中心'
]
const pickUpIndex = ref(-1)

const activeGroups = ref<ActiveGroup[]>([
  {
    id: 101,
    userAvatar: 'https://placehold.co/100x100/FF5722/FFFFFF?text=陈',
    userName: '陈阿姨',
    missing: 1,
    timeLeft: '00:15:20'
  },
  {
    id: 102,
    userAvatar: 'https://placehold.co/100x100/2196F3/FFFFFF?text=刘',
    userName: '刘先生',
    missing: 2,
    timeLeft: '01:02:45'
  }
])

const currentPrice = computed(() => {
  if (!product.value) return '0.00'
  return groupType.value === 2
    ? product.value.price2.toFixed(2)
    : product.value.price3.toFixed(2)
})

onLoad((options: any) => {
  const id = Number(options.id || 1)
  productId.value = id
  loadProductDetail(id)
})

const loadProductDetail = (id: number) => {
  const keyword = id % 2 === 0 ? 'fruit' : 'vegetable'
  product.value = {
    id: id,
    name: id % 2 === 0 ? '海南树上熟贵妃芒 5斤装' : '高山有机西兰花 500g*2份',
    desc: '产地直采，每日新鲜到货，坏果包赔。',
    category: keyword,
    images: [
      `https://loremflickr.com/750/750/${keyword}?lock=${id}`,
      `https://loremflickr.com/750/750/${keyword}?lock=${id + 100}`
    ],
    price2: 19.9,
    price3: 15.9,
    originalPrice: 29.9,
    sales: 2300,
    unit: '份'
  }
}

const setGroupType = (type: 2 | 3) => {
  groupType.value = type
}
const handlePickPointChange = (e: any) => {
  pickUpIndex.value = e.detail.value
  formData.value.pickUpPoint = pickUpPoints[pickUpIndex.value]
}

const handleSubmit = () => {
  if (!formData.value.name.trim())
    return uni.showToast({ title: '请填写收货人', icon: 'none' })
  if (!/^1[3-9]\d{9}$/.test(formData.value.phone))
    return uni.showToast({ title: '手机号格式有误', icon: 'none' })
  if (!formData.value.pickUpPoint)
    return uni.showToast({ title: '请选择自提点', icon: 'none' })

  uni.showLoading({ title: '正在发起拼团...' })
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '拼团发起成功！', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }, 1000)
}

const joinGroup = (group: ActiveGroup) => {
  uni.showModal({
    title: '确认加入?',
    content: `即将加入 ${group.userName} 的拼团，仅差 ${group.missing} 人`,
    success: (res) => {
      if (res.confirm) {
        uni.pageScrollTo({ scrollTop: 1000, duration: 300 })
        uni.showToast({ title: '请填写底部信息', icon: 'none' })
      }
    }
  })
}
</script>

<template>
  <view v-if="product" class="pb-24 bg-[#F8F8F8] min-h-screen">
    <!-- 1. 商品轮播 -->
    <swiper
      class="h-[750rpx] w-full bg-white"
      indicator-dots
      indicator-active-color="#F08800"
    >
      <swiper-item v-for="(img, idx) in product.images" :key="idx">
        <image :src="img" mode="aspectFill" class="w-full h-full" />
      </swiper-item>
    </swiper>

    <!-- 2. 信息卡片 -->
    <view class="bg-white p-4 mb-3 shadow-sm relative overflow-hidden">
      <view class="flex items-end mb-2">
        <text class="text-[#F08800] text-sm font-bold mb-1">￥</text>
        <text class="text-[#F08800] text-4xl font-bold font-sans">{{
          currentPrice
        }}</text>
        <text class="ml-2 text-gray-400 text-sm line-through"
          >￥{{ product.originalPrice.toFixed(2) }}</text
        >
        <view
          class="ml-auto bg-[#F08800]/10 text-[#F08800] text-xs px-2 py-1 rounded"
        >
          已拼 {{ product.sales }} {{ product.unit }}
        </view>
      </view>
      <text class="text-lg font-bold text-[#2F5233] leading-snug block mb-1">{{
        product.name
      }}</text>
      <text class="text-sm text-gray-500 block">{{ product.desc }}</text>
    </view>

    <!-- 3. 正在拼团 (修复箭头) -->
    <view class="bg-white px-4 py-3 mb-3">
      <view
        class="flex justify-between items-center mb-3 text-sm border-b border-gray-100 pb-2"
      >
        <text class="text-gray-700 font-bold">2人在拼单，可直接参与</text>
        <view class="flex items-center text-xs text-gray-400">
          查看更多
          <uni-icons
            type="right"
            size="12"
            color="#9ca3af"
            class="ml-1"
          ></uni-icons>
        </view>
      </view>
      <view
        v-for="group in activeGroups"
        :key="group.id"
        class="flex items-center justify-between py-2"
      >
        <view class="flex items-center">
          <image :src="group.userAvatar" class="w-10 h-10 rounded-full mr-2" />
          <text class="text-sm text-gray-700 font-medium">{{
            group.userName
          }}</text>
        </view>
        <view class="flex items-center">
          <view class="text-right mr-3">
            <view class="text-xs text-[#2F5233]"
              >还差
              <text class="text-[#F08800] font-bold"
                >{{ group.missing }}人</text
              >
              成团</view
            >
            <view class="text-[20rpx] text-gray-400"
              >剩余 {{ group.timeLeft }}</view
            >
          </view>
          <button
            class="bg-[#F08800] text-white text-xs px-3 py-1.5 rounded-full leading-none m-0"
            @click="joinGroup(group)"
          >
            去拼单
          </button>
        </view>
      </view>
    </view>

    <!-- 4. 模式选择 -->
    <view class="bg-white p-4 mb-3">
      <text class="text-sm font-bold text-[#2F5233] mb-3 block"
        >选择拼团模式</text
      >
      <view class="flex gap-3">
        <view
          class="flex-1 border rounded-lg p-3 flex flex-col items-center transition-all"
          :class="
            groupType === 2
              ? 'border-[#F08800] bg-[#F08800]/5'
              : 'border-gray-200'
          "
          @click="setGroupType(2)"
        >
          <text class="text-sm font-bold text-[#2F5233]">2人团</text>
          <text class="text-lg font-bold text-[#F08800] mt-1"
            >￥{{ product.price2 }}</text
          >
          <text class="text-xs text-gray-400">成团快</text>
        </view>
        <view
          class="flex-1 border rounded-lg p-3 flex flex-col items-center transition-all"
          :class="
            groupType === 3
              ? 'border-[#F08800] bg-[#F08800]/5'
              : 'border-gray-200'
          "
          @click="setGroupType(3)"
        >
          <view class="relative">
            <text class="text-sm font-bold text-[#2F5233]">3人团</text>
            <view
              class="absolute -top-4 -right-8 bg-[#F08800] text-white text-[18rpx] px-1 rounded-sm"
              >超值</view
            >
          </view>
          <text class="text-lg font-bold text-[#F08800] mt-1"
            >￥{{ product.price3 }}</text
          >
          <text class="text-xs text-gray-400">更优惠</text>
        </view>
      </view>
    </view>

    <!-- 5. 收货表单 (修复 Picker 箭头) -->
    <view class="bg-white p-4 mb-3">
      <text class="text-sm font-bold text-[#2F5233] mb-3 block">收货信息</text>
      <view class="flex items-center py-3 border-b border-gray-100">
        <text class="w-20 text-sm text-gray-600">收货人</text>
        <input
          v-model="formData.name"
          type="text"
          placeholder="请填写真实姓名"
          placeholder-class="text-gray-300"
          class="flex-1 text-sm text-[#2F5233]"
        />
      </view>
      <view class="flex items-center py-3 border-b border-gray-100">
        <text class="w-20 text-sm text-gray-600">手机号</text>
        <input
          v-model="formData.phone"
          type="number"
          :maxlength="11"
          placeholder="请填写手机号码"
          placeholder-class="text-gray-300"
          class="flex-1 text-sm text-[#2F5233]"
        />
      </view>
      <picker
        mode="selector"
        :range="pickUpPoints"
        @change="handlePickPointChange"
      >
        <view class="flex items-center py-3">
          <text class="w-20 text-sm text-gray-600">自提点</text>
          <view
            class="flex-1 text-sm"
            :class="formData.pickUpPoint ? 'text-[#2F5233]' : 'text-gray-300'"
          >
            {{ formData.pickUpPoint || '请选择附近的自提点' }}
          </view>
          <!-- 修复点 -->
          <uni-icons type="right" size="14" color="#cccccc"></uni-icons>
        </view>
      </picker>
    </view>

    <!-- 6. 底部栏 -->
    <view
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex items-center z-50 pb-safe"
    >
      <view class="flex flex-col mr-4">
        <text class="text-xs text-gray-500">实付金额:</text>
        <view class="flex items-baseline">
          <text class="text-xs text-[#F08800] font-bold">￥</text>
          <text class="text-xl text-[#F08800] font-bold">{{
            currentPrice
          }}</text>
        </view>
      </view>
      <button
        class="flex-1 bg-[#F08800] text-white rounded-full font-bold text-base h-10 flex items-center justify-center m-0 active:scale-95 transition-transform"
        @click="handleSubmit"
      >
        立即发起{{ groupType }}人团
      </button>
    </view>
  </view>
</template>

<style>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
