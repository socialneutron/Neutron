import type { MagazineReview } from '../types/database'

const STORAGE_KEY = 'neutron-magazine-reviews'

const SEED_REVIEWS: MagazineReview[] = [
  {
    id: 'rev-1', ebook_id: 'mag-1', user_id: 'demo-user',
    user_name: 'Alex Chen', user_avatar: '',
    rating: 5, comment: 'Excellent coverage of emerging tech trends. The AI section was particularly insightful and forward-thinking.',
    created_at: '2025-06-01T10:00:00Z', updated_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'rev-2', ebook_id: 'mag-1', user_id: 'user-2',
    user_name: 'Sarah Kim', user_avatar: '',
    rating: 4, comment: 'Great articles but wish there were more in-depth analysis pieces on blockchain scalability.',
    created_at: '2025-06-15T14:30:00Z', updated_at: '2025-06-15T14:30:00Z',
  },
  {
    id: 'rev-3', ebook_id: 'mag-1', user_id: 'user-3',
    user_name: 'Marcus Johnson', user_avatar: '',
    rating: 5, comment: 'Must-read for anyone in tech. Every issue delivers fresh perspectives.',
    created_at: '2025-07-02T09:15:00Z', updated_at: '2025-07-02T09:15:00Z',
  },
  {
    id: 'rev-4', ebook_id: 'mag-2', user_id: 'user-4',
    user_name: 'Priya Patel', user_avatar: '',
    rating: 5, comment: 'The leadership frameworks in this issue are practical and immediately actionable.',
    created_at: '2025-05-20T11:00:00Z', updated_at: '2025-05-20T11:00:00Z',
  },
  {
    id: 'rev-5', ebook_id: 'mag-2', user_id: 'user-5',
    user_name: 'David Wright', user_avatar: '',
    rating: 4, comment: 'Solid business insights. The case studies on startup scaling were especially valuable.',
    created_at: '2025-06-10T16:45:00Z', updated_at: '2025-06-10T16:45:00Z',
  },
  {
    id: 'rev-6', ebook_id: 'mag-3', user_id: 'user-6',
    user_name: 'Elena Rodriguez', user_avatar: '',
    rating: 5, comment: 'Breathtaking photography paired with compelling environmental stories. A true masterpiece.',
    created_at: '2025-04-12T08:20:00Z', updated_at: '2025-04-12T08:20:00Z',
  },
  {
    id: 'rev-7', ebook_id: 'mag-3', user_id: 'user-7',
    user_name: 'James Okafor', user_avatar: '',
    rating: 5, comment: 'Every issue of NatGeo is a visual journey. This one on ocean conservation is outstanding.',
    created_at: '2025-05-28T13:10:00Z', updated_at: '2025-05-28T13:10:00Z',
  },
  {
    id: 'rev-8', ebook_id: 'mag-4', user_id: 'user-8',
    user_name: 'Lisa Chang', user_avatar: '',
    rating: 4, comment: 'The annual billionaires issue never disappoints. Great data journalism and analysis.',
    created_at: '2025-06-05T10:30:00Z', updated_at: '2025-06-05T10:30:00Z',
  },
  {
    id: 'rev-9', ebook_id: 'mag-4', user_id: 'user-9',
    user_name: 'Robert Singh', user_avatar: '',
    rating: 5, comment: 'Forbes consistently delivers actionable business intelligence. This issue is no exception.',
    created_at: '2025-07-01T15:00:00Z', updated_at: '2025-07-01T15:00:00Z',
  },
  {
    id: 'rev-10', ebook_id: 'mag-5', user_id: 'user-10',
    user_name: 'Anna Kowalski', user_avatar: '',
    rating: 5, comment: 'Time magazine always captures the essence of what matters. Essential reading.',
    created_at: '2025-06-18T12:00:00Z', updated_at: '2025-06-18T12:00:00Z',
  },
  {
    id: 'rev-11', ebook_id: 'mag-5', user_id: 'user-11',
    user_name: 'Omar Hassan', user_avatar: '',
    rating: 4, comment: 'Well-curated stories on global affairs. Would love more long-form investigative pieces.',
    created_at: '2025-07-05T09:45:00Z', updated_at: '2025-07-05T09:45:00Z',
  },
  {
    id: 'rev-12', ebook_id: 'mag-6', user_id: 'user-12',
    user_name: 'Sophie Martin', user_avatar: '',
    rating: 5, comment: 'The fashion spreads are stunning and the cultural commentary is always on point.',
    created_at: '2025-05-15T14:20:00Z', updated_at: '2025-05-15T14:20:00Z',
  },
  {
    id: 'rev-13', ebook_id: 'mag-6', user_id: 'user-13',
    user_name: 'Kenji Tanaka', user_avatar: '',
    rating: 4, comment: 'Beautiful layout and photography. The sustainability feature was eye-opening.',
    created_at: '2025-06-22T11:30:00Z', updated_at: '2025-06-22T11:30:00Z',
  },
]

function getLocal(): MagazineReview[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REVIEWS))
    return SEED_REVIEWS
  } catch {
    return SEED_REVIEWS
  }
}

function setLocal(reviews: MagazineReview[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
}

export const reviewService = {
  getReviewsByEbook(ebookId: string): MagazineReview[] {
    return getLocal().filter(r => r.ebook_id === ebookId).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  },

  getAverageRating(ebookId: string): { average: number; count: number } {
    const reviews = getLocal().filter(r => r.ebook_id === ebookId)
    if (reviews.length === 0) return { average: 0, count: 0 }
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    return { average: Math.round(avg * 10) / 10, count: reviews.length }
  },

  hasUserReviewed(ebookId: string, userId: string): boolean {
    return getLocal().some(r => r.ebook_id === ebookId && r.user_id === userId)
  },

  addReview(review: Omit<MagazineReview, 'id' | 'created_at' | 'updated_at'>): MagazineReview {
    const reviews = getLocal()
    const newReview: MagazineReview = {
      ...review,
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    reviews.push(newReview)
    setLocal(reviews)
    return newReview
  },

  deleteReview(reviewId: string): void {
    const reviews = getLocal().filter(r => r.id !== reviewId)
    setLocal(reviews)
  },

  getRatingDistribution(ebookId: string): Record<number, number> {
    const reviews = getLocal().filter(r => r.ebook_id === ebookId)
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach(r => { dist[r.rating] = (dist[r.rating] || 0) + 1 })
    return dist
  },
}
