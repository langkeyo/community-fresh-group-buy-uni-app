export interface ProductItem {
  id: number
  name: string
  category: string
  price: number
  groupPrice2: number | null
  groupPrice3: number | null
  stock: number
  images: string[]
  status: number
}
