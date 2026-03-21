import {
  getOrderDetailApi,
  getOrderListApi,
  type BackendOrderItem
} from '@/api/order'
import { backendOrderItemSchema, backendOrderListSchema } from '@/schemas/order'
import type { OrderInfo } from '@/types/order'

function normalizeOrderStatus(status: number): OrderInfo['status'] {
  if (status === 1 || status === 2 || status === 3 || status === -1)
    return status
  else return -1
}

function mapBackendOrderToOrderInfo(item: BackendOrderItem): OrderInfo {
  return {
    id: item.id,
    no: item.no,
    name: item.name,
    qty: item.qty,
    price: item.price,
    status: normalizeOrderStatus(item.status),
    createTime: item.createTime || ''
  }
}

export async function getOrderList(userId: number): Promise<OrderInfo[]> {
  const res = await getOrderListApi(userId)
  const list = res.data ?? []

  const parsed = backendOrderListSchema.safeParse(list)
  if (!parsed?.success) {
    const issue = parsed.error.issues[0]
    throw new Error(
      `订单列表数据格式异常: ${issue?.path?.join('.') || 'unknown'}`
    )
  }

  return parsed.data.map(mapBackendOrderToOrderInfo)
}

export async function getOrderDetail(
  id: string,
  _userId: number
): Promise<OrderInfo | undefined> {
  const res = await getOrderDetailApi(id)
  if (!res.data) return undefined

  const parsed = backendOrderItemSchema.safeParse(res.data)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw new Error(
      `订单详情数据格式异常: ${issue?.path?.join('.') || 'unknown'}`
    )
  }

  return mapBackendOrderToOrderInfo(parsed.data)
}
