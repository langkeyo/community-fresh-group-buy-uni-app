import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const ORDER_META_KEY = 'order_meta_map_v1'

export interface CouponOption {
  id: string
  title: string
  discount: number
  minimumSpend: number
}

export interface OrderExtraMeta {
  remark?: string
  couponId?: string
  couponTitle?: string
  couponAmount?: string
}

type OrderMetaMap = Record<string, OrderExtraMeta>

function safeParseMetaMap(raw: unknown): OrderMetaMap {
  if (!raw) return {}
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as OrderMetaMap
  } catch {
    return {}
  }
}

const defaultCoupons: CouponOption[] = [
  { id: 'none', title: '不使用优惠券', discount: 0, minimumSpend: 0 }
]

export const useOrderStore = defineStore('order', () => {
  const couponList = ref<CouponOption[]>(defaultCoupons)
  const orderMetaMap = ref<OrderMetaMap>(safeParseMetaMap(uni.getStorageSync(ORDER_META_KEY)))

  const couponMap = computed(() => {
    return new Map(couponList.value.map((item) => [item.id, item]))
  })

  function getCouponById(id: string) {
    return couponMap.value.get(id)
  }

  function setCouponList(list: CouponOption[]) {
    const merged = [
      { id: 'none', title: '不使用优惠券', discount: 0, minimumSpend: 0 },
      ...list.filter((item) => item.id !== 'none')
    ]
    couponList.value = merged
  }

  function saveOrderMeta(orderId: string, meta: OrderExtraMeta) {
    if (!orderId) return
    orderMetaMap.value[orderId] = meta
    uni.setStorageSync(ORDER_META_KEY, orderMetaMap.value)
  }

  function getOrderMeta(orderId: string): OrderExtraMeta | null {
    if (!orderId) return null
    return orderMetaMap.value[orderId] || null
  }

  return {
    couponList,
    setCouponList,
    getCouponById,
    saveOrderMeta,
    getOrderMeta
  }
})
