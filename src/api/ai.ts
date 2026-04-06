import type { Result } from '@/types/response'
import http from '@/utils/request'

export interface AiRecipeStepResp {
  step: number
  content: string
}

export interface AiRecipeIngredientResp {
  name: string
  amount: string
  unit: string
}

export interface AiRecipeResp {
  title: string
  desc: string
  tags: string[]
  image: string
  ingredients: AiRecipeIngredientResp[]
  steps: AiRecipeStepResp[]
}

export interface AiRecommendResp {
  source: 'DB' | 'AI'
  disclaimer: string
  recipe: AiRecipeResp
}

export const recommendAiApi = (query: string) => {
  return http.post<Result<AiRecommendResp>>(
    '/api/ai/recommend',
    {},
    {
      params: { query },
      timeout: 45000
    }
  ) as unknown as Promise<Result<AiRecommendResp>>
}
