import { getPickPointDetailApi, getPickPointListApi } from '@/api/pick-point'
import { pickPointItemSchema, pickPointListSchema } from '@/schemas/pick-point'
import type { PickPointItem } from '@/types/pick-point'

export async function getPickPointList(
  keyword?: string
): Promise<PickPointItem[]> {
  const res = await getPickPointListApi(keyword)
  const list = res.data ?? []
  const parsed = pickPointListSchema.safeParse(list)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw new Error(
      `自提点列表数据格式异常: ${issue?.path?.join('.') || 'unknown'}`
    )
  }
  return parsed.data
}

export async function getPickPointDetail(
  id: number
): Promise<PickPointItem | undefined> {
  const res = await getPickPointDetailApi(id)
  if (!res.data) return undefined
  const parsed = pickPointItemSchema.safeParse(res.data)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw new Error(
      `自提点数据格式异常: ${issue?.path?.join('.') || 'unknown'}`
    )
  }
  return parsed.data
}
