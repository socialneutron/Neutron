import { postService } from './postService'
import { feedService } from './feedService'
import { userService } from './userService'
import { commentService } from './commentService'
import { likeService } from './likeService'
import { followService } from './followService'
import { bookmarkService } from './bookmarkService'
import { repostService } from './repostService'
import { notificationService } from './notificationService'
import { mediaService } from './mediaService'
import { storyService } from './storyService'
import { analyticsService } from './analyticsService'

import { backendPostService } from './backendPostService'
import { backendUserService } from './backendUserService'
import { backendCommentService } from './backendCommentService'
import { backendNotificationService } from './backendNotificationService'
import { backendMessageService } from './backendMessageService'
import { backendSearchService } from './backendSearchService'
import { backendLikeService } from './backendLikeService'
import { backendRepostService } from './backendRepostService'
import { backendBookmarkService } from './backendBookmarkService'

const useBackend = !!import.meta.env.VITE_API_URL

export const activePostService = useBackend ? backendPostService as any : postService
export const activeUserService = useBackend ? backendUserService as any : userService
export const activeCommentService = useBackend ? backendCommentService as any : commentService
export const activeNotificationService = useBackend ? backendNotificationService as any : notificationService
export const activeMessageService = useBackend ? backendMessageService as any : null
export const activeSearchService = useBackend ? backendSearchService as any : null
export const activeLikeService = useBackend ? backendLikeService as any : likeService
export const activeRepostService = useBackend ? backendRepostService as any : repostService
export const activeBookmarkService = useBackend ? backendBookmarkService as any : bookmarkService

export {
  postService,
  feedService,
  userService,
  commentService,
  likeService,
  followService,
  bookmarkService,
  repostService,
  notificationService,
  mediaService,
  storyService,
  analyticsService,
  backendPostService,
  backendUserService,
  backendCommentService,
  backendNotificationService,
  backendMessageService,
  backendSearchService,
  backendLikeService,
  backendRepostService,
  backendBookmarkService,
}
