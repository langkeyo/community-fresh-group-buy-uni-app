import { z } from 'zod'

export const pickPointItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional()
})

export const pickPointListSchema = z.array(pickPointItemSchema)
