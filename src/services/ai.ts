import { recommendAiApi } from '@/api/ai'

export interface AiRecipeStep {
  step: number
  content: string
}

export interface AiRecipeCard {
  id: number
  title: string
  tags: string[]
  image: string
  desc: string
  steps: AiRecipeStep[]
  source: 'DB' | 'AI'
  disclaimer: string
}

export async function getAiRecipeRecommend(
  query: string
): Promise<AiRecipeCard> {
  const res = await recommendAiApi(query)
  const data = res.data
  if (!data?.recipe) {
    throw new Error('EMPTY_RESULT')
  }
  const hasTitle = Boolean(data.recipe.title)
  const hasSteps = Array.isArray(data.recipe.steps) && data.recipe.steps.length > 0
  if (!hasTitle && !hasSteps) {
    throw new Error('EMPTY_RESULT')
  }

  return {
    id: Date.now(),
    title: data.recipe.title || '未命名菜谱',
    desc: data.recipe.desc || '暂无描述',
    tags: data.recipe.tags || [],
    image: data.recipe.image || '',
    steps: data.recipe.steps || [],
    source: data.source,
    disclaimer: data.disclaimer || ''
  }
}
