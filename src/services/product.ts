import { getProductDetailApi, getProductListApi } from '@/api/product'
import { productItemSchema, productListSchema } from '@/schemas/product'
import type { ProductItem } from '@/types/product'

const parseImages = (raw?: string) => {
  if (!raw) return []
  const text = String(raw).trim()
  if (!text) return []
  if (text.startsWith('[')) {
    try {
      const data = JSON.parse(text)
      return Array.isArray(data) ? data.filter(Boolean) : []
    } catch (error) {
      return []
    }
  }
  return [text]
}

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
  return parsed.data.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    groupPrice2: item.groupPrice2,
    groupPrice3: item.groupPrice3,
    stock: item.stock,
    images: parseImages(item.images),
    status: item.status
  }))
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
  return {
    id: parsed.data.id,
    name: parsed.data.name,
    category: parsed.data.category,
    price: parsed.data.price,
    groupPrice2: parsed.data.groupPrice2,
    groupPrice3: parsed.data.groupPrice3,
    stock: parsed.data.stock,
    images: parseImages(parsed.data.images),
    status: parsed.data.status
  }
}
