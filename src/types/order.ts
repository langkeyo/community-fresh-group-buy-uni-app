import type { OrderStatus } from '@/constants/order-status'

export interface OrderInfo {
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
  status: OrderStatus
  isReviewed?: number
  createTime: string
}

export interface LeaderWorkbench {
  pendingCount: number
  pickedTodayCount: number
  pendingOrders: OrderInfo[]
  recentPickedOrders: OrderInfo[]
}
