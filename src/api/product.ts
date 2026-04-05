import type { Result } from '@/types/response'
import http from '@/utils/request'

export interface ProductItemResp {
  id: number
  name: string
  category: string
  price: number | string
  groupPrice2?: number | string | null
  groupPrice3?: number | string | null
  stock?: number | string
  images?: string
  status?: number | string
}

export const getProductListApi = (keyword?: string) => {
  return http.get<Result<ProductItemResp[]>>('/api/product/list', {
    params: { keyword }
  }) as unknown as Promise<Result<ProductItemResp[]>>
}

export const getProductDetailApi = (id: number) => {
  return http.get<Result<ProductItemResp>>(
    `/api/product/${id}`
  ) as unknown as Promise<Result<ProductItemResp>>
}
