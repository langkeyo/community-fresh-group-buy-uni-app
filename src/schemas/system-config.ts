import { z } from 'zod'

export const systemConfigSchema = z.object({
  noticeText: z.string().default(''),
  servicePhone: z.string().default(''),
  serviceWechat: z.string().default(''),
  serviceHours: z.string().default(''),
  serviceTerms: z.string().default('')
})
