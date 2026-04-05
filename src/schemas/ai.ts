import { z } from 'zod'

export const aiRecipeStepSchema = z.object({
  step: z.number(),
  content: z.string()
})

export const aiRecipeSchema = z.object({
  title: z.string().optional(),
  desc: z.string().optional(),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
  steps: z.array(aiRecipeStepSchema).optional()
})

export const aiRecommendSchema = z.object({
  source: z.enum(['DB', 'AI']),
  disclaimer: z.string().optional(),
  recipe: aiRecipeSchema.optional()
})
