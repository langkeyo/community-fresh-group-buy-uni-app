import type { OrderStatus } from '@/constants/order-status'

export interface OrderInfo {
  id: string
  no: string
  name: string
  qty: number
  price: string
  status: OrderStatus
}
