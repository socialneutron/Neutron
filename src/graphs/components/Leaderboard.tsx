import React, { useState } from 'react';
import { useAnimations } from '../context/AnimationContext';
import { CreatorProfile } from '../types';
import { Award, Zap, Users, MessageSquare, Send, Sparkles, Filter, Newspaper, Trophy } from 'lucide-react';

interface LeaderboardProps {
  profiles: CreatorProfile[];
  onFollowCreator: (creatorId: string) => void;
}

interface ForumTopic {
  id: string;
  title: string;
  author: string;
  avatar: string;
  replies: number;
  category: string;
  timestamp: string;
  body: string;
}

const DEFAULT_TOPICS: ForumTopic[] = [
  {
    id: 't1',
    title: 'Decrypting EVM Gas Fluctuations on Layer-2 Pools',
    author: 'Aria Takahashi',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    replies: 14,
    category: 'Crypto',
    timestamp: '3 hours ago',
    body: 'Analyzing the gas candlestick spikes from peak DeFi trading. I observe consistent resistance compressing right before epochs.'
  },
  {
    id: 't2',
    title: 'Genomics Modeling Standards under CRISPR-9',
    author: 'Lina Vance',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    replies: 8,
    category: 'Science',
    timestamp: '1 day ago',
    body: 'Seeking feedback on RNA folding sequence visuals. The Alpha/Beta sheet fold transitions seem highly symmetrical near sequence S3.'
  }
];

