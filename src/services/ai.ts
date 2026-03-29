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
    throw new Error('AI推荐结果为空')
  }

  return {
    id: Date.now(),
    title: data.recipe.title,
    desc: data.recipe.desc,
    tags: data.recipe.tags || [],
    image: data.recipe.image,
    steps: data.recipe.steps || [],
    source: data.source,
    disclaimer: data.disclaimer || ''
  }
}
