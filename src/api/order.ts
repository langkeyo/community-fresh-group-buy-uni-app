import type { Result } from '@/types/response'
import http from '@/utils/request'

export interface BackendOrderItem {
  id: string
  no: string
  name: string
  qty: number
  price: string
  status: number
}

export const getOrderListApi = (userId: number) => {
  return http.get<Result<BackendOrderItem[]>>(
    `/api/order/list/${userId}`
  ) as unknown as Promise<Result<BackendOrderItem[]>>
}

export const getOrderDetailApi = (orderId: number | string) => {
  return http.get<Result<BackendOrderItem>>(
    `/api/order/${orderId}`
  ) as unknown as Promise<Result<BackendOrderItem>>
}
