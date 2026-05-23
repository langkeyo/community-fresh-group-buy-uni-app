import type { Result } from '@/types/response'
import http from '@/utils/request'

export interface SystemConfigResp {
  noticeText: string
  servicePhone: string
  serviceWechat: string
  serviceHours: string
  serviceTerms: string
  recommendMenus: {
    name: string
    value: string
    bg: string
    color: string
    icon: string
    iconColor: string
    enabled: boolean
    sort: number
  }[]
  extendedSettings?: {
    homeBanners?: {
      title: string
      imageUrl: string
      productId: number
      enabled: boolean
      sort: number
      badgeText?: string
    }[]
    aiAssistant?: {
      enabled?: boolean
      apiKey?: string
      leaderPrompt?: string
      quickPrompts?: string[]
    }
  }
}

export const getSystemConfigApi = () => {
  return http.get<Result<SystemConfigResp>>(
    '/api/system/config'
  ) as unknown as Promise<Result<SystemConfigResp>>
}
