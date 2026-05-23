import http from '@/utils/request'
import type { Result } from '@/types/response'

export interface ProductReviewItem {
  id: number
  productId: number
  userId: number
  userNickname: string
  content: string
  rating: number
  createTime?: string
}

export interface ProductReviewCreateReq {
  orderId?: string
  productId: number
  content: string
  rating?: number
}

export const getProductReviewListApi = (productId: number, limit = 10) =>
  http.get<Result<ProductReviewItem[]>>(`/api/review/product/${productId}`, { params: { limit } })

export const createProductReviewApi = (payload: ProductReviewCreateReq) =>
  http.post<Result<string>>('/api/review/create', payload)

export const canCreateProductReviewApi = (productId: number, orderId?: string) =>
  http.get<Result<boolean>>('/api/review/can-create', { params: { productId, orderId } })
