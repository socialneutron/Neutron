import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, ArrowLeft, TrendingUp, MessageCircle, Eye, FileText } from 'lucide-react';

const C = {
  bg: '#05050A', surface: '#090914', card: '#0d0d1a', border: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', purple: '#7928CA', green: '#34D399', red: '#ef4444',
  text: '#f1f5f9', muted: '#6b7280',
};

const MOCK_GRAPHS = [
  { id: 'g1', title: 'GPT-5 Performance Benchmarks', creator: 'Alice', likes: 142, svg: 'M0,40 Q20,30 40,35 T80,20 T120,10 T160,5' },
  { id: 'g2', title: 'Token Usage Over Time', creator: 'Bob', likes: 98, svg: 'M0,50 Q30,45 60,30 T120,25 T160,15' },
  { id: 'g3', title: 'LLM vs Human Eval', creator: 'Carol', likes: 210, svg: 'M0,45 Q25,40 50,20 T100,30 T160,8' },
  { id: 'g4', title: 'Fine-tuning Cost Analysis', creator: 'Dave', likes: 67, svg: 'M0,35 Q40,50 80,25 T160,20' },
];

const MOCK_DISCUSSIONS = [
  { id: 'd1', title: 'What is the future of AI agents?', author: 'Hank', replies: 28, lastActive: '2h ago' },
  { id: 'd2', title: 'Best practices for deploying LLMs', author: 'Iris', replies: 15, lastActive: '5h ago' },
];

const RELATED_TAGS = ['Machine Learning', 'GPT', 'Neural Networks', 'Deep Learning', 'NLP'];

const miniSvg = (path, color) => (
  <svg width="120" height="50" viewBox="0 0 160 50" style={{ overflow: 'visible' }}>
    <defs>
      <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
    </defs>
    <path d={path + ' L160,50 L0,50 Z'} fill={`url(#grad-${color})`} />
    <path d={path} fill="none" stroke={color} strokeWidth="2" />
  </svg>
);

export default function TagFeedPage({ tag = 'AI', navigate, user }) {
  const [activeTab, setActiveTab] = useState('graphs');
  const [sortBy, setSortBy] = useState('recent');
  const [following, setFollowing] = useState(false);

  const tabs = ['Graphs', 'Posts', 'Discussions'];
  const tabCounts = { Graphs: MOCK_GRAPHS.length, Posts: 0, Discussions: MOCK_DISCUSSIONS.length };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('graphs')}
        style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '16px 20px', fontSize: 14 }}
      >
        <ArrowLeft size={16} /> Back to Graphs
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${C.cyan}22, ${C.purple}22)`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Hash size={20} color={C.cyan} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>#{tag}</h1>
            <div style={{ fontSize: 13, color: C.muted, display: 'flex', gap: 12, marginTop: 2 }}>
              <span>{MOCK_GRAPHS.length} graphs</span>
              <span>0 posts</span>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setFollowing(f => !f)}
          style={{
            padding: '8px 18px', borderRadius: 8, border: `1px solid ${following ? 'transparent' : C.border}`,
            background: following ? C.cyan : 'transparent', color: following ? C.bg : C.text,
            cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }}
        >
          {following ? 'Following' : 'Follow Tag'}
        </motion.button>
      </motion.div>

      {/* Tabs + Sort */}
      <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 0, background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t.toLowerCase())}
              style={{
                padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: activeTab === t.toLowerCase() ? C.card : 'transparent',
                color: activeTab === t.toLowerCase() ? C.text : C.muted,
                borderBottom: activeTab === t.toLowerCase() ? `2px solid ${C.cyan}` : '2px solid transparent',
              }}
            >
              {t} ({tabCounts[t]})
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted, padding: '6px 10px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
        >
          <option value="recent">Most Recent</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px 32px' }}>
        <AnimatePresence mode="wait">
          {/* Graphs Tab */}
          {activeTab === 'graphs' && (
            <motion.div key="graphs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {MOCK_GRAPHS.map((g, i) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -3, boxShadow: `0 8px 24px ${C.cyan}15` }}
                  onClick={() => navigate('graph-detail', { graphId: g.id })}
                  style={{
                    background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
                    padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10,
                  }}
                >
                  <div style={{ background: C.surface, borderRadius: 8, padding: '12px 8px', overflow: 'hidden' }}>
                    {miniSvg(g.svg, C.cyan)}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{g.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <span style={{ fontSize: 12, color: C.muted }}>by {g.creator}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.muted }}>
                      <TrendingUp size={13} /> {g.likes}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <motion.div key="posts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
                <FileText size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 13 }}>No posts yet for this tag</p>
              </div>
            </motion.div>
          )}

          {/* Discussions Tab */}
          {activeTab === 'discussions' && (
            <motion.div key="discussions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MOCK_DISCUSSIONS.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ borderColor: C.purple + '44' }}
                  style={{
                    background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
                    padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{d.title}</h3>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>by {d.author} &middot; {d.lastActive}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.muted }}>
                    <MessageCircle size={13} /> {d.replies} replies
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Related Tags */}
      <div style={{ padding: '0 20px 40px' }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 13, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Related Tags</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {RELATED_TAGS.map(t => (
            <span
              key={t}
              onClick={() => navigate('tag-feed', { tag: t })}
              style={{
                padding: '6px 12px', borderRadius: 6, background: C.surface, border: `1px solid ${C.border}`,
                fontSize: 13, color: C.muted, cursor: 'pointer',
              }}
            >
              #{t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
