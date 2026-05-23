import { getSystemConfigApi } from '@/api/system-config'
import { systemConfigSchema } from '@/schemas/system-config'
import type {
  HomeBannerItem,
  RecommendMenuItem,
  SystemConfig
} from '@/types/system-config'

const defaultRecommendMenus: RecommendMenuItem[] = [
  {
    name: '蔬菜',
    value: 'vegetable',
    bg: 'bg-green-100',
    color: 'text-green-600',
    icon: 'fire-filled',
    iconColor: '#16a34a',
    enabled: true,
    sort: 1
  },
  {
    name: '水果',
    value: 'fruit',
    bg: 'bg-red-100',
    color: 'text-red-600',
    icon: 'gift-filled',
    iconColor: '#dc2626',
    enabled: true,
    sort: 2
  },
  {
    name: '肉蛋',
    value: 'meat',
    bg: 'bg-orange-100',
    color: 'text-orange-600',
    icon: 'cart-filled',
    iconColor: '#ea580c',
    enabled: true,
    sort: 3
  },
  {
    name: '海鲜',
    value: 'seafood',
    bg: 'bg-blue-100',
    color: 'text-blue-600',
    icon: 'flag-filled',
    iconColor: '#2563eb',
    enabled: true,
    sort: 4
  }
]

const fallbackConfig: SystemConfig = {
  noticeText: '欢迎来到社区团购，今天也有新鲜直供好货。',
  servicePhone: '400-800-1234',
  serviceWechat: 'ligo-service',
  serviceHours: '09:00-22:00',
  serviceTerms: '服务条款：当前版本为毕业设计演示环境，支付流程为模拟链路。',
  recommendMenus: defaultRecommendMenus,
  homeBanners: [],
  tencentMapKey: '',
  aiAssistantEnabled: true,
  aiAssistantApiKey: '',
  aiAssistantLeaderPrompt:
    '你是社区生鲜团购的AI客服，请优先推荐平台在售商品，回答简洁、可执行。',
  aiQuickPrompts: ['怎么做减脂餐？', '冰箱里只有两个鸡蛋', '鸡胸肉怎么做不柴？']
}

function normalizeMenus(raw: RecommendMenuItem[]): RecommendMenuItem[] {
  const list = (raw || [])
    .filter((item) => item.enabled !== false && item.name && item.value)
    .sort((a, b) => (a.sort || 999) - (b.sort || 999))
  return list.length ? list : defaultRecommendMenus
}

function normalizeHomeBanners(raw: HomeBannerItem[]): HomeBannerItem[] {
  return (raw || [])
    .filter((item) => item.enabled !== false && Number(item.productId) > 0)
    .sort((a, b) => (a.sort || 999) - (b.sort || 999))
}

export async function getSystemConfig(): Promise<SystemConfig> {
  try {
    const res = await getSystemConfigApi()
    const parsed = systemConfigSchema.safeParse(res.data ?? {})
    if (!parsed.success) {
      return fallbackConfig
    }
    const quickPrompts = (parsed.data.extendedSettings?.aiAssistant?.quickPrompts || [])
      .map((x) => String(x || '').trim())
      .filter(Boolean)
      .slice(0, 3)
    return {
      ...fallbackConfig,
      ...parsed.data,
      recommendMenus: normalizeMenus(parsed.data.recommendMenus || []),
      homeBanners: normalizeHomeBanners(
        parsed.data.extendedSettings?.homeBanners || []
      ),
      tencentMapKey:
        parsed.data.extendedSettings?.apiWebhook?.tencentMapKey?.trim() || '',
      aiAssistantEnabled:
        parsed.data.extendedSettings?.aiAssistant?.enabled !== false,
      aiAssistantApiKey:
        parsed.data.extendedSettings?.aiAssistant?.apiKey?.trim() || '',
      aiAssistantLeaderPrompt:
        parsed.data.extendedSettings?.aiAssistant?.leaderPrompt?.trim() ||
        fallbackConfig.aiAssistantLeaderPrompt,
      aiQuickPrompts: quickPrompts.length ? quickPrompts : fallbackConfig.aiQuickPrompts
    }
  } catch (error) {
    return fallbackConfig
  }
}
