import { useState } from 'react'
import { ArrowLeft, TrendingUp, Pin, BarChart2, Zap, MessageCircle, Heart, Repeat2 } from 'lucide-react'
import './TopicHub.css'

const HUB_DATA = {
  AI: {
    color: '#00d2ff', icon: '🤖',
    description: 'Explore the frontier of artificial intelligence, machine learning, and the future of human-computer interaction.',
    members: '842K', posts: '14.2K',
    pinned: { title: '🔴 LIVE: OpenAI\'s GPT-6 announcement — Follow this thread for real-time updates', author: 'Mod Team', time: '10m ago' },
    trending: ['#AGI2025', '#ChatGPT', '#Gemini', '#Claude', '#LLMs'],
    poll: { question: 'Will AGI be achieved by 2030?', options: [{ label: 'Yes, definitely', votes: 4821 }, { label: 'Probably', votes: 3201 }, { label: 'Unlikely', votes: 2100 }, { label: 'Never', votes: 980 }] },
  },
  Politics: {
    color: '#ff6b6b', icon: '🌍',
    description: 'Discuss global governance, elections, policy, diplomacy, and the forces shaping geopolitics.',
    members: '1.2M', posts: '28.4K',
    pinned: { title: '📌 Community Rules: Respectful discourse only. No misinformation.', author: 'Mod Team', time: '2d ago' },
    trending: ['#USPolitics', '#EU', '#China', '#Climate', '#Elections'],
    poll: { question: 'Which issue matters most globally right now?', options: [{ label: 'Climate Change', votes: 6200 }, { label: 'Economic inequality', votes: 5100 }, { label: 'AI Regulation', votes: 4800 }, { label: 'Geopolitical tension', votes: 3900 }] },
  },
  Startups: {
    color: '#a855f7', icon: '🚀',
    description: 'Founders, investors, and operators discussing the startup ecosystem worldwide.',
    members: '621K', posts: '9.8K',
    pinned: { title: '🚀 YC W2025 applications open — share your experience & advice', author: 'StartupMod', time: '1d ago' },
    trending: ['#YCombinator', '#VentureCapital', '#Fintech', '#SaaS', '#AI'],
    poll: { question: 'Hardest part of building a startup?', options: [{ label: 'Finding product-market fit', votes: 5400 }, { label: 'Hiring talent', votes: 3800 }, { label: 'Fundraising', votes: 3200 }, { label: 'Competition', votes: 2100 }] },
  },
  Finance: {
    color: '#fbbf24', icon: '📈',
    description: 'Markets, investing, macroeconomics, crypto, and the global financial system.',
    members: '930K', posts: '19.7K',
    pinned: { title: '📊 Weekly Market Recap — Fed decision, earnings, and macro outlook', author: 'FinanceBot', time: '6h ago' },
    trending: ['#Bitcoin', '#SP500', '#FederalReserve', '#Gold', '#Crypto'],
    poll: { question: 'Best asset class for 2025?', options: [{ label: 'Bitcoin & Crypto', votes: 7200 }, { label: 'US Equities', votes: 5900 }, { label: 'Gold & Commodities', votes: 2800 }, { label: 'Real Estate', votes: 2100 }] },
  },
  Science: {
    color: '#4ade80', icon: '🔬',
    description: 'Breakthroughs in biology, physics, climate science, neuroscience, and beyond.',
    members: '508K', posts: '7.1K',
    pinned: { title: '🧬 Mega-thread: CRISPR Alzheimer\'s trial results — Discuss the implications', author: 'ScienceMod', time: '3h ago' },
    trending: ['#CRISPR', '#Physics', '#NASA', '#Neuroscience', '#Longevity'],
    poll: { question: 'Most impactful scientific field of the decade?', options: [{ label: 'Biotech & Genomics', votes: 8100 }, { label: 'AI & Computing', votes: 7400 }, { label: 'Quantum Physics', votes: 3200 }, { label: 'Climate Science', votes: 2900 }] },
  },
  Space: {
    color: '#818cf8', icon: '🛸',
    description: 'The cosmos, space exploration, SpaceX, NASA, and humanity\'s multi-planetary future.',
    members: '447K', posts: '5.9K',
    pinned: { title: '🛸 SpaceX Starship Mars test success — What\'s next for deep space?', author: 'SpaceMod', time: '1h ago' },
    trending: ['#SpaceX', '#NASA', '#Mars', '#Artemis', '#Starship'],
    poll: { question: 'When will humans first set foot on Mars?', options: [{ label: '2029–2031', votes: 5100 }, { label: '2032–2035', votes: 6800 }, { label: '2036–2040', votes: 3400 }, { label: 'After 2040', votes: 1800 }] },
  },
}

