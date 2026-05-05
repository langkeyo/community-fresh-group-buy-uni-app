import { getNoticeListApi, readNoticeApi } from '@/api/notice'
import type { NoticeItem } from '@/types/notice'

export async function getNoticeList(userId: number): Promise<NoticeItem[]> {
  const res = await getNoticeListApi(userId)
  return res.data || []
}

export async function markNoticeRead(
  noticeId: number,
  userId: number
): Promise<void> {
  await readNoticeApi(noticeId, userId)
}

