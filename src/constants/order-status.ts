export type OrderStatus = 0 | 1 | 2 | 3 | 4 | -1

export const ORDER_STATUS_MAP: Record<
  number,
  { textClass: string; bgClass: string; label: string }
> = {
  0: {
    textClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    label: '待支付(演示)'
  },
  1: {
    textClass: 'text-orange-600',
    bgClass: 'bg-orange-50',
    label: '待成团'
  },
  2: {
    textClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    label: '待提货'
  },
  4: {
    textClass: 'text-cyan-700',
    bgClass: 'bg-cyan-50',
    label: '待确认收货'
  },
  3: {
    textClass: 'text-green-600',
    bgClass: 'bg-green-50',
    label: '已完成'
  },
  [-1]: { textClass: 'text-gray-600', bgClass: 'bg-gray-100', label: '已取消' }
}

export const ORDER_STATUS_FALLBACK = {
  textClass: 'text-gray-600',
  bgClass: 'bg-gray-100',
  label: '未知状态'
}
