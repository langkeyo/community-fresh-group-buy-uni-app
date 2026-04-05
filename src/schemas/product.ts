import { z } from 'zod'

const numberOrNull = z
  .union([z.number(), z.string(), z.null()])
  .transform((value) => {
    if (value === null || value === '') return null
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  })

export const productItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string().optional().default(''),
  price: z.coerce.number(),
  groupPrice2: numberOrNull.optional().default(null),
  groupPrice3: numberOrNull.optional().default(null),
  stock: z.coerce.number().optional().default(0),
  images: z.string().optional().default(''),
  status: z.coerce.number().optional().default(1)
})

export const productListSchema = z.array(productItemSchema)
