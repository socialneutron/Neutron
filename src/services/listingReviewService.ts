import type { ListingReview } from '../types/database'

type ItemType = 'company' | 'product' | 'ebook' | 'talent'

const STORAGE_KEY = 'neutron-listing-reviews'

function getLocal(): ListingReview[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function setLocal(reviews: ListingReview[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
}

export const listingReviewService = {
  getReviews(itemType: ItemType, itemId: string): ListingReview[] {
    return getLocal()
      .filter(r => r.item_type === itemType && r.item_id === itemId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  getAverage(itemType: ItemType, itemId: string): { average: number; count: number } {
    const reviews = getLocal().filter(r => r.item_type === itemType && r.item_id === itemId)
    if (reviews.length === 0) return { average: 0, count: 0 }
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    return { average: Math.round(avg * 10) / 10, count: reviews.length }
  },

  getDistribution(itemType: ItemType, itemId: string): Record<number, number> {
    const reviews = getLocal().filter(r => r.item_type === itemType && r.item_id === itemId)
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach(r => { dist[r.rating] = (dist[r.rating] || 0) + 1 })
    return dist
  },

  hasUserReviewed(itemType: ItemType, itemId: string, userId: string): boolean {
    return getLocal().some(r => r.item_type === itemType && r.item_id === itemId && r.user_id === userId)
  },

  addReview(review: Omit<ListingReview, 'id' | 'created_at' | 'updated_at'>): ListingReview {
    const reviews = getLocal()
    const newReview: ListingReview = {
      ...review,
      id: `lrev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    reviews.push(newReview)
    setLocal(reviews)
    return newReview
  },

  updateReview(reviewId: string, rating: number, comment: string): void {
    const reviews = getLocal()
    const idx = reviews.findIndex(r => r.id === reviewId)
    if (idx !== -1) {
      reviews[idx] = { ...reviews[idx], rating, comment, updated_at: new Date().toISOString() }
      setLocal(reviews)
    }
  },

  deleteReview(reviewId: string): void {
    setLocal(getLocal().filter(r => r.id !== reviewId))
  },
}
