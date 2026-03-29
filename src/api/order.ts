import type { Result } from '@/types/response'
import http from '@/utils/request'

export interface BackendOrderItem {
  id: string
  no: string
  name: string
  qty: number
  price: string
  pickPointName: string
  pickPointAddress: string
  status: number
  createTime: string
}

export interface CreateOrderReq {
  userId: number
  productId: number
  totalPrice: number
  pickPointId: number
  groupBuyId?: string | null
}

export const createOrderApi = (data: CreateOrderReq) => {
  return http.post<Result<string>>(
    '/api/order/create',
    data
  ) as unknown as Promise<Result<string>>
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

export const updateStatusApi = (orderId: number | string, status: number) => {
  return http.put<Result<string>>(
    `/api/order/updateStatus/${orderId}?status=${status}`
  ) as unknown as Promise<Result<string>>
}
