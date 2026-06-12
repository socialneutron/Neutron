import { useState } from 'react'
import { ArrowLeft, Settings, Edit3, Bookmark, BarChart2, Award, Heart, MessageCircle, Zap } from 'lucide-react'
import './ProfilePage.css'

const ACHIEVEMENTS = [
  { icon: '🔥', label: 'Hot Debater', desc: '10+ viral posts' },
  { icon: '🎯', label: 'Truth Seeker', desc: 'Fact-checked 50 posts' },
  { icon: '⚡', label: 'Early Adopter', desc: 'Joined Week 1' },
  { icon: '🏆', label: 'Top Contributor', desc: 'AI Hub — This Month' },
]

const USER_POSTS = [
  { id: 1, title: 'Why AGI safety should be a government priority, not just a Silicon Valley concern', likes: 3241, comments: 218, time: '2d ago', category: 'AI', categoryColor: '#00d2ff' },
  { id: 2, title: 'The Macro case for Bitcoin in a multipolar world order', likes: 1892, comments: 143, time: '5d ago', category: 'Finance', categoryColor: '#fbbf24' },
  { id: 3, title: 'Thread: 10 startups I believe will hit $1B by 2026 🧵', likes: 5670, comments: 391, time: '1w ago', category: 'Startups', categoryColor: '#a855f7' },
]

const INTERESTS = ['AI', 'Geopolitics', 'Finance', 'Startups', 'Space']

export default function ProfilePage({ user, navigate }) {
  const [activeTab, setActiveTab] = useState('posts')
  const [following, setFollowing] = useState(false)

  const displayName = user?.username || 'neutron_user'

  return (
    <div className="profile-page">
      {/* Cover */}
      <div className="profile-cover">
        <div className="cover-gradient"/>
        <button className="profile-back-btn" onClick={() => navigate('home')} id="profile-back-btn">
          <ArrowLeft size={20}/>
        </button>
        <button className="profile-settings-btn" onClick={() => navigate('settings')} id="settings-btn">
          <Settings size={20}/>
        </button>
      </div>

      {/* Profile Info */}
      <div className="profile-info-section">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {displayName[0]?.toUpperCase()}
          </div>
          <div className="reputation-ring">
            <span className="rep-score">🔷 4.9</span>
          </div>
        </div>

        <div className="profile-name-block">
          <div className="profile-name-row">
            <h1 className="profile-name">{displayName}</h1>
            <span className="verified-badge">✓</span>
          </div>
          <p className="profile-handle">@{displayName}</p>
          <p className="profile-bio">
            Global macro analyst · AI researcher · Exploring the intersection of technology, geopolitics and finance. Building the future one thread at a time. 🌍
          </p>

          <div className="profile-interests">
            {INTERESTS.map(i => (
              <span key={i} className="interest-tag">{i}</span>
            ))}
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-val">1,240</span>
              <span className="profile-stat-label">Posts</span>
            </div>
            <div className="profile-stat-div"/>
            <div className="profile-stat">
              <span className="profile-stat-val">48.2K</span>
              <span className="profile-stat-label">Followers</span>
            </div>
            <div className="profile-stat-div"/>
            <div className="profile-stat">
              <span className="profile-stat-val">892</span>
              <span className="profile-stat-label">Following</span>
            </div>
            <div className="profile-stat-div"/>
            <div className="profile-stat">
              <span className="profile-stat-val neon-text">9,821</span>
              <span className="profile-stat-label">Rep Score</span>
            </div>
          </div>

          <div className="profile-action-row">
            <button className="glow-btn" style={{ flex: 1, padding: '12px' }} onClick={() => setFollowing(!following)} id="follow-btn">
              {following ? '✓ Following' : '+ Follow'}
            </button>
            <button className="secondary-btn" style={{ flex: 1, padding: '12px' }} id="message-profile-btn" onClick={() => navigate('chat')}>
              Message
            </button>
            <button className="icon-profile-btn" id="edit-profile-btn">
              <Edit3 size={18}/>
            </button>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="achievements-strip">
        <div className="section-header-row">
          <Award size={15} color="var(--accent-blue)"/>
          <span className="section-header-label">Achievements</span>
        </div>
        <div className="achievements-scroll">
          {ACHIEVEMENTS.map(a => (
            <div key={a.label} className="achievement-card">
              <span className="ach-icon">{a.icon}</span>
              <span className="ach-label">{a.label}</span>
              <span className="ach-desc">{a.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {['posts', 'saved', 'analytics'].map(tab => (
          <button
            key={tab}
            className={`profile-tab ${activeTab === tab ? 'profile-tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
            id={`profile-tab-${tab}`}
          >
            {tab === 'posts' && <BarChart2 size={14}/>}
            {tab === 'saved' && <Bookmark size={14}/>}
            {tab === 'analytics' && <Zap size={14}/>}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="profile-tab-content">
        {activeTab === 'posts' && (
          <div className="profile-posts">
            {USER_POSTS.map(post => (
              <div key={post.id} className="profile-post-card" id={`profile-post-${post.id}`}>
                <div className="pp-category-row">
                  <span className="pp-category" style={{ color: post.categoryColor, background: post.categoryColor + '15', borderColor: post.categoryColor + '40' }}>
                    {post.category}
                  </span>
                  <span className="pp-time">{post.time}</span>
                </div>
                <p className="pp-title">{post.title}</p>
                <div className="pp-actions">
                  <span className="pp-action"><Heart size={14}/> {post.likes.toLocaleString()}</span>
                  <span className="pp-action"><MessageCircle size={14}/> {post.comments}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="empty-state">
            <Bookmark size={40} color="var(--text-secondary)"/>
            <p>Your saved posts appear here</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-cards">
            {[
              { label: 'Total Impressions', value: '1.4M', icon: '👁️', color: '#00d2ff' },
              { label: 'Engagement Rate', value: '8.7%', icon: '📊', color: '#a855f7' },
              { label: 'Top Category', value: 'AI', icon: '🤖', color: '#4ade80' },
              { label: 'Avg. Likes / Post', value: '3,240', icon: '❤️', color: '#fbbf24' },
            ].map(card => (
              <div key={card.label} className="analytics-card" style={{ borderColor: card.color + '30', background: card.color + '08' }}>
                <span className="analytics-icon">{card.icon}</span>
                <span className="analytics-value" style={{ color: card.color }}>{card.value}</span>
                <span className="analytics-label">{card.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