export default function Leaderboard({ profiles, onFollowCreator }: LeaderboardProps) {
  const { animationsEnabled } = useAnimations();

  // Sort profiles by Total Views
  const rankedCreators = [...profiles].sort((a, b) => b.totalViews - a.totalViews);

  // Discussion states
  const [forumTopics, setForumTopics] = useState<ForumTopic[]>(DEFAULT_TOPICS);
  const [topicInputTitle, setTopicInputTitle] = useState('');
  const [topicInputBody, setTopicInputBody] = useState('');
  const [topicInputCategory, setTopicInputCategory] = useState('General');

  const handlePostTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInputTitle.trim() || !topicInputBody.trim()) return;

    const freshTopic: ForumTopic = {
      id: `topic_${Date.now()}`,
      title: topicInputTitle.trim(),
      body: topicInputBody.trim(),
      category: topicInputCategory,
      author: "Epic Legend",
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      replies: 0,
      timestamp: 'Just now'
    };

    setForumTopics(prev => [freshTopic, ...prev]);
    setTopicInputTitle('');
    setTopicInputBody('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      
      {/* LEFT COLUMN: Premium Creator Leaderboard (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-gradient-to-br from-neutral-900/40 to-neutral-950/80 border border-white/5 rounded-2xl p-6 space-y-5 backdrop-blur-lg shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#00BFFF] font-mono text-xs uppercase font-extrabold tracking-wider text-glow">
              <Trophy className="w-5 h-5 text-glow" />
              <span>Telemetry Leaderboard</span>
            </div>
            <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Top Creators</span>
          </div>

          <p className="text-xs text-neutral-400 font-sans leading-relaxed">
            Creators ranked cleanly by aggregate visualization viewership nodes and appreciated likes across global domains.
          </p>

          {/* Leaderboard Tree */}
          <div className="space-y-3" role="list">
            {rankedCreators.map((creator, index) => (
              <div
                key={creator.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-200 flex-row text-left"
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center ${
                    index === 0 
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]' 
                      : index === 1 
                      ? 'bg-slate-300/10 border border-slate-300/30 text-slate-350 shadow-[0_0_10px_rgba(255,255,255,0.05)]' 
                      : index === 2 
                      ? 'bg-amber-800/15 border border-amber-800/30 text-amber-600' 
                      : 'bg-neutral-900 border border-white/5 text-neutral-500 font-medium'
                  }`}>
                    #{index + 1}
                  </div>

                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="w-10 h-10 rounded-lg border border-white/10 object-cover object-top shrink-0 shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-[#f3f4f6] block leading-tight">{creator.name}</span>
                    <span className="text-[9px] font-mono text-neutral-500 block leading-none mt-1">{creator.handle}</span>
                  </div>
                </div>

                {/* Followers and Engagement stats */}
                <div className="text-right space-y-1.5 shrink-0">
                  <span className="text-[10px] font-mono text-[#00BFFF] block font-bold leading-none text-glow">
                    {(creator.totalViews / 1000).toFixed(1)}K views
                  </span>
                  <button
                    id={`leaderboard-follow-btn-${creator.id}`}
                    onClick={() => onFollowCreator(creator.id)}
                    className={`text-[9px] uppercase font-mono tracking-widest px-2.5 py-1 rounded-md transition-all border cursor-pointer ${
                      creator.isFollowing
                        ? 'bg-[#00BFFF]/10 border-[#00BFFF]/30 text-[#00BFFF]'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>{creator.isFollowing ? 'Following' : 'Follow'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: Community Discussion Forum board (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-gradient-to-br from-neutral-900/40 to-neutral-950/80 border border-white/5 rounded-2xl p-6 space-y-5 backdrop-blur-lg shadow-xl">
          <div className="flex items-center space-x-2 text-[#00BFFF] font-mono text-xs uppercase font-extrabold tracking-wider text-glow">
            <MessageSquare className="w-5 h-5 text-glow" />
            <span>Telemetry Discussion Forum</span>
          </div>

          {/* Topics scroll layer */}
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 text-left">
            {forumTopics.map(topic => (
              <div 
                key={topic.id}
                id={`forum-topic-${topic.id}`}
                className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors duration-200 space-y-2.5"
              >
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <img 
                      src={topic.avatar} 
                      alt={topic.author} 
                      className="w-5 h-5 rounded-lg object-cover object-top"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] font-mono text-neutral-400 capitalize">{topic.author}</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5 text-[#00BFFF] font-medium uppercase tracking-wider">
                    {topic.category}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-white hover:text-[#00BFFF] transition-colors cursor-pointer block leading-snug">{topic.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-sans">{topic.body}</p>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-white/[0.03] text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                  <span>Signaled: {topic.timestamp}</span>
                  <span className="flex items-center space-x-1 hover:text-[#00BFFF] transition-colors cursor-pointer">
                    <MessageSquare className="w-3.5 h-3.5" /> <span>{topic.replies} Transmissions</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Write new Topic prompt form */}
          <form onSubmit={handlePostTopic} className="border-t border-white/5 pt-5 space-y-4">
            <span className="block text-[10px] font-mono text-neutral-500 uppercase font-extrabold tracking-widest">Transmit Topic to Discussion Hub</span>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <input
                  type="text"
                  id="forum-topic-title"
                  placeholder="Enter topic title key..."
                  value={topicInputTitle}
                  onChange={(e) => setTopicInputTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#00BFFF] transition-all"
                />
              </div>

              <div>
                <select
                  id="forum-topic-category"
                  value={topicInputCategory}
                  onChange={(e) => setTopicInputCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00BFFF] transition-all font-mono"
                >
                  <option value="General">General</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Science">Science</option>
                  <option value="DevOps">DevOps</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <textarea
                id="forum-topic-body"
                placeholder="Compose detailed query text or review targets..."
                value={topicInputBody}
                onChange={(e) => setTopicInputBody(e.target.value)}
                rows={2}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#00BFFF] resize-none pr-12 transition-all leading-relaxed"
              />
              <button
                type="submit"
                id="sumbit-topic-btn"
                className="absolute right-3.5 bottom-4 p-1.5 rounded-lg bg-[#00BFFF]/10 text-[#00BFFF] border border-[#00BFFF]/20 hover:bg-[#00BFFF] hover:text-neutral-950 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
}
