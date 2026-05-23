import { getEnabledCouponListApi } from '@/api/coupon'
import type { CouponOption } from '@/stores/order'

export async function getEnabledCoupons(): Promise<CouponOption[]> {
  const res = await getEnabledCouponListApi()
  const list = res.data ?? []
  return list
    .filter((item) => item?.code && item?.title)
    .map((item) => ({
      id: item.code,
      title: item.title,
      discount: Number(item.discountAmount || 0),
      minimumSpend: Number(item.minimumSpend || 0)
    }))
}

