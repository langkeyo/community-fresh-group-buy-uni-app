import { recommendAiApi } from '@/api/ai'
import { aiRecommendSchema } from '@/schemas/ai'
import type { AiRecipeCard } from '@/types/ai'

export async function getAiRecipeRecommend(
  query: string
): Promise<AiRecipeCard> {
  const res = await recommendAiApi(query)
  const parsed = aiRecommendSchema.safeParse(res.data)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw new Error(
      `AI推荐数据格式异常: ${issue?.path?.join('.') || 'unknown'}`
    )
  }

  const data = parsed.data
  if (!data.recipe) {
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
