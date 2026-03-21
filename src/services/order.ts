import {
  getOrderDetailApi,
  getOrderListApi,
  type BackendOrderItem
} from '@/api/order'
import type { OrderInfo } from '@/types/order'

function normalizeOrderStatus(status: number): OrderInfo['status'] {
  if (status === 1 || status === 2 || status === 3 || status === -1)
    return status
  else return -1
}

function mapBackendOrderToOrderInfo(item: BackendOrderItem): OrderInfo {
  return {
    id: Number(item.id),
    no: item.no,
    name: item.name,
    qty: item.qty,
    price: item.price,
    status: normalizeOrderStatus(item.status)
  }
}

export async function getOrderList(userId: number): Promise<OrderInfo[]> {
  const res = await getOrderListApi(userId)
  const list = res.data ?? []
  return list.map(mapBackendOrderToOrderInfo)
}

export async function getOrderDetail(
  id: number,
  _userId: number
): Promise<OrderInfo | undefined> {
  const res = await getOrderDetailApi(id)
  if (!res.data) return undefined
  return mapBackendOrderToOrderInfo(res.data)
}
