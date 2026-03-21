import { z } from 'zod'

export const backendOrderItemSchema = z.object({
  id: z.string(),
  no: z.string(),
  name: z.string(),
  qty: z.number(),
  price: z.string(),
  pickPointName: z.string(),
  pickPointAddress: z.string(),
  status: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(-1)]),
  createTime: z.string()
})

export const backendOrderListSchema = z.array(backendOrderItemSchema)

export type BackendOrderItemSchema = z.infer<typeof backendOrderItemSchema>
