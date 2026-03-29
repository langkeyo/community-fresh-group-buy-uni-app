import type { Result } from '@/types/response'
import http from '@/utils/request'

export interface AiRecipeStepResp {
  step: number
  content: string
}

export interface AiRecipeResp {
  title: string
  desc: string
  tags: string[]
  image: string
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
    { params: { query } }
  ) as unknown as Promise<Result<AiRecommendResp>>
}
