<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTag from '@/components/base/BaseTag.vue'
import { getAiRecipeRecommend } from '@/services/ai'
import { ref } from 'vue'

// --- 类型定义 ---
interface RecipeStep {
  step: number
  content: string
}

interface RecipeCard {
  id: number
  title: string
  tags: string[]
  image: string
  desc: string
  steps: RecipeStep[]
  isCollected: boolean
  timestamp: string
  source: 'DB' | 'AI'
  disclaimer: string
}

interface FavoriteItem {
  title: string
  desc: string
  tags: string[]
  image: string
  steps: RecipeStep[]
  source: 'DB' | 'AI'
  disclaimer: string
}

// --- 响应式数据 ---
const inputValue = ref('')
const isThinking = ref(false) // AI 是否正在思考
const chatHistory = ref<RecipeCard[]>([]) // 生成的食谱历史
const errorTip = ref('')
const lastQuery = ref('')
const FAVORITE_KEY = 'ai_favorites'
const favoriteMap = ref<Record<string, FavoriteItem>>({})

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

// 发送请求
const handleSend = () => {
  if (!inputValue.value.trim() || isThinking.value) return

  const query = inputValue.value.trim()
  inputValue.value = '' // 清空输入框
  isThinking.value = true
  errorTip.value = ''
  lastQuery.value = query

  // 滚动到底部
  scrollToBottom()

  // 模拟 AI 思考延迟
  setTimeout(async () => {
    try {
      await generateResponse(query)
      scrollToBottom()
    } catch (error) {
      const msg = resolveErrorMessage(error)
      errorTip.value = msg
      uni.showToast({ title: msg, icon: 'none' })
    } finally {
      isThinking.value = false
    }
  }, 1500)
}

// 生成回复逻辑
const generateResponse = async (query: string) => {
  const result = await getAiRecipeRecommend(query)
  const favKey = getFavoriteKey(result)
  chatHistory.value.push({
    ...result,
    isCollected: Boolean(favoriteMap.value[favKey]),
    timestamp: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  })
}

// 收藏/取消收藏
const toggleCollect = (card: RecipeCard) => {
  card.isCollected = !card.isCollected
  const favKey = getFavoriteKey(card)
  if (card.isCollected) {
    favoriteMap.value[favKey] = {
      title: card.title,
      desc: card.desc,
      tags: card.tags,
      image: card.image,
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
  const raw = error?.message || ''
  if (raw === 'EMPTY_RESULT') {
    return '暂无可用结果，换个说法试试'
  }
  if (raw.includes('timeout') || raw.includes('超时')) {
    return 'AI响应超时，请稍后重试'
  }
  return '推荐失败，请稍后重试'
}

const retryLast = () => {
  if (!lastQuery.value || isThinking.value) return
  inputValue.value = lastQuery.value
  handleSend()
}

loadFavorites()
</script>

<template>
  <view class="flex flex-col min-h-screen bg-[#F8F8F8] pb-[140rpx]">
    <!-- 1. 顶部欢迎语 (无历史记录时显示) -->
    <view
      v-if="chatHistory.length === 0"
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
              <view class="flex items-center space-x-2">
                <text
                  class="text-xs text-[#F08800] border border-[#F08800] px-2 py-1 rounded-full"
                  >一键买齐食材</text
                >
              </view>
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
      <view v-if="isThinking" class="flex items-center ml-1 fade-in">
        <view
          class="w-6 h-6 bg-[#F08800] rounded-full flex items-center justify-center mr-2"
        >
          <text class="text-xs text-white">AI</text>
        </view>
        <view
          class="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center"
        >
          <text class="text-sm text-gray-500 mr-2">正在分析食材成分...</text>
          <text class="animate-pulse text-[#F08800]">●</text>
        </view>
      </view>
    </view>

    <!-- 3. 底部输入栏 -->
    <view
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 pb-safe z-50"
    >
      <view class="flex items-center bg-[#F8F8F8] rounded-full px-2 py-1">
        <input
          v-model="inputValue"
          type="text"
          confirm-type="send"
          placeholder="输入食材或菜名（如：番茄）"
          placeholder-class="text-gray-400 text-sm"
          class="flex-1 h-9 px-4 py-1 text-sm text-[#2F5233]"
          @confirm="handleSend"
        />
        <view
          class="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          :class="inputValue.trim() ? 'bg-[#F08800]' : 'bg-gray-300'"
          @click="handleSend"
        >
          <text class="text-white text-sm font-bold">↑</text>
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
</style>
