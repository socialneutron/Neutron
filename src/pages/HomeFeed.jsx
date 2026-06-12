import { useState, useEffect } from 'react'
import { Search, Bell, TrendingUp, Zap, Globe, Cpu, Rocket, FlaskConical, BarChart3, Plus, X } from 'lucide-react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import PostCard from '../components/PostCard'
import './HomeFeed.css'

const TRENDING = [
  { id: 1, tag: '#AGI2025', posts: '14.2K' },
  { id: 2, tag: '#USElection', posts: '8.7K' },
  { id: 3, tag: '#BlackRock', posts: '5.1K' },
  { id: 4, tag: '#MarsBase', posts: '3.4K' },
]

const SECTIONS = [
  { id: 'all', label: 'For You', icon: <Zap size={14}/> },
  { id: 'ai', label: 'AI', icon: <Cpu size={14}/> },
  { id: 'politics', label: 'Politics', icon: <Globe size={14}/> },
  { id: 'startups', label: 'Startups', icon: <Rocket size={14}/> },
  { id: 'finance', label: 'Finance', icon: <BarChart3 size={14}/> },
  { id: 'science', label: 'Science', icon: <FlaskConical size={14}/> },
]

export default function HomeFeed({ navigate, user }) {
  const [activeSection, setActiveSection] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('time', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Map data to the format expected by PostCard if necessary
        author: doc.data().author || 'Anonymous',
        handle: doc.data().handle || '@anonymous',
        categoryColor: doc.data().categoryColor || '#00d2ff',
        avatar: (doc.data().author || 'A')[0].toUpperCase(),
      }))
      setPosts(postData)
      setLoading(false)
    }, (error) => {
      console.error("Firestore posts snapshot error (expected if database is not created in Firebase console):", error)
      const fallbackPosts = [
        {
          id: 'fb-1',
          title: "Why AGI safety should be a government priority",
          body: "The rapid advancement of LLMs suggests we are closer to AGI than previously thought. We need international protocols for safety...",
          author: "Dr. Elena Vance",
          category: "AI",
          categoryColor: "#00d2ff",
          likes: 120,
          comments: 45,
          time: "10m ago",
          tags: ["AGI", "Safety", "Governance"]
        },
        {
          id: 'fb-2',
          title: "The Macro case for Bitcoin in 2026",
          body: "With global debt reaching record levels, the thesis for a decentralized store of value has never been stronger...",
          author: "Mark S.",
          category: "Finance",
          categoryColor: "#fbbf24",
          likes: 340,
          comments: 89,
          time: "1h ago",
          tags: ["Bitcoin", "Crypto", "Macro"]
        },
        {
          id: 'fb-3',
          title: "10 startups to watch in the fusion energy space",
          body: "Fusion is no longer '30 years away'. These companies are making real breakthroughs in magnetic confinement...",
          author: "TechObserver",
          category: "Startups",
          categoryColor: "#a855f7",
          likes: 560,
          comments: 120,
          time: "2h ago",
          tags: ["Fusion", "Energy", "Startups"]
        }
      ]
      setPosts(fallbackPosts)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const filtered = posts.filter(post => {
    const matchesSection = activeSection === 'all' || (post.category || '').toLowerCase() === activeSection
    const matchesSearch = searchQuery === '' || 
      (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.body || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSection && matchesSearch
  })

  return (
    <div className="home-feed">
      {/* Top bar */}
      <div className="feed-topbar">
        <div className="topbar-left">
          <span className="neutron-brand" style={{ fontSize: '18px', letterSpacing: '2px' }}>neutron</span>
        </div>
        <div className="topbar-right">
          <button className="topbar-icon-btn" id="notifications-btn" onClick={() => navigate('notifications')}>
            <Bell size={20}/>
            <span className="notif-badge">3</span>
          </button>
          <button className="avatar-btn" onClick={() => navigate('profile')} id="profile-avatar-btn">
            <span className="avatar-text">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="search-bar-wrap">
        <Search size={16} className="search-icon"/>
        <input
          className="search-input"
          placeholder="Search discussions, topics, people..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          id="home-search-input"
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => setSearchQuery('')}>
            <X size={14}/>
          </button>
        )}
      </div>

      {!searchQuery && (
        <>
          {/* Trending strip */}
          <div className="trending-strip">
            <div className="trending-label">
              <TrendingUp size={13}/>
              <span>Trending</span>
            </div>
            <div className="trending-tags">
              {TRENDING.map(t => (
                <span key={t.id} className="trending-tag" onClick={() => navigate('topic', { topic: t.tag })}>
                  {t.tag}
                  <span className="tag-count">{t.posts}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Section tabs */}
          <div className="section-tabs">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                className={`tab-btn ${activeSection === s.id ? 'tab-active' : ''}`}
                onClick={() => setActiveSection(s.id)}
                id={`tab-${s.id}`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Search Header */}
      {searchQuery && (
        <div className="search-results-header">
          <p>Showing results for "<span className="neon-text">{searchQuery}</span>"</p>
          <span className="results-count">{filtered.length} found</span>
        </div>
      )}

      {/* Posts Feed */}
      <div className="posts-list">
        {loading ? (
          <div className="empty-search">
            <span className="loading-spinner" style={{ width: '40px', height: '40px' }}/>
            <p style={{ marginTop: '20px' }}>Accessing intelligence stream...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((post, i) => (
            <PostCard key={post.id} post={post} navigate={navigate} delay={i * 0.05} />
          ))
        ) : (
          <div className="empty-search">
            <Search size={40} className="empty-icon"/>
            <h3>No results found</h3>
            <p>Try searching for different keywords or topics</p>
            <button className="secondary-btn" style={{ marginTop: '20px', width: 'auto' }} onClick={() => setSearchQuery('')}>
              Clear Search
            </button>
          </div>
        )}
      </div>


      {/* Floating Action Button */}
      <button className="fab" id="create-post-fab" onClick={() => navigate('create')}>
        <Plus size={24}/>
      </button>
    </div>
  )
}
