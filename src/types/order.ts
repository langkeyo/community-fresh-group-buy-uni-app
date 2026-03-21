import type { OrderStatus } from '@/constants/order-status'

export interface OrderInfo {
  id: number
  no: string
  name: string
  qty: number
  price: string
  status: OrderStatus
}
