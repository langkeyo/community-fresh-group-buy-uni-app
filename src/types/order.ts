import type { OrderStatus } from '@/constants/order-status'

export interface OrderInfo {
  id: string
  no: string
  productId?: number
  name: string
  qty: number
  price: string
  pickPointName: string
  pickPointAddress: string
  status: OrderStatus
  createTime: string
}
