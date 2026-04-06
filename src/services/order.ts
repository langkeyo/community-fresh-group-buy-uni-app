import {
  createOrderApi,
  getLeaderWorkbenchApi,
  getOpenGroupListApi,
  getOrderDetailApi,
  getOrderListApi,
  getLeaderOrderListApi,
  leaderConfirmPickApi,
  updateStatusApi,
  type BackendOrderItem,
  type CreateOrderReq
  ,
  type LeaderWorkbenchResp,
  type OpenGroupItem
} from '@/api/order'
import { backendOrderItemSchema, backendOrderListSchema, leaderWorkbenchSchema } from '@/schemas/order'
import type { LeaderWorkbench, OrderInfo } from '@/types/order'

function normalizeOrderStatus(status: number): OrderInfo['status'] {
  if (status === 1 || status === 2 || status === 3 || status === -1)
    return status
  else return -1
}

function mapBackendOrderToOrderInfo(item: BackendOrderItem): OrderInfo {
  return {
    id: item.id,
    no: item.no,
    productId: (item as any).productId,
    name: item.name,
    qty: item.qty,
    price: item.price,
    pickPointName: item.pickPointName,
    pickPointAddress: item.pickPointAddress,
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

export async function createOrder(payload: CreateOrderReq): Promise<string> {
  const res = await createOrderApi(payload)
  return res.data || ''
}

export async function updateStatus(
  orderId: string | number,
  status: number
): Promise<string> {
  const res = await updateStatusApi(orderId, status)
  return res.data
}

export async function getLeaderOrderList(
  leaderId: number,
  pickPointId: number,
  status?: number
): Promise<OrderInfo[]> {
  const res = await getLeaderOrderListApi(leaderId, pickPointId, status)
  const list = res.data ?? []
  const parsed = backendOrderListSchema.safeParse(list)
  if (!parsed?.success) {
    const issue = parsed.error.issues[0]
    throw new Error(
      `团长订单数据格式异常: ${issue?.path?.join('.') || 'unknown'}`
    )
  }
  return parsed.data.map(mapBackendOrderToOrderInfo)
}

export async function leaderConfirmPick(
  orderId: string | number,
  leaderId: number,
  pickPointId: number
): Promise<string> {
  const res = await leaderConfirmPickApi(orderId, leaderId, pickPointId)
  return res.data
}

export async function getOpenGroupList(
  productId: number,
  pickPointId: number
): Promise<OpenGroupItem[]> {
  const res = await getOpenGroupListApi(productId, pickPointId)
  return res.data ?? []
}

function mapLeaderWorkbench(resp: LeaderWorkbenchResp): LeaderWorkbench {
  const parsed = leaderWorkbenchSchema.safeParse(resp)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw new Error(
      `团长工作台数据格式异常: ${issue?.path?.join('.') || 'unknown'}`
    )
  }
  return {
    pendingCount: parsed.data.pendingCount,
    pickedTodayCount: parsed.data.pickedTodayCount,
    pendingOrders: parsed.data.pendingOrders.map(mapBackendOrderToOrderInfo),
    recentPickedOrders: parsed.data.recentPickedOrders.map(
      mapBackendOrderToOrderInfo
    )
  }
}

export async function getLeaderWorkbench(
  leaderId: number,
  pickPointId: number
): Promise<LeaderWorkbench> {
  const res = await getLeaderWorkbenchApi(leaderId, pickPointId)
  return mapLeaderWorkbench(res.data ?? ({} as LeaderWorkbenchResp))
}
