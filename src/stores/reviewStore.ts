import { create } from 'zustand'
import type { MagazineReview } from '../types/database'
import { reviewService } from '../services/reviewService'

interface ReviewState {
  reviewsByEbook: Record<string, MagazineReview[]>
  averagesByEbook: Record<string, { average: number; count: number }>
  distributionByEbook: Record<string, Record<number, number>>

  loadReviews: (ebookId: string) => void
  submitReview: (
    ebookId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    rating: number,
    comment: string
  ) => MagazineReview
  deleteReview: (reviewId: string, ebookId: string) => void
  hasUserReviewed: (ebookId: string, userId: string) => boolean
  getAverageRating: (ebookId: string) => { average: number; count: number }
  getDistribution: (ebookId: string) => Record<number, number>
}

export const useReviewStore = create<ReviewState>()((set, get) => ({
  reviewsByEbook: {},
  averagesByEbook: {},
  distributionByEbook: {},

  loadReviews: (ebookId) => {
    const reviews = reviewService.getReviewsByEbook(ebookId)
    const { average, count } = reviewService.getAverageRating(ebookId)
    const distribution = reviewService.getRatingDistribution(ebookId)
    set(state => ({
      reviewsByEbook: { ...state.reviewsByEbook, [ebookId]: reviews },
      averagesByEbook: { ...state.averagesByEbook, [ebookId]: { average, count } },
      distributionByEbook: { ...state.distributionByEbook, [ebookId]: distribution },
    }))
  },

  submitReview: (ebookId, userId, userName, userAvatar, rating, comment) => {
    const review = reviewService.addReview({
      ebook_id: ebookId,
      user_id: userId,
      user_name: userName,
      user_avatar: userAvatar,
      rating,
      comment,
    })
    const reviews = reviewService.getReviewsByEbook(ebookId)
    const { average, count } = reviewService.getAverageRating(ebookId)
    const distribution = reviewService.getRatingDistribution(ebookId)
    set(state => ({
      reviewsByEbook: { ...state.reviewsByEbook, [ebookId]: reviews },
      averagesByEbook: { ...state.averagesByEbook, [ebookId]: { average, count } },
      distributionByEbook: { ...state.distributionByEbook, [ebookId]: distribution },
    }))
    return review
  },

  deleteReview: (reviewId, ebookId) => {
    reviewService.deleteReview(reviewId)
    const reviews = reviewService.getReviewsByEbook(ebookId)
    const { average, count } = reviewService.getAverageRating(ebookId)
    const distribution = reviewService.getRatingDistribution(ebookId)
    set(state => ({
      reviewsByEbook: { ...state.reviewsByEbook, [ebookId]: reviews },
      averagesByEbook: { ...state.averagesByEbook, [ebookId]: { average, count } },
      distributionByEbook: { ...state.distributionByEbook, [ebookId]: distribution },
    }))
  },

  hasUserReviewed: (ebookId, userId) => {
    return reviewService.hasUserReviewed(ebookId, userId)
  },

  getAverageRating: (ebookId) => {
    return get().averagesByEbook[ebookId] || { average: 0, count: 0 }
  },

  getDistribution: (ebookId) => {
    return get().distributionByEbook[ebookId] || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  },
}))
