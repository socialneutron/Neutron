import { create } from 'zustand'
import type { ListingReview } from '../types/database'
import { listingReviewService } from '../services/listingReviewService'

type ItemType = 'company' | 'product' | 'ebook' | 'talent'

interface ListingReviewState {
  reviewsByKey: Record<string, ListingReview[]>
  averagesByKey: Record<string, { average: number; count: number }>
  distributionsByKey: Record<string, Record<number, number>>

  loadReviews: (itemType: ItemType, itemId: string) => void
  submitReview: (
    itemType: ItemType,
    itemId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    rating: number,
    comment: string
  ) => ListingReview
  updateReview: (reviewId: string, itemType: ItemType, itemId: string, rating: number, comment: string) => void
  deleteReview: (reviewId: string, itemType: ItemType, itemId: string) => void
  hasUserReviewed: (itemType: ItemType, itemId: string, userId: string) => boolean
  getAverage: (itemType: ItemType, itemId: string) => { average: number; count: number }
  getDistribution: (itemType: ItemType, itemId: string) => Record<number, number>
  getReviews: (itemType: ItemType, itemId: string) => ListingReview[]
}

function key(itemType: ItemType, itemId: string) {
  return `${itemType}:${itemId}`
}

export const useListingReviewStore = create<ListingReviewState>()((set, get) => ({
  reviewsByKey: {},
  averagesByKey: {},
  distributionsByKey: {},

  loadReviews: (itemType, itemId) => {
    const k = key(itemType, itemId)
    const reviews = listingReviewService.getReviews(itemType, itemId)
    const { average, count } = listingReviewService.getAverage(itemType, itemId)
    const distribution = listingReviewService.getDistribution(itemType, itemId)
    set(state => ({
      reviewsByKey: { ...state.reviewsByKey, [k]: reviews },
      averagesByKey: { ...state.averagesByKey, [k]: { average, count } },
      distributionsByKey: { ...state.distributionsByKey, [k]: distribution },
    }))
  },

  submitReview: (itemType, itemId, userId, userName, userAvatar, rating, comment) => {
    const review = listingReviewService.addReview({
      item_type: itemType,
      item_id: itemId,
      user_id: userId,
      user_name: userName,
      user_avatar: userAvatar,
      rating,
      comment,
    })
    const k = key(itemType, itemId)
    const reviews = listingReviewService.getReviews(itemType, itemId)
    const { average, count } = listingReviewService.getAverage(itemType, itemId)
    const distribution = listingReviewService.getDistribution(itemType, itemId)
    set(state => ({
      reviewsByKey: { ...state.reviewsByKey, [k]: reviews },
      averagesByKey: { ...state.averagesByKey, [k]: { average, count } },
      distributionsByKey: { ...state.distributionsByKey, [k]: distribution },
    }))
    return review
  },

  updateReview: (reviewId, itemType, itemId, rating, comment) => {
    listingReviewService.updateReview(reviewId, rating, comment)
    const k = key(itemType, itemId)
    const reviews = listingReviewService.getReviews(itemType, itemId)
    const { average, count } = listingReviewService.getAverage(itemType, itemId)
    const distribution = listingReviewService.getDistribution(itemType, itemId)
    set(state => ({
      reviewsByKey: { ...state.reviewsByKey, [k]: reviews },
      averagesByKey: { ...state.averagesByKey, [k]: { average, count } },
      distributionsByKey: { ...state.distributionsByKey, [k]: distribution },
    }))
  },

  deleteReview: (reviewId, itemType, itemId) => {
    listingReviewService.deleteReview(reviewId)
    const k = key(itemType, itemId)
    const reviews = listingReviewService.getReviews(itemType, itemId)
    const { average, count } = listingReviewService.getAverage(itemType, itemId)
    const distribution = listingReviewService.getDistribution(itemType, itemId)
    set(state => ({
      reviewsByKey: { ...state.reviewsByKey, [k]: reviews },
      averagesByKey: { ...state.averagesByKey, [k]: { average, count } },
      distributionsByKey: { ...state.distributionsByKey, [k]: distribution },
    }))
  },

  hasUserReviewed: (itemType, itemId, userId) => {
    return listingReviewService.hasUserReviewed(itemType, itemId, userId)
  },

  getAverage: (itemType, itemId) => {
    return get().averagesByKey[key(itemType, itemId)] || { average: 0, count: 0 }
  },

  getDistribution: (itemType, itemId) => {
    return get().distributionsByKey[key(itemType, itemId)] || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  },

  getReviews: (itemType, itemId) => {
    return get().reviewsByKey[key(itemType, itemId)] || []
  },
}))
