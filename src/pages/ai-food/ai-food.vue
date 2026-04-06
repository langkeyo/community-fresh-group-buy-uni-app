<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import { getAiRecipeRecommend } from '@/services/ai'
import type { AiRecipeHistoryItem, FavoriteItem } from '@/types/ai'
import { ref } from 'vue'

interface ChatCard extends AiRecipeHistoryItem {
  query: string
}

// --- 响应式数据 ---
const inputValue = ref('')
const isThinking = ref(false) // AI 是否正在思考
const chatHistory = ref<ChatCard[]>([]) // 生成的食谱历史
const errorTip = ref('')
const lastQuery = ref('')
const pendingQuery = ref('')
const thinkingStage = ref('正在理解你的需求...')
const FAVORITE_KEY = 'ai_favorites'
const BUY_KEYWORDS_KEY = 'goods_buy_keywords'
const favoriteMap = ref<Record<string, FavoriteItem>>({})
const MIN_THINKING_MS = 900
const THINKING_STAGE_LIST = [
  '正在理解你的需求...',
  '正在匹配可用食材...',
  '正在生成做法步骤...'
]
let thinkingStageTimer: ReturnType<typeof setInterval> | null = null

const getFavoriteKey = (item: FavoriteItem) => `${item.title}||${item.desc}`

const loadFavorites = () => {
  const stored = uni.getStorageSync(FAVORITE_KEY)
  if (!stored) {
    favoriteMap.value = {}
    return
  }
  try {
    const list = JSON.parse(stored) as FavoriteItem[]
    const map: Record<string, FavoriteItem> = {}
    list.forEach((item) => {
      map[getFavoriteKey(item)] = item
    })
    favoriteMap.value = map
  } catch (error) {
    favoriteMap.value = {}
  }
}

const saveFavorites = () => {
  const list = Object.values(favoriteMap.value)
  uni.setStorageSync(FAVORITE_KEY, JSON.stringify(list))
}

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

const startThinkingStageLoop = () => {
  stopThinkingStageLoop()
  let idx = 0
  thinkingStage.value = THINKING_STAGE_LIST[idx]
  thinkingStageTimer = setInterval(() => {
    idx = (idx + 1) % THINKING_STAGE_LIST.length
    thinkingStage.value = THINKING_STAGE_LIST[idx]
  }, 900)
}

const stopThinkingStageLoop = () => {
  if (!thinkingStageTimer) return
  clearInterval(thinkingStageTimer)
  thinkingStageTimer = null
}

// 发送请求
const handleSend = async () => {
  if (!inputValue.value.trim() || isThinking.value) return

  const query = inputValue.value.trim()
  inputValue.value = '' // 清空输入框
  pendingQuery.value = query
  isThinking.value = true
  startThinkingStageLoop()
  errorTip.value = ''
  lastQuery.value = query

  // 滚动到底部
  scrollToBottom()

  const startedAt = Date.now()
  try {
    await generateResponse(query)
    pendingQuery.value = ''
    scrollToBottom()
  } catch (error) {
    const msg = resolveErrorMessage(error)
    errorTip.value = msg
    pendingQuery.value = ''
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    const elapsed = Date.now() - startedAt
    if (elapsed < MIN_THINKING_MS) {
      await sleep(MIN_THINKING_MS - elapsed)
    }
    stopThinkingStageLoop()
    isThinking.value = false
    scrollToBottom()
  }
}

// 生成回复逻辑
const generateResponse = async (query: string) => {
  const result = await getAiRecipeRecommend(query)
  const favKey = getFavoriteKey(result)
  chatHistory.value.push({
    ...result,
    query,
    isCollected: Boolean(favoriteMap.value[favKey]),
    timestamp: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  })
}

// 收藏/取消收藏
const toggleCollect = (card: ChatCard) => {
  card.isCollected = !card.isCollected
  const favKey = getFavoriteKey(card)
  if (card.isCollected) {
    favoriteMap.value[favKey] = {
      title: card.title,
      desc: card.desc,
      tags: card.tags,
      image: card.image,
      ingredients: card.ingredients,
      steps: card.steps,
      source: card.source,
      disclaimer: card.disclaimer
    }
  } else {
    delete favoriteMap.value[favKey]
  }
  saveFavorites()
  const msg = card.isCollected ? '已收藏到我的食谱' : '已取消收藏'
  uni.showToast({ title: msg, icon: 'none' })
}

// 滚动到底部
const scrollToBottom = () => {
  setTimeout(() => {
    uni.pageScrollTo({
      scrollTop: 99999,
      duration: 300
    })
  }, 100)
}

// 推荐标签点击
const handleTagClick = (text: string) => {
  inputValue.value = text
  handleSend()
}

