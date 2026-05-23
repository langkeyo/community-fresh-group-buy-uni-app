import { z } from 'zod'

export const backendOrderItemSchema = z.object({
  id: z.string(),
  no: z.string(),
  userId: z.coerce.number().optional(),
  productId: z.coerce.number().optional(),
  pickPointId: z.coerce.number().optional(),
  leaderUserId: z.coerce.number().optional(),
  name: z.string(),
  qty: z.number(),
  price: z.string(),
  couponId: z.string().optional(),
  couponTitle: z.string().optional(),
  couponAmount: z.string().optional(),
  remark: z.string().optional(),
  pickPointName: z.string(),
  pickPointAddress: z.string(),
  status: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(-1)]),
  createTime: z.string()
})

export const backendOrderListSchema = z.array(backendOrderItemSchema)

export const leaderWorkbenchSchema = z.object({
  pendingCount: z.coerce.number().default(0),
  pickedTodayCount: z.coerce.number().default(0),
  pendingOrders: z.array(backendOrderItemSchema).default([]),
  recentPickedOrders: z.array(backendOrderItemSchema).default([])
})

export type BackendOrderItemSchema = z.infer<typeof backendOrderItemSchema>
