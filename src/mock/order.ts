import type { OrderInfo } from '@/types/order'

export const MOCK_ORDER_LIST: OrderInfo[] = [
  {
    id: '1',
    no: 'A20260210',
    name: '本地有机番茄 500g',
    qty: 1,
    price: '4.99',
    pickPointName: '社区东门自提点',
    pickPointAddress: '幸福路 88 号',
    status: 1,
    createTime: '2026-02-10 10:00:00'
  },
  {
    id: '2',
    no: 'A20260211',
    name: '进口香蕉 1kg',
    qty: 2,
    price: '9.90',
    pickPointName: '社区东门自提点',
    pickPointAddress: '幸福路 88 号',
    status: 2,
    createTime: '2026-02-11 11:20:00'
  }
]
