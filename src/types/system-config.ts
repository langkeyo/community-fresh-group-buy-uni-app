export interface SystemConfig {
  noticeText: string
  servicePhone: string
  serviceWechat: string
  serviceHours: string
  serviceTerms: string
  recommendMenus: RecommendMenuItem[]
  homeBanners: HomeBannerItem[]
  tencentMapKey: string
  aiAssistantEnabled: boolean
  aiAssistantApiKey: string
  aiAssistantLeaderPrompt: string
  aiQuickPrompts: string[]
}

export interface RecommendMenuItem {
  name: string
  value: string
  bg: string
  color: string
  icon: string
  iconColor: string
  enabled: boolean
  sort: number
}

export interface HomeBannerItem {
  title: string
  imageUrl: string
  productId: number
  enabled: boolean
  sort: number
  badgeText?: string
}
