import type { Result } from '@/types/response'
import http from '@/utils/request'

export interface PickPointItemResp {
  id: number
  name: string
  address: string
}

export const getPickPointListApi = (keyword?: string) => {
  return http.get<Result<PickPointItemResp[]>>('/api/pick-point/list', {
    params: { keyword }
  }) as unknown as Promise<Result<PickPointItemResp[]>>
}

export const getPickPointDetailApi = (id: number) => {
  return http.get<Result<PickPointItemResp>>(
    `/api/pick-point/${id}`
  ) as unknown as Promise<Result<PickPointItemResp>>
}