const HUB_POSTS = [
  { id: 1, author: 'Dr. Yuki Tanaka', handle: '@yuki_ai', avatar: 'YT', time: '5m ago', content: 'The implication of AGI arriving before quantum supremacy is that we may be dealing with a digital mind before we even understand classical cognition. The alignment problem becomes exponentially harder.', likes: 2341, comments: 187, reposts: 432 },
  { id: 2, author: 'Sam Aldridge', handle: '@sam_vc', avatar: 'SA', time: '22m ago', content: 'Just spoke with 3 YC founders this week. Every single one pivoted to an AI-native product. The era of "AI-enhanced" software is already over. Welcome to the AI-first paradigm.', likes: 1890, comments: 214, reposts: 567 },
  { id: 3, author: 'Elena Vasquez', handle: '@elena_macro', avatar: 'EV', time: '1h ago', content: 'Thread: Why the current AI investment bubble is different from the dot-com era 🧵\n\n1/ The infrastructure this time is real. Data centers, chips, cloud — these are physical assets with intrinsic value. Unlike 2000, we\'re not betting on vaporware.', likes: 5620, comments: 389, reposts: 1240 },
]

export default function TopicHub({ topic = 'AI', navigate }) {
  const hubName = typeof topic === 'string' && topic.startsWith('#')
    ? topic.slice(1)
    : (topic || 'AI')

  const hubKey = Object.keys(HUB_DATA).find(k => k.toLowerCase() === hubName.toLowerCase()) || 'AI'
  const hub = HUB_DATA[hubKey]

  const [activeTab, setActiveTab] = useState('trending')
  const [voted, setVoted] = useState(null)
  const [likes, setLikes] = useState(HUB_POSTS.map(p => ({ id: p.id, liked: false, count: p.likes })))

  const totalVotes = hub.poll.options.reduce((a, b) => a + b.votes, 0)

  const toggleLike = (postId) => {
    setLikes(prev => prev.map(l =>
      l.id === postId ? { ...l, liked: !l.liked, count: l.liked ? l.count - 1 : l.count + 1 } : l
    ))
  }

  const getLike = (id) => likes.find(l => l.id === id) || {}
  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n

  return (
    <div className="topic-hub">
      {/* Header */}
      <div className="hub-header" style={{ '--hub-color': hub.color }}>
        <button className="hub-back-btn" onClick={() => navigate('home')} id="hub-back-btn">
          <ArrowLeft size={20}/>
        </button>

        <div className="hub-hero">
          <div className="hub-icon-ring" style={{ boxShadow: `0 0 30px ${hub.color}40` }}>
            <span style={{ fontSize: '32px' }}>{hub.icon}</span>
          </div>
          <div>
            <h1 className="hub-title" style={{ color: hub.color }}>{hubKey}</h1>
            <p className="hub-desc">{hub.description}</p>
          </div>
        </div>

        <div className="hub-stats-row">
          <div className="hub-stat">
            <span className="hub-stat-val">{hub.members}</span>
            <span className="hub-stat-label">Members</span>
          </div>
          <div className="hub-stat-divider"/>
          <div className="hub-stat">
            <span className="hub-stat-val">{hub.posts}</span>
            <span className="hub-stat-label">Posts Today</span>
          </div>
          <div className="hub-stat-divider"/>
          <div className="hub-stat">
            <span className="hub-stat-val" style={{ color: '#4ade80' }}>LIVE</span>
            <span className="hub-stat-label">Discussions</span>
          </div>
          <button className="hub-join-btn" style={{ background: `linear-gradient(135deg, ${hub.color}, #8a2be2)` }}>
            + Join Hub
          </button>
        </div>

        {/* Tabs */}
        <div className="hub-tabs">
          {['trending', 'posts', 'polls'].map(tab => (
            <button key={tab} className={`hub-tab ${activeTab === tab ? 'hub-tab-active' : ''}`}
              style={activeTab === tab ? { color: hub.color, borderBottomColor: hub.color } : {}}
              onClick={() => setActiveTab(tab)} id={`hub-tab-${tab}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="hub-body">
        {/* Pinned Post */}
        <div className="pinned-post" style={{ borderColor: hub.color + '30', background: hub.color + '08' }}>
          <div className="pinned-label" style={{ color: hub.color }}>
            <Pin size={12}/> Pinned
          </div>
          <p className="pinned-text">{hub.pinned.title}</p>
          <div className="pinned-meta">
            <span>{hub.pinned.author}</span>
            <span>·</span>
            <span>{hub.pinned.time}</span>
          </div>
        </div>

        {activeTab === 'trending' && (
          <>
            {/* Trending tags */}
            <div className="hub-section-title">
              <TrendingUp size={14} style={{ color: hub.color }}/>
              <span>Trending Tags</span>
            </div>
            <div className="hub-trending-tags">
              {hub.trending.map(tag => (
                <span key={tag} className="hub-tag" style={{ color: hub.color, borderColor: hub.color + '40', background: hub.color + '10' }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Posts */}
            <div className="hub-section-title" style={{ marginTop: '20px' }}>
              <Zap size={14} style={{ color: hub.color }}/>
              <span>Top Discussions</span>
            </div>
            {HUB_POSTS.map(post => {
              const likeData = getLike(post.id)
              return (
                <div key={post.id} className="hub-post-card" id={`hub-post-${post.id}`}>
                  <div className="hub-post-author">
                    <div className="hub-post-avatar" style={{ background: hub.color + '40' }}>
                      {post.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{post.author}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{post.handle} · {post.time}</div>
                    </div>
                  </div>
                  <p className="hub-post-content">{post.content}</p>
                  <div className="hub-post-actions">
                    <button className={`action-btn-sm ${likeData.liked ? 'liked' : ''}`} onClick={() => toggleLike(post.id)}>
                      <Heart size={15} fill={likeData.liked ? 'currentColor' : 'none'}/> {fmt(likeData.count || post.likes)}
                    </button>
                    <button className="action-btn-sm">
                      <MessageCircle size={15}/> {fmt(post.comments)}
                    </button>
                    <button className="action-btn-sm">
                      <Repeat2 size={15}/> {fmt(post.reposts)}
                    </button>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {activeTab === 'polls' && (
          <div className="hub-poll">
            <div className="poll-header">
              <BarChart2 size={16} style={{ color: hub.color }}/>
              <span className="poll-title">{hub.poll.question}</span>
            </div>
            {hub.poll.options.map((opt, i) => {
              const pct = Math.round((opt.votes / totalVotes) * 100)
              return (
                <button key={i} className={`poll-option ${voted === i ? 'poll-voted' : ''}`}
                  onClick={() => setVoted(i)} id={`poll-opt-${i}`}
                  style={voted !== null ? { cursor: 'default' } : {}}
                >
                  <div className="poll-bar" style={{ width: voted !== null ? `${pct}%` : '0%', background: hub.color + '30' }}/>
                  <span className="poll-label">{opt.label}</span>
                  {voted !== null && <span className="poll-pct">{pct}%</span>}
                  {voted === i && <span className="poll-check" style={{ color: hub.color }}>✓</span>}
                </button>
              )
            })}
            <p className="poll-total">{(totalVotes / 1000).toFixed(1)}K total votes</p>
          </div>
        )}

        {activeTab === 'posts' && (
          <div>
            {HUB_POSTS.map(post => {
              const likeData = getLike(post.id)
              return (
                <div key={post.id} className="hub-post-card" id={`hub-post-all-${post.id}`}>
                  <div className="hub-post-author">
                    <div className="hub-post-avatar" style={{ background: hub.color + '40' }}>{post.avatar}</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{post.author}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{post.handle} · {post.time}</div>
                    </div>
                  </div>
                  <p className="hub-post-content">{post.content}</p>
                  <div className="hub-post-actions">
                    <button className={`action-btn-sm ${likeData.liked ? 'liked' : ''}`} onClick={() => toggleLike(post.id)}>
                      <Heart size={15} fill={likeData.liked ? 'currentColor' : 'none'}/> {fmt(likeData.count || post.likes)}
                    </button>
                    <button className="action-btn-sm"><MessageCircle size={15}/> {fmt(post.comments)}</button>
                    <button className="action-btn-sm"><Repeat2 size={15}/> {fmt(post.reposts)}</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
