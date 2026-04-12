import { getSystemConfigApi } from '@/api/system-config'
import { systemConfigSchema } from '@/schemas/system-config'
import type { RecommendMenuItem, SystemConfig } from '@/types/system-config'

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
  recommendMenus: defaultRecommendMenus
}

function normalizeMenus(raw: RecommendMenuItem[]): RecommendMenuItem[] {
  const list = (raw || [])
    .filter((item) => item.enabled !== false && item.name && item.value)
    .sort((a, b) => (a.sort || 999) - (b.sort || 999))
  return list.length ? list : defaultRecommendMenus
}

export async function getSystemConfig(): Promise<SystemConfig> {
  try {
    const res = await getSystemConfigApi()
    const parsed = systemConfigSchema.safeParse(res.data ?? {})
    if (!parsed.success) {
      return fallbackConfig
    }
    return {
      ...fallbackConfig,
      ...parsed.data,
      recommendMenus: normalizeMenus(parsed.data.recommendMenus || [])
    }
  } catch (error) {
    return fallbackConfig
  }
}
