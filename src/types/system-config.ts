export interface SystemConfig {
  noticeText: string
  servicePhone: string
  serviceWechat: string
  serviceHours: string
  serviceTerms: string
  recommendMenus: RecommendMenuItem[]
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
