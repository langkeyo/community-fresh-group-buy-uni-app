<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSmartImage from '@/components/base/BaseSmartImage.vue'
import { DEFAULT_AVATAR_PATH } from '@/constants/ui'
import { getPickPointDetail, getPickPointList } from '@/services/pick-point'
import { getLeaderWorkbench, leaderConfirmPick } from '@/services/order'
import type { OrderInfo } from '@/types/order'
import type { UserInfo } from '@/types/user'
import { isLeaderUser } from '@/utils/leader'
import { playNoticeSound } from '@/utils/sound'
import { onHide, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const userInfo = ref<UserInfo | null>(null)
const pickPointName = ref('')
const pickPointAddress = ref('')
const pickPointId = ref<number | null>(null)
const loading = ref(false)
const errorMsg = ref('')
const needBindPickPoint = ref(false)
const confirmingId = ref('')
const pendingOrders = ref<OrderInfo[]>([])
const recentConfirmList = ref<OrderInfo[]>([])
const pickedTodayCount = ref(0)
const managedPickPointIds = ref<number[]>([])
const LEADER_POLL_INTERVAL = 15000
let leaderPollTimer: ReturnType<typeof setInterval> | null = null
let lastPendingCount = 0

const pendingCount = computed(() => pendingOrders.value.length)

const resetWorkbenchState = () => {
  errorMsg.value = ''
  needBindPickPoint.value = false
  pendingOrders.value = []
  recentConfirmList.value = []
  pickedTodayCount.value = 0
}

const loadUserInfo = () => {
  const stored = uni.getStorageSync('userInfo')
  if (!stored) {
    userInfo.value = null
    return
  }
  userInfo.value = typeof stored === 'string' ? JSON.parse(stored) : stored
}

const loadPickPoint = async () => {
  const allPoints = await getPickPointList().catch(() => [])
  managedPickPointIds.value = allPoints
    .filter((p) => Number(p.leaderUserId || 0) === Number(userInfo.value?.id || 0))
    .map((p) => Number(p.id))

  if (!managedPickPointIds.value.length) {
    pickPointId.value = null
    pickPointName.value = ''
    pickPointAddress.value = ''
    resetWorkbenchState()
    errorMsg.value = '你还没有可管理的自提点'
    needBindPickPoint.value = true
    return
  }

  const storedId = Number(uni.getStorageSync('default_pick_point_id'))
  const id = managedPickPointIds.value.includes(storedId)
    ? storedId
    : managedPickPointIds.value[0]
  pickPointId.value = id
  if (id !== storedId) {
    uni.setStorageSync('default_pick_point_id', id)
  }

  try {
    const detail = await getPickPointDetail(id)
    pickPointName.value = detail?.name || ''
    pickPointAddress.value = detail?.address || ''
  } catch (error: any) {
    uni.showToast({ title: error?.message || '自提点信息加载失败', icon: 'none' })
  }
}

const loadLeaderOrders = async () => {
  if (!userInfo.value?.id || !pickPointId.value) return
  loading.value = true
  errorMsg.value = ''
  needBindPickPoint.value = false
  try {
    const data = await getLeaderWorkbench(userInfo.value.id, pickPointId.value)
    const prev = lastPendingCount
    pendingOrders.value = data.pendingOrders
    recentConfirmList.value = data.recentPickedOrders
    pickedTodayCount.value = data.pickedTodayCount
    lastPendingCount = data.pendingOrders.length
    if (prev > 0 && data.pendingOrders.length > prev) {
      playNoticeSound()
    }
  } catch (error: any) {
    const msg = String(error?.message || '')
    const permissionDenied =
      msg.includes('无权限操作该自提点订单') ||
      msg.includes('绑定信息不完整') ||
      msg.includes('非团长无权限')
    errorMsg.value = permissionDenied ? '当前站点暂无管理权限' : '待核销订单加载失败，请稍后重试'
    needBindPickPoint.value = permissionDenied
    pendingOrders.value = []
    recentConfirmList.value = []
    pickedTodayCount.value = 0
    lastPendingCount = 0
  } finally {
    loading.value = false
  }
}

const stopLeaderPolling = () => {
  if (!leaderPollTimer) return
  clearInterval(leaderPollTimer)
  leaderPollTimer = null
}

const startLeaderPolling = () => {
  stopLeaderPolling()
  leaderPollTimer = setInterval(() => {
    if (!pickPointId.value || !userInfo.value?.id || loading.value) return
    void loadLeaderOrders()
  }, LEADER_POLL_INTERVAL)
}

const handleConfirm = async (id: string) => {
  if (!userInfo.value?.id || !pickPointId.value || confirmingId.value) return
  confirmingId.value = id
  try {
    await leaderConfirmPick(id, userInfo.value.id, pickPointId.value)
    uni.showToast({ title: '核销成功', icon: 'success' })
    uni.setStorageSync('order_need_refresh', true)
    await loadLeaderOrders()
  } catch (error: any) {
    uni.showToast({ title: error?.message || '核销失败', icon: 'none' })
  } finally {
    confirmingId.value = ''
  }
}

const goToPickPoint = () => {
  uni.navigateTo({ url: '/pages/self-pick/self-pick' })
}

const goToOrderDetail = (id: string) => {
  uni.navigateTo({ url: `/pages/order/detail?id=${id}` })
}

const goToService = () => {
  uni.navigateTo({ url: '/pages/service/service' })
}

const goToLeaderBindApply = () => {
  uni.navigateTo({ url: '/pages/leader/apply?mode=bind_pick_point' })
}

onShow(async () => {
  stopLeaderPolling()
  loadUserInfo()
  if (!isLeaderUser(userInfo.value?.isLeader)) {
    setTimeout(() => {
      uni.switchTab({ url: '/pages/mine/mine' })
    }, 400)
    return
  }
  await loadPickPoint()
  if (!pickPointId.value) {
    return
  }
  await loadLeaderOrders()
  startLeaderPolling()
})

onPullDownRefresh(async () => {
  if (!isLeaderUser(userInfo.value?.isLeader)) {
    uni.stopPullDownRefresh()
    return
  }
  await loadPickPoint()
  if (!pickPointId.value) {
    uni.stopPullDownRefresh()
    return
  }
  await loadLeaderOrders()
  uni.stopPullDownRefresh()
})

onHide(() => {
  stopLeaderPolling()
})
</script>

<template>
  <view class="min-h-screen bg-[#F5F7FA]">
    <view class="px-4 pt-4 pb-2 space-y-3">
      <view class="bg-[#2F5233] rounded-2xl p-4 text-white shadow-sm">
        <view class="flex items-center mb-4">
        <view class="relative mr-3">
          <view class="leader-avatar-frame">
            <BaseSmartImage
              :src="userInfo?.avatar || DEFAULT_AVATAR_PATH"
              class-name="w-12 h-12 rounded-full overflow-hidden"
              fallback-bg="#ffffff"
              fallback-color="#f08800"
              fallback-text="团长"
            />
          </view>
          <view class="leader-avatar-badge">
            <uni-icons type="shop" size="13" color="#8a5a00" />
          </view>
        </view>
        <view>
          <text class="text-white font-bold text-lg block">{{
            userInfo?.nickname || '团长'
          }}</text>
          <text class="text-white/80 text-xs">{{
            pickPointName || '未选择自提点'
          }}</text>
        </view>
        </view>

        <view class="grid grid-cols-2 gap-3">
          <view class="bg-white/10 rounded-xl px-3 py-2">
            <text class="block text-[40rpx] font-bold">{{ pendingCount }}</text>
            <text class="text-xs opacity-90">待核销订单</text>
          </view>
          <view class="bg-white/10 rounded-xl px-3 py-2">
            <text class="block text-[40rpx] font-bold">{{ pickedTodayCount }}</text>
            <text class="text-xs opacity-90">今日已核销</text>
          </view>
        </view>
      </view>

      <view
        class="bg-white rounded-xl shadow-sm p-4 space-y-2"
      >
        <view class="flex items-center justify-between">
          <text class="text-sm font-bold text-[#2F5233]">当前核销自提点</text>
          <text class="text-xs text-primary" @click="goToPickPoint">切换</text>
        </view>
        <text class="text-sm text-gray-700">{{ pickPointName || '请先选择自提点' }}</text>
        <text class="text-xs text-gray-500">{{
          pickPointAddress || '选择后可加载待核销订单'
        }}</text>
      </view>
    </view>

    <!-- 待核销订单 -->
    <view class="px-4">
      <view
        class="flex items-center justify-between mb-3"
      >
        <text class="text-base font-bold text-[#2F5233]">待核销订单</text>
        <text class="text-xs text-gray-500">按时间排序，先到先核销</text>
      </view>

      <view v-if="loading" class="py-4 text-center">
        <text class="text-xs text-gray-400">加载中...</text>
      </view>

      <view v-else-if="errorMsg" class="py-4 text-center">
        <text class="text-xs text-amber-700 block mb-2">{{ errorMsg }}</text>
        <view v-if="needBindPickPoint" class="space-y-2">
          <text class="text-[22rpx] text-gray-500 block">
            当前账号还未与该自提点完成绑定，请先切换正确自提点或联系管理员绑定。
          </text>
          <view class="flex gap-2 justify-center">
            <BaseButton type="default" text="申请管理权限" @click="goToLeaderBindApply" />
            <BaseButton text="联系客服" @click="goToService" />
          </view>
        </view>
        <BaseButton v-else type="default" text="重试加载" @click="loadLeaderOrders" />
      </view>

      <view v-else>
        <view
          v-for="item in pendingOrders"
          :key="item.id"
          class="bg-white p-3 rounded-xl mb-2 shadow-sm space-y-2 border border-gray-100"
        >
          <view class="flex justify-between items-start">
            <view>
              <view class="text-sm font-bold text-gray-800">{{ item.name }}</view>
              <text class="block text-xs text-gray-500 mt-0.5">订单号：{{ item.no }}</text>
              <text class="block text-xs text-gray-500 mt-0.5">提货点：{{ item.pickPointName || '-' }}</text>
            </view>
            <text class="text-[22rpx] text-gray-400">{{
              item.createTime || '-'
            }}</text>
          </view>
          <view class="flex items-center justify-between">
            <view class="text-xs text-gray-500">
              <text>数量 {{ item.qty }}</text>
              <text class="ml-2 text-primary">￥{{ item.price }}</text>
            </view>
          </view>
          <view class="flex flex-col gap-2">
            <view class="w-full">
              <BaseButton
                class="w-full"
                type="default"
                text="查看详情"
                :disabled="Boolean(confirmingId)"
                @click="goToOrderDetail(item.id)"
              />
            </view>
            <view class="w-full">
              <BaseButton
                class="w-full"
                text="确认提货"
                :loading="confirmingId === item.id"
                :disabled="Boolean(confirmingId) && confirmingId !== item.id"
                @click="handleConfirm(item.id)"
              />
            </view>
          </view>
        </view>
      </view>

      <view
        v-if="!loading && !errorMsg && pendingOrders.length === 0"
        class="text-center py-6 text-gray-400 text-xs"
      >
        今日订单已全部核销完成
      </view>
    </view>

    <view class="px-4 pb-6">
      <view
        class="flex items-center justify-between mb-3"
      >
        <text class="text-base font-bold text-[#2F5233]">最近核销</text>
        <text class="text-xs text-gray-500">用于现场核对</text>
      </view>
      <view
        v-if="recentConfirmList.length === 0"
        class="text-center py-6 text-gray-400 text-xs"
      >
        暂无核销记录
      </view>
      <view
        v-for="item in recentConfirmList"
        :key="item.id"
        class="bg-white p-3 rounded-xl mb-2 shadow-sm space-y-1 border border-gray-100"
      >
        <text class="text-sm font-bold text-gray-800">{{ item.name }}</text>
        <text class="block text-xs text-gray-500">订单号：{{ item.no }}</text>
        <text class="text-xs text-gray-400">核销时间：{{ item.createTime || '-' }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.wxss-page-fix {
  display: block;
}

.leader-avatar-frame {
  border-radius: 9999rpx;
  padding: 4rpx;
  background: linear-gradient(135deg, #fde68a, #f59e0b);
}

.leader-avatar-badge {
  position: absolute;
  right: -6rpx;
  bottom: -6rpx;
  width: 28rpx;
  height: 28rpx;
  border-radius: 9999rpx;
  background: linear-gradient(135deg, #fff3c4, #f6c44f);
  color: #8a5a00;
  font-size: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #fff7d6;
  box-shadow: 0 2rpx 8rpx rgba(246, 196, 79, 0.45);
}
</style>

