import { useState } from 'react'
import { ArrowLeft, Image, BarChart2, Link, Hash, X, ChevronDown } from 'lucide-react'
import { collection, addDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import './PostCreation.css'

const CATEGORIES = ['AI', 'Politics', 'Startups', 'Finance', 'Science', 'Space', 'Technology', 'Economics']
const POST_TYPES = [
  { id: 'text', label: 'Discussion', icon: '✍️' },
  { id: 'image', label: 'Image', icon: '🖼️' },
  { id: 'poll', label: 'Poll', icon: '📊' },
  { id: 'link', label: 'Link', icon: '🔗' },
]

export default function PostCreation({ navigate }) {
  const [postType, setPostType] = useState('text')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('AI')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [showCategoryDrop, setShowCategoryDrop] = useState(false)
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)

  const addTag = () => {
    const t = tagInput.replace(/\s+/g, '').replace(/^#/, '')
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag))

  const updatePollOption = (i, val) => {
    const opts = [...pollOptions]
    opts[i] = val
    setPollOptions(opts)
  }

  const addPollOption = () => {
    if (pollOptions.length < 4) setPollOptions([...pollOptions, ''])
  }

  const handlePost = async () => {
    if (!title.trim()) return
    setPosting(true)
    try {
      const user = auth.currentUser
      await addDoc(collection(db, 'posts'), {
        title,
        body,
        category,
        tags,
        postType,
        linkUrl: postType === 'link' ? linkUrl : '',
        pollOptions: postType === 'poll' ? pollOptions : [],
        author: user?.displayName || 'Anonymous',
        handle: `@${user?.displayName?.toLowerCase()?.replace(/\s/g, '') || 'anonymous'}`,
        time: new Date().toISOString(),
        likes: 0,
        comments: 0,
        reposts: 0,
        hasAISummary: false
      })
      setPosted(true)
      setTimeout(() => navigate('home'), 1000)
    } catch (err) {
      console.error("Error creating post:", err)
      alert("Failed to publish post. Please try again.")
      setPosting(false)
    }
  }

  const charLimit = 500
  const remaining = charLimit - body.length

  return (
    <div className="post-creation">
      {/* Header */}
      <div className="create-header">
        <button className="icon-btn" onClick={() => navigate('home')} id="create-back-btn">
          <ArrowLeft size={20}/>
        </button>
        <h2 className="create-title">New Post</h2>
        <button
          className="post-btn"
          onClick={handlePost}
          disabled={!title.trim() || posting || posted}
          id="publish-post-btn"
        >
          {posted ? '✓ Posted!' : posting ? <span className="loading-spinner"/> : 'Publish'}
        </button>
      </div>

      <div className="create-body">
        {/* Post type selector */}
        <div className="type-selector">
          {POST_TYPES.map(t => (
            <button
              key={t.id}
              className={`type-btn ${postType === t.id ? 'type-active' : ''}`}
              onClick={() => setPostType(t.id)}
              id={`type-${t.id}`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Category picker */}
        <div className="category-picker">
          <label className="field-label">Category</label>
          <button className="category-select-btn" onClick={() => setShowCategoryDrop(!showCategoryDrop)} id="category-select">
            <span>{category}</span>
            <ChevronDown size={16}/>
          </button>
          {showCategoryDrop && (
            <div className="category-dropdown">
              {CATEGORIES.map(c => (
                <button key={c} className={`category-opt ${category === c ? 'category-opt-active' : ''}`}
                  onClick={() => { setCategory(c); setShowCategoryDrop(false) }} id={`cat-${c}`}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <div className="field-group">
          <label className="field-label">Title <span className="required">*</span></label>
          <input
            className="glass-input"
            placeholder="What's your discussion about?"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
            id="post-title-input"
          />
        </div>

        {/* Text body */}
        {(postType === 'text' || postType === 'link') && (
          <div className="field-group">
            <label className="field-label">
              Body
              <span style={{ marginLeft: 'auto', color: remaining < 50 ? '#ff6b6b' : 'var(--text-secondary)' }}>
                {remaining}
              </span>
            </label>
            <textarea
              className="glass-input post-textarea"
              placeholder="Share your thoughts, insights, analysis..."
              value={body}
              onChange={e => setBody(e.target.value)}
              maxLength={charLimit}
              id="post-body-input"
            />
          </div>
        )}

        {/* Link input */}
        {postType === 'link' && (
          <div className="field-group">
            <label className="field-label"><Link size={14}/> URL</label>
            <input
              className="glass-input"
              placeholder="https://..."
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              id="post-link-input"
            />
          </div>
        )}

        {/* Image upload */}
        {postType === 'image' && (
          <div className="image-upload-area" id="image-upload-area">
            <div className="image-upload-icon"><Image size={32} color="var(--text-secondary)"/></div>
            <p>Tap to upload an image</p>
            <span>PNG, JPG, GIF up to 10MB</span>
            <input type="file" accept="image/*" style={{ display: 'none' }}/>
          </div>
        )}

        {/* Poll options */}
        {postType === 'poll' && (
          <div className="field-group">
            <label className="field-label"><BarChart2 size={14}/> Poll Options</label>
            {pollOptions.map((opt, i) => (
              <input
                key={i}
                className="glass-input"
                style={{ marginBottom: '10px' }}
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={e => updatePollOption(i, e.target.value)}
                id={`poll-opt-create-${i}`}
              />
            ))}
            {pollOptions.length < 4 && (
              <button className="add-option-btn" onClick={addPollOption} id="add-poll-option-btn">
                + Add Option
              </button>
            )}
          </div>
        )}

        {/* Tags */}
        <div className="field-group">
          <label className="field-label"><Hash size={14}/> Tags (up to 5)</label>
          <div className="tag-input-row">
            <input
              className="glass-input"
              placeholder="Add a hashtag..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag()}
              id="tag-input"
            />
            <button className="add-tag-btn" onClick={addTag} id="add-tag-btn">Add</button>
          </div>
          {tags.length > 0 && (
            <div className="tags-list">
              {tags.map(tag => (
                <span key={tag} className="tag-pill">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="remove-tag-btn"><X size={12}/></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* AI Moderation notice */}
        <div className="ai-notice">
          <span className="ai-notice-icon">🤖</span>
          <div>
            <p className="ai-notice-title">AI Moderation Active</p>
            <p className="ai-notice-sub">Your post will be checked for misinformation and community guidelines.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
