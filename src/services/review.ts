import {
  canCreateProductReviewApi,
  createProductReviewApi,
  getProductReviewListApi,
  type ProductReviewCreateReq,
  type ProductReviewItem
} from '@/api/review'

export async function getProductReviewList(productId: number, limit = 10): Promise<ProductReviewItem[]> {
  const res = await getProductReviewListApi(productId, limit)
  return Array.isArray(res.data) ? res.data : []
}

export async function createProductReview(payload: ProductReviewCreateReq): Promise<void> {
  const res = await createProductReviewApi(payload)
  const nested = (res as any)?.data
  const hasNestedCode = nested && typeof nested === 'object' && 'code' in nested
  const code = hasNestedCode ? nested.code : (res as any)?.code
  const message = hasNestedCode ? nested.message : (res as any)?.message
  if (code !== 200 && code !== 0) {
    throw new Error(message || '评论提交失败')
  }
}

export async function canCreateProductReview(productId: number, orderId?: string): Promise<boolean> {
  const res = await canCreateProductReviewApi(productId, orderId)
  return Boolean(res.data)
}
