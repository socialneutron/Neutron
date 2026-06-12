import { useState } from 'react'
import { Heart, MessageCircle, Repeat2, Bookmark, Share2, Zap } from 'lucide-react'
import './PostCard.css'

export default function PostCard({ post, navigate, delay = 0 }) {
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [likes, setLikes] = useState(post.likes)
  const [showSummary, setShowSummary] = useState(false)

  const handleLike = (e) => {
    e.stopPropagation()
    setLiked(!liked)
    setLikes(l => liked ? l - 1 : l + 1)
  }

  const formatNum = (n) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n
  }

  return (
    <div
      className="post-card"
      style={{ animationDelay: `${delay}s` }}
      onClick={() => navigate('topic', { topic: post.category })}
      id={`post-${post.id}`}
    >
      {/* Category badge + time */}
      <div className="post-meta-top">
        <span className="category-badge" style={{ color: post.categoryColor, borderColor: post.categoryColor + '40', background: post.categoryColor + '12' }}>
          {post.category}
        </span>
        <span className="post-time">{post.time}</span>
      </div>

      {/* Author row */}
      <div className="post-author-row">
        <div className="author-avatar" style={{ background: `linear-gradient(135deg, ${post.categoryColor}60, #8a2be260)` }}>
          <span>{post.avatar}</span>
        </div>
        <div className="author-info">
          <div className="author-name-row">
            <span className="author-name">{post.author}</span>
            {post.verified && <span className="verified-badge">✓</span>}
          </div>
          <span className="author-handle">{post.handle}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="post-title">{post.title}</h3>

      {/* Body */}
      <p className="post-body">{post.body}</p>

      {/* AI Summary */}
      {post.hasAISummary && (
        <div className="ai-summary-section">
          <button className="ai-summary-btn" onClick={(e) => { e.stopPropagation(); setShowSummary(!showSummary) }}>
            <Zap size={13}/>
            <span>AI Summary</span>
            <span style={{ marginLeft: 'auto' }}>{showSummary ? '▲' : '▼'}</span>
          </button>
          {showSummary && (
            <div className="ai-summary-content">
              <p>🤖 <strong>Neutron AI:</strong> This post discusses a significant development in {post.category}. Key points: verified sources confirm the claim, with broad expert consensus and notable implications for the next 12–24 months. Fact-check: ✅ Credible.</p>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      <div className="post-tags">
        {post.tags?.map(tag => (
          <span key={tag} className="post-tag">{tag}</span>
        ))}
      </div>

      {/* Actions */}
      <div className="post-actions">
        <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike} id={`like-${post.id}`}>
          <Heart size={16} fill={liked ? 'currentColor' : 'none'}/>
          <span>{formatNum(likes)}</span>
        </button>
        <button className="action-btn" onClick={(e) => e.stopPropagation()} id={`comment-${post.id}`}>
          <MessageCircle size={16}/>
          <span>{formatNum(post.comments)}</span>
        </button>
        <button className="action-btn" onClick={(e) => e.stopPropagation()} id={`repost-${post.id}`}>
          <Repeat2 size={16}/>
          <span>{formatNum(post.reposts)}</span>
        </button>
        <div style={{ flex: 1 }}/>
        <button className={`action-btn ${bookmarked ? 'bookmarked' : ''}`} onClick={(e) => { e.stopPropagation(); setBookmarked(!bookmarked) }} id={`bookmark-${post.id}`}>
          <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'}/>
        </button>
        <button className="action-btn" onClick={(e) => e.stopPropagation()} id={`share-${post.id}`}>
          <Share2 size={16}/>
        </button>
      </div>
    </div>
  )
}
