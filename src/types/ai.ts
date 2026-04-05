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

export interface FavoriteItem {
  title: string
  desc: string
  tags: string[]
  image: string
  steps: AiRecipeStep[]
  source: 'DB' | 'AI'
  disclaimer: string
}

export type AiRecipeHistoryItem = AiRecipeCard & {
  isCollected: boolean
  timestamp: string
}