const resolveErrorMessage = (error: any) => {
  const raw = String(
    error?.message || error?.errMsg || error?.msg || JSON.stringify(error || {})
  )
  if (raw === 'EMPTY_RESULT') {
    return '暂无可用结果，换个说法试试'
  }
  if (
    raw.includes('timeout') ||
    raw.includes('超时') ||
    raw.includes('NETWORK_ERROR') ||
    raw.includes('网络请求异常')
  ) {
    return 'AI响应超时，请稍后重试'
  }
  if (raw.includes('500') || raw.includes('服务器')) {
    return 'AI服务暂时繁忙，请稍后再试'
  }
  return '推荐失败，请稍后重试'
}

const retryLast = async () => {
  if (!lastQuery.value || isThinking.value) return
  inputValue.value = lastQuery.value
  await handleSend()
}

const handleBuyIngredients = (card: ChatCard) => {
  const names = card.ingredients
    .map((x) => (x.name || '').trim())
    .filter(Boolean)
    .slice(0, 8)
  if (!names.length) {
    uni.showToast({ title: '当前菜谱暂无可购买食材', icon: 'none' })
    return
  }
  uni.setStorageSync(BUY_KEYWORDS_KEY, names)
  uni.switchTab({ url: '/pages/goods/goods' })
}

loadFavorites()
</script>

