import type { Result } from '@/types/response'
import http from '@/utils/request'

export interface BackendOrderItem {
  id: string
  no: string
  groupBuyId?: string
  userId?: number
  productId?: number
  pickPointId?: number
  leaderUserId?: number
  name: string
  qty: number
  price: string
  couponId?: string
  couponTitle?: string
  couponAmount?: string
  remark?: string
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
  couponId?: string
  couponTitle?: string
  couponAmount?: number
  remark?: string
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

export interface OpenGroupItem {
  groupBuyId: string
  creatorUserId?: number
  currentCount: number
  targetCount: number
  latestCreateTime: string
}

export interface LeaderWorkbenchResp {
  pendingCount: number
  pickedTodayCount: number
  pendingOrders: BackendOrderItem[]
  recentPickedOrders: BackendOrderItem[]
}

export const getLeaderOrderListApi = (
  leaderId: number,
  pickPointId: number,
  status?: number
) => {
  return http.get<Result<BackendOrderItem[]>>('/api/order/leader/list', {
    params: { leaderId, pickPointId, status }
  }) as unknown as Promise<Result<BackendOrderItem[]>>
}

export const leaderConfirmPickApi = (
  orderId: string | number,
  leaderId: number,
  pickPointId: number
) => {
  return http.put<Result<string>>(
    `/api/order/leader/confirm/${orderId}?leaderId=${leaderId}&pickPointId=${pickPointId}`
  ) as unknown as Promise<Result<string>>
}

export const getLeaderWorkbenchApi = (leaderId: number, pickPointId: number) => {
  return http.get<Result<LeaderWorkbenchResp>>('/api/order/leader/workbench', {
    params: { leaderId, pickPointId },
    custom: { silentError: true }
  }) as unknown as Promise<Result<LeaderWorkbenchResp>>
}

export const getOpenGroupListApi = (
  productId: number,
  pickPointId: number
) => {
  return http.get<Result<OpenGroupItem[]>>('/api/order/group/open', {
    params: { productId, pickPointId }
  }) as unknown as Promise<Result<OpenGroupItem[]>>
}
