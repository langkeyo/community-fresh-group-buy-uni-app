import type { Result } from '@/types/response'
import http from '@/utils/request'

export interface SystemConfigResp {
  noticeText: string
  servicePhone: string
  serviceWechat: string
  serviceHours: string
  serviceTerms: string
}

export const getSystemConfigApi = () => {
  return http.get<Result<SystemConfigResp>>(
    '/api/system/config'
  ) as unknown as Promise<Result<SystemConfigResp>>
}
