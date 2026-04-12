import { z } from 'zod'

const recommendMenuItemSchema = z.object({
  name: z.string().default(''),
  value: z.string().default(''),
  bg: z.string().default('bg-orange-100'),
  color: z.string().default('text-orange-600'),
  icon: z.string().default('fire-filled'),
  iconColor: z.string().default('#F08800'),
  enabled: z.boolean().default(true),
  sort: z.coerce.number().default(999)
})

export const systemConfigSchema = z.object({
  noticeText: z.string().default(''),
  servicePhone: z.string().default(''),
  serviceWechat: z.string().default(''),
  serviceHours: z.string().default(''),
  serviceTerms: z.string().default(''),
  recommendMenus: z.array(recommendMenuItemSchema).default([])
})
