import type { NoticeItem } from '@/types/notice'
import type { Result } from '@/types/response'
import http from '@/utils/request'

export const getNoticeListApi = (userId: number) => {
  return http.get<Result<NoticeItem[]>>('/api/notice/list', {
    params: { userId }
  }) as unknown as Promise<Result<NoticeItem[]>>
}

export const readNoticeApi = (id: number, userId: number) => {
  return http.put<Result<string>>(`/api/notice/read/${id}`, undefined, {
    params: { userId }
  }) as unknown as Promise<Result<string>>
}