<template>
  <view class="flex flex-col min-h-screen bg-[#F8F8F8] pb-[140rpx]">
    <!-- 1. 顶部欢迎语 (无历史记录时显示) -->
    <view
      v-if="chatHistory.length === 0 && !pendingQuery"
      class="flex flex-col items-center justify-center pt-20 px-6"
    >
      <view
        class="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mb-4 border border-[#2F5233]/10"
      >
        <text class="text-4xl">🤖</text>
      </view>
      <text class="text-xl font-bold text-[#2F5233] mb-2"
        >我是您的AI食材顾问</text
      >
      <text class="text-sm text-gray-500 text-center mb-8">
        输入您冰箱里的食材（如“番茄
        鸡蛋”），或者告诉我想吃的类型（如“低脂晚餐”），我为您生成专属食谱。
      </text>

      <!-- 快捷标签 -->
      <view class="flex flex-wrap gap-2 justify-center">
        <view
          class="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-[#2F5233] active:bg-gray-50"
          @click="handleTagClick('怎么做减脂餐？')"
        >
          🥗 怎么做减脂餐？
        </view>
        <view
          class="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-[#2F5233] active:bg-gray-50"
          @click="handleTagClick('冰箱里只有两个鸡蛋')"
        >
          🥚 冰箱里只有两个鸡蛋
        </view>
        <view
          class="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-[#2F5233] active:bg-gray-50"
          @click="handleTagClick('鸡胸肉怎么做不柴？')"
        >
          🍗 鸡胸肉怎么做不柴？
        </view>
      </view>

      <view
        v-if="errorTip"
        class="mt-6 w-full bg-white rounded-xl p-4 border border-red-100"
      >
        <text class="text-sm text-red-500">{{ errorTip }}</text>
        <view class="mt-3">
          <BaseButton text="重试" @click="retryLast" />
        </view>
      </view>
    </view>

    <!-- 2. 对话列表 -->
    <view v-else class="p-4 space-y-6">
      <view v-for="card in chatHistory" :key="card.id" class="fade-in-up">
        <view class="flex justify-end mb-3">
          <view
            class="max-w-[80%] bg-[#F08800] text-white text-sm px-4 py-2 rounded-2xl rounded-br-md"
          >
            {{ card.query }}
          </view>
        </view>

        <!-- AI 头像与时间 -->
        <view class="flex items-center mb-2 ml-1">
          <view
            class="w-6 h-6 bg-[#F08800] rounded-full flex items-center justify-center mr-2"
          >
            <text class="text-xs text-white">AI</text>
          </view>
          <text class="text-xs text-gray-400"
            >为您推荐 • {{ card.timestamp }}</text
          >
        </view>

        <!-- 食谱卡片 -->
        <view
          class="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
        >
          <image
            :src="card.image"
            mode="aspectFill"
            class="w-full h-40 bg-gray-200"
          />

          <view class="p-4">
            <view class="flex justify-between items-start mb-2">
              <view class="flex-1 mr-2 space-y-1">
                <text class="text-lg font-bold text-[#2F5233]">{{
                  card.title
                }}</text>
                <BaseTag
                  :kind="card.source === 'DB' ? 'success' : 'warning'"
                  :text="card.source === 'DB' ? '词典命中' : 'AI生成'"
                />
              </view>
              <view class="mt-0.5" @click="toggleCollect(card)">
                <text
                  class="text-xl"
                  :class="card.isCollected ? 'text-[#F08800]' : 'text-gray-300'"
                >
                  {{ card.isCollected ? '★' : '☆' }}
                </text>
              </view>
            </view>

            <!-- 标签 -->
            <view class="flex gap-2 mb-3">
              <text
                v-for="tag in card.tags"
                :key="tag"
                class="text-[20rpx] bg-[#E8F5E9] text-[#2F5233] px-2 py-0.5 rounded"
              >
                {{ tag }}
              </text>
            </view>

            <text class="text-sm text-gray-600 mb-4 block leading-relaxed">
              {{ card.desc }}
            </text>
            <text
              v-if="card.disclaimer"
              class="text-[22rpx] text-orange-500 mb-3 block"
            >
              {{ card.disclaimer }}
            </text>

            <view v-if="card.ingredients.length" class="mb-3">
              <text class="text-xs text-gray-500 block mb-2">推荐食材</text>
              <view class="flex flex-wrap gap-2">
                <text
                  v-for="ing in card.ingredients"
                  :key="`${ing.name}-${ing.amount}-${ing.unit}`"
                  class="text-[22rpx] bg-orange-50 text-orange-600 px-2 py-1 rounded"
                >
                  {{ ing.name }} {{ ing.amount }}{{ ing.unit }}
                </text>
              </view>
            </view>

            <!-- 步骤 -->
            <view class="bg-[#F8F8F8] rounded-lg p-3">
              <view
                v-for="step in card.steps"
                :key="step.step"
                class="flex mb-2 last:mb-0"
              >
                <view
                  class="bg-[#F08800] text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center mt-0.5 mr-2 flex-shrink-0"
                >
                  {{ step.step }}
                </view>
                <text class="text-xs text-gray-700 leading-normal">{{
                  step.content
                }}</text>
              </view>
            </view>

            <view class="mt-3 pt-3 border-t border-gray-100 flex justify-end">
              <BaseButton
                type="default"
                text="一键买齐食材"
                @click="handleBuyIngredients(card)"
              />
            </view>
          </view>
        </view>
      </view>

      <view v-if="errorTip" class="bg-white rounded-xl p-4 border border-red-100">
        <text class="text-sm text-red-500">{{ errorTip }}</text>
        <view class="mt-3">
          <BaseButton text="重试" @click="retryLast" />
        </view>
      </view>

      <!-- 思考中状态 -->
      <view v-if="pendingQuery" class="flex justify-end fade-in-up">
        <view
          class="max-w-[80%] bg-[#F08800] text-white text-sm px-4 py-2 rounded-2xl rounded-br-md"
        >
          {{ pendingQuery }}
        </view>
      </view>
      <view v-if="isThinking" class="fade-in">
        <view class="flex items-center ml-1 mb-2">
          <view
            class="w-6 h-6 bg-[#F08800] rounded-full flex items-center justify-center mr-2"
          >
            <text class="text-xs text-white">AI</text>
          </view>
          <view
            class="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center"
          >
            <view class="ai-thinking__spinner mr-2"></view>
            <text class="text-sm text-gray-500">{{ thinkingStage }}</text>
          </view>
        </view>
        <view
          class="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse"
        >
          <view class="w-full h-40 bg-gray-200"></view>
          <view class="p-4 space-y-3">
            <view class="h-4 w-2/3 bg-gray-200 rounded"></view>
            <view class="h-3 w-1/3 bg-gray-200 rounded"></view>
            <view class="h-3 w-full bg-gray-100 rounded"></view>
            <view class="h-3 w-5/6 bg-gray-100 rounded"></view>
            <view class="h-20 w-full bg-gray-100 rounded-lg"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 3. 底部输入栏 -->
    <view
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 pb-safe z-50"
    >
      <view class="bg-[#F8F8F8] rounded-full p-1">
        <view class="flex items-center px-3 py-1">
          <input
            v-model="inputValue"
            type="text"
            confirm-type="send"
            placeholder="输入食材或菜名（如：番茄）"
            placeholder-class="text-gray-400 text-sm"
            class="flex-1 ml-1 text-sm text-[#2F5233] h-9"
            @confirm="handleSend"
          />
          <view
            class="h-9 px-4 rounded-full flex items-center justify-center transition-colors"
            :class="
              isThinking
                ? 'bg-[#F6B04A]'
                : inputValue.trim()
                  ? 'bg-[#F08800]'
                  : 'bg-gray-300'
            "
            @click="handleSend"
          >
            <view v-if="isThinking" class="ai-send__spinner mr-1"></view>
            <text class="text-white text-sm font-bold">发送</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style>
/* 简单的淡入动画 */
.fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}
.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 底部安全区适配 */
.pb-safe {
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

.ai-thinking__spinner,
.ai-send__spinner {
  width: 20rpx;
  height: 20rpx;
  border-radius: 9999rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.ai-thinking__spinner {
  border-color: rgba(240, 136, 0, 0.2);
  border-top-color: #f08800;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
