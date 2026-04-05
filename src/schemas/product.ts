import { z } from 'zod'

export const productItemSchema = z.object({
  id: z.number(),
  name: z.string()
})

export const productListSchema = z.array(productItemSchema)
