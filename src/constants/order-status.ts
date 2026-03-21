export type OrderStatus = 1 | 2 | 3 | -1

export const ORDER_STATUS_MAP: Record<
  number,
  { textClass: string; bgClass: string; label: string }
> = {
  1: {
    textClass: 'text-orange-600',
    bgClass: 'bg-orange-50',
    label: '待成团'
  },
  2: {
    textClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    label: '已成团'
  },
  3: {
    textClass: 'text-green-600',
    bgClass: 'bg-green-50',
    label: '已取货'
  },
  [-1]: { textClass: 'text-gray-600', bgClass: 'bg-gray-100', label: '已取消' }
}

export const ORDER_STATUS_FALLBACK = {
  textClass: 'text-gray-600',
  bgClass: 'bg-gray-100',
  label: '未知状态'
}
