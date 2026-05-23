import type { Result } from '@/types/response'
import http from '@/utils/request'

export interface GroupBuyCampaignResp {
  id: number
  title: string
  productId: number
  pickPointId?: number | null
  groupTarget: number
  startTime: string
  endTime: string
  status: number
}

export const getActiveGroupBuyCampaignListApi = (params: {
  productId?: number
  pickPointId?: number
}) => {
  return http.get<Result<GroupBuyCampaignResp[]>>('/api/group-buy/list', {
    params
  }) as unknown as Promise<Result<GroupBuyCampaignResp[]>>
}
