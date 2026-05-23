import type { Result } from '@/types/response'
import http from '@/utils/request'

export interface BackendCouponItem {
  code: string
  title: string
  discountAmount: number | string
  minimumSpend: number | string
}

export const getEnabledCouponListApi = () => {
  return http.get<Result<BackendCouponItem[]>>(
    '/api/coupon/enabled'
  ) as unknown as Promise<Result<BackendCouponItem[]>>
}

