import type { Result } from '@/types/response'
import http from '@/utils/request'

export interface ProductItemResp {
  id: number
  name: string
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
