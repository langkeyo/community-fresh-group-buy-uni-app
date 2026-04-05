import { z } from 'zod'

export const pickPointItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string()
})

export const pickPointListSchema = z.array(pickPointItemSchema)
