import { getProductDetailApi, getProductListApi } from '@/api/product'
import { productItemSchema, productListSchema } from '@/schemas/product'
import type { ProductItem } from '@/types/product'

export async function getProductList(
  keyword?: string
): Promise<ProductItem[]> {
  const res = await getProductListApi(keyword)
  const list = res.data ?? []
  const parsed = productListSchema.safeParse(list)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw new Error(
      `商品列表数据格式异常: ${issue?.path?.join('.') || 'unknown'}`
    )
  }
  return parsed.data
}

export async function getProductDetail(
  id: number
): Promise<ProductItem | undefined> {
  const res = await getProductDetailApi(id)
  if (!res.data) return undefined
  const parsed = productItemSchema.safeParse(res.data)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw new Error(
      `商品详情数据格式异常: ${issue?.path?.join('.') || 'unknown'}`
    )
  }
  return parsed.data
}
