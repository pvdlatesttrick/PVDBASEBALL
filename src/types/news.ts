export type NewsCategory = 'injury' | 'transaction' | 'news' | 'prospect' | 'roster'

export type NewsImpact = 'high' | 'medium' | 'low'

export type NewsItem = {
  id: string
  headline: string
  summary: string
  source: string
  category: NewsCategory
  playerName: string | null
  team: string | null
  publishedAt: Date
  url: string
  isRead: boolean
  impact: NewsImpact
}
