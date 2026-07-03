import React, { useState, useMemo } from 'react';
import { useAnimations } from '../context/AnimationContext';
import { Graph, CreatorProfile } from '../types';
import { Search, Heart, MessageSquare, Eye, FolderPlus, Share2, RefreshCw, UserCheck, UserPlus, Filter, Clock, Play, Download, X, Sliders, Shield, ShieldAlert, Info, Percent, Flame, RotateCcw, Compass, TrendingUp, Sparkles, Cpu } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';

interface SocialFeedProps {
  publicGraphs: Graph[];
  profiles: CreatorProfile[];
  onGraphSelect: (graph: Graph) => void;
  onLikeGraph: (graphId: string) => void;
  onFollowCreator: (creatorId: string) => void;
  onSelectCreator?: (creatorId: string) => void;
}

export default function SocialFeed({ 
  publicGraphs, 
  profiles, 
  onGraphSelect, 
  onLikeGraph, 
  onFollowCreator,
  onSelectCreator
}: SocialFeedProps) {
  const { animationsEnabled } = useAnimations();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'trending' | 'views' | 'likes' | 'comments' | 'new'>('trending');
  const [repostedIds, setRepostedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedPrivacyMode, setFeedPrivacyMode] = useState<'public' | 'private'>('public');
  const [hiddenGraphIds, setHiddenGraphIds] = useState<string[]>([]);

  // Category tags
  const categories = ['All', 'Finance', 'Science', 'Crypto', 'Genetics', 'Web3', 'Custom'];

  // Handle follow / unfollow creator with parent synchronization
  const creatorMap = useMemo(() => {
    return new Map(profiles.map(p => [p.id, p]));
  }, [profiles]);

  // Handle local visual interactions
  const handleRepost = (e: React.MouseEvent, graphId: string) => {
    e.stopPropagation();
    setRepostedIds(prev =>
      prev.includes(graphId) ? prev.filter(id => id !== graphId) : [...prev, graphId]
    );
  };

  const handleSave = (e: React.MouseEvent, graphId: string) => {
    e.stopPropagation();
    setSavedIds(prev =>
      prev.includes(graphId) ? prev.filter(id => id !== graphId) : [...prev, graphId]
    );
  };

  const handleDownloadExcel = (e: React.MouseEvent, graph: Graph) => {
    e.stopPropagation();
    try {
      const ws = XLSX.utils.json_to_sheet(graph.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Graph Data");
      const filename = `${graph.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_data.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error("Failed to export Excel sheet:", err);
    }
  };

  const handleShare = (e: React.MouseEvent, graph: Graph) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/graph/${graph.id}`);
    setCopiedId(graph.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Filtering & Sorting pipeline
  const processedGraphs = useMemo(() => {
    let result = [...publicGraphs];

    // Filter out hidden/dismissed graphs
    if (hiddenGraphIds.length > 0) {
      result = result.filter(g => !hiddenGraphIds.includes(g.id));
    }

    // Privacy Switch filter
    if (feedPrivacyMode === 'private') {
      result = result.filter(g => {
        const creator = creatorMap.get(g.creatorId);
        return g.creatorId === 'user_u1' || creator?.isFollowing === true;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g => 
        g.title.toLowerCase().includes(q) || 
        g.description.toLowerCase().includes(q) ||
        g.tags.some(t => t.toLowerCase().includes(q)) ||
        g.creatorName.toLowerCase().includes(q)
      );
    }

    // Category
    if (activeCategory !== 'All') {
      result = result.filter(g => 
        g.category.toLowerCase() === activeCategory.toLowerCase() ||
        g.tags.some(t => t.toLowerCase() === activeCategory.toLowerCase())
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'trending') {
        const scoreA = (a.views || 0) + ((a.likes || 0) * 6) + ((a.commentsCount || 0) * 12);
        const scoreB = (b.views || 0) + ((b.likes || 0) * 6) + ((b.commentsCount || 0) * 12);
        return scoreB - scoreA;
      }
      if (sortBy === 'views') return b.views - a.views;
      if (sortBy === 'likes') return b.likes - a.likes;
      if (sortBy === 'comments') return b.commentsCount - a.commentsCount;
      if (sortBy === 'new') return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      return 0;
    });

    return result;
  }, [
    publicGraphs, searchQuery, activeCategory, sortBy, feedPrivacyMode, creatorMap, hiddenGraphIds
  ]);

  // Mini Chart Renderer supporting Line, Bar, Pie, Area, Scatter, Candlestick, Mixed
  const renderMiniChart = (graph: Graph) => {
    const data = graph.data.slice(0, 8); // Keep it compact
    const color = graph.themeColor || '#00BFFF';

    const renderCustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const item = payload[0];
        const label = item.payload[graph.independentKey] || '';
        return (
          <div className="bg-neutral-950/95 border border-white/10 px-2.5 py-1 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.5)] font-mono text-[8.5px] pointer-events-none select-none">
            {label && <div className="text-neutral-500 mb-0.5">{label}</div>}
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-white font-bold">{item.value}</span>
            </div>
          </div>
        );
      }
      return null;
    };

    switch (graph.type) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id={`miniGrad-${graph.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip content={renderCustomTooltip} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
              <Area 
                type="monotone" 
                dataKey={graph.seriesList[0]?.key || "value"} 
                stroke={color} 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill={`url(#miniGrad-${graph.id})`}
                isAnimationActive={animationsEnabled}
                activeDot={{ r: 4, strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <Tooltip content={renderCustomTooltip} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar 
                dataKey={graph.seriesList[0]?.key || "value"} 
                fill={color} 
                radius={[3, 3, 0, 0]}
                isAnimationActive={animationsEnabled}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        const pieData = data.map((d, index) => ({
          name: String(d[graph.independentKey] || index),
          value: Number(d[graph.seriesList[0]?.key || Object.keys(d)[1]] || 10)
        }));
        const colors = [color, '#FF00FF', '#00FF00', '#FFD700', '#FF4500'];
        return (
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Tooltip 
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const item = payload[0];
                    return (
                      <div className="bg-neutral-950/95 border border-white/10 px-2.5 py-1 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.5)] font-mono text-[8.5px] pointer-events-none select-none">
                        <div className="text-neutral-500 mb-0.5">{item.name}</div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.payload?.fill || color }} />
                          <span className="text-white font-bold">{item.value}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
                paddingAngle={3}
                dataKey="value"
                isAnimationActive={animationsEnabled}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} className="cursor-pointer transition-all hover:opacity-80" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      case 'candlestick':
        return (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data} margin={{ top: 10, right: 5, left: 5, bottom: 10 }}>
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const label = payload[0].payload[graph.independentKey] || '';
                    return (
                      <div className="bg-neutral-950/95 border border-white/10 px-2.5 py-1 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.5)] font-mono text-[8.5px] pointer-events-none select-none">
                        {label && <div className="text-neutral-400 mb-1 font-bold">{label}</div>}
                        <div className="flex items-center gap-1.5 text-[#FF3E3E] mb-0.5">
                          <span>High:</span>
                          <span className="font-semibold">{payload[0].payload.high}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#00E676]">
                          <span>Low:</span>
                          <span className="font-semibold">{payload[0].payload.low}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar 
                dataKey="high" 
                fill="#FF3E3E" 
                radius={[1, 1, 0, 0]}
                isAnimationActive={animationsEnabled}
              />
              <Bar 
                dataKey="low" 
                fill="#00E676" 
                radius={[1, 1, 0, 0]} 
                isAnimationActive={animationsEnabled}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <Tooltip content={renderCustomTooltip} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
              <Line 
                type="monotone" 
                dataKey={graph.seriesList[0]?.key || "value"} 
                stroke="none" 
                dot={{ r: 4, fill: color, strokeWidth: 0 }}
                isAnimationActive={animationsEnabled}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'multi':
      case 'mixed':
      default:
        return (
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const label = payload[0].payload[graph.independentKey] || '';
                    return (
                      <div className="bg-neutral-950/95 border border-white/10 px-2.5 py-1 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.5)] font-mono text-[8.5px] pointer-events-none select-none space-y-0.5">
                        {label && <div className="text-neutral-500 mb-0.5">{label}</div>}
                        {payload.map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.stroke || color }} />
                            <span className="text-neutral-400">{item.name || item.dataKey}:</span>
                            <span className="text-white font-bold">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
              />
              {graph.seriesList.map((series, i) => (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  stroke={series.color}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={animationsEnabled}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-8">




      {/* Global Charts Feed responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processedGraphs.length === 0 ? (
          <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-2xl bg-neutral-900/5">
            <p className="text-neutral-500 text-xs font-mono mb-2 uppercase tracking-widest">No active transmissions detected</p>
            <p className="text-neutral-600 text-xs font-sans">Try refining your search keyword or adjust the category filtering.</p>
          </div>
        ) : (
          processedGraphs.map((graph) => {
            const profile = creatorMap.get(graph.creatorId);
            const isFollowing = profile?.isFollowing || false;
            
            return (
              <div
                key={graph.id}
                id={`graph-card-${graph.id}`}
                onClick={() => onGraphSelect(graph)}
                className={`group relative overflow-hidden rounded-2xl border bg-white/[0.02] border-white/5 p-5 transition-all flex flex-col justify-between cursor-pointer ${
                  animationsEnabled 
                    ? 'hover:scale-[1.015] hover:border-[#00BFFF]/30 hover:shadow-[0_8px_32px_rgba(0,191,255,0.06)] hover:bg-white/[0.03] duration-300 ease-out' 
                    : 'border-white/5'
                }`}
              >
                {/* Absolute Remove Button */}
                <button
                  id={`hide-card-btn-${graph.id}`}
                  className="absolute top-3.5 right-3.5 p-1.5 rounded-md bg-neutral-950/90 hover:bg-neutral-850 border border-white/10 text-neutral-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-35 flex items-center justify-center shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHiddenGraphIds(prev => [...prev, graph.id]);
                  }}
                  title="Remove this graph from feed"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Hover Ambient Corner Neon Overlay */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#00BFFF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                {/* Core Card Section */}
                <div>
                  {/* Account Metadata Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="flex items-center space-x-2.5 text-left cursor-pointer group/creator font-sans" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCreator && onSelectCreator(graph.creatorId);
                      }}
                      title="View creator's account page"
                    >
                      <img
                        src={graph.creatorAvatar}
                        alt={graph.creatorName}
                        className="w-8 h-8 rounded-lg border border-white/10 group-hover/creator:border-[#00BFFF]/30 object-cover object-top transition-colors"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <span className="text-xs font-bold text-neutral-200 block leading-tight group-hover/creator:text-[#00BFFF] cursor-pointer transition-colors whitespace-nowrap">
                            {graph.creatorName}
                          </span>
                          
                          {/* Follow Trigger (Relocated inline) */}
                          <button
                            id={`follow-btn-${graph.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onFollowCreator(graph.creatorId);
                            }}
                            className={`text-[8px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded transition-all flex items-center space-x-0.5 border cursor-pointer leading-none ${
                              isFollowing
                                ? 'bg-[#00BFFF]/10 border-[#00BFFF]/20 text-[#00BFFF]'
                                : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-neutral-400 hover:text-white'
                            }`}
                          >
                            {isFollowing ? <UserCheck className="w-2.5 h-2.5 shrink-0" /> : <UserPlus className="w-2.5 h-2.5 shrink-0" />}
                            <span>{isFollowing ? 'Following' : 'Follow'}</span>
                          </button>
                        </div>
                        <span className="text-[9px] font-mono text-neutral-500 block leading-none">
                          {graph.creatorHandle}
                        </span>
                      </div>
                    </div>
                    
                    {/* Timestamp badge in previous Follow position */}
                    <div className="text-[9px] font-mono text-neutral-500 hover:text-neutral-400 select-none bg-neutral-900/40 border border-white/5 px-2 py-1 rounded-md shrink-0">
                      {new Date(graph.uploadDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-left pb-1">
                    <h3 className="text-sm font-extrabold text-white tracking-wide group-hover:text-[#00BFFF] transition-colors line-clamp-1">
                      {graph.title}
                    </h3>
                  </div>

                  {/* MINI RESPONSIVE CHART PREVIEW WIDGET */}
                  <div className="my-4 bg-neutral-950/90 rounded-xl overflow-hidden border border-white/5 p-3.5 flex items-center justify-center relative min-h-[140px] group/chart">

                    {/* Interactive overlay card */}
                    <div className="absolute inset-0 bg-neutral-950/45 backdrop-blur-[1px] opacity-0 group-hover/chart:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                      <div className="px-3 py-1.5 rounded-xl bg-neutral-950/95 border border-[#00BFFF]/30 text-[9.5px] font-mono uppercase tracking-widest text-[#00BFFF] font-extrabold flex items-center space-x-1.5 shadow-[0_0_15px_rgba(0,191,255,0.25)]">
                        <Play className="w-2.5 h-2.5 fill-[#00BFFF] text-[#00BFFF]" />
                        <span>Interactive Node</span>
                      </div>
                    </div>

                    {renderMiniChart(graph)}
                  </div>
                </div>

                {/* Footer and Engagement Row */}
                <div className="pt-3 border-t border-white/5 flex flex-col justify-end space-y-2.5">
                  {/* Category & Tags */}
                  <div className="flex flex-wrap gap-1 max-h-[18px] overflow-hidden">
                    {graph.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="text-[8.5px] font-mono bg-white/[0.03] border border-white/5 text-neutral-400 px-2 py-0.5 rounded uppercase font-semibold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Social Counters Panel */}
                  <div className="flex items-center justify-between text-neutral-400 text-xs pt-1">
                    <div className="flex items-center space-x-3.5">
                      {/* Likes tab */}
                      <button
                        id={`like-btn-action-${graph.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onLikeGraph(graph.id);
                        }}
                        className={`flex items-center space-x-1 hover:text-[#00BFFF] transition-all cursor-pointer ${
                          graph.isLikedByUser ? 'text-[#00BFFF]' : ''
                        }`}
                      >
                        <Heart className="w-3.5 h-3.5" fill={graph.isLikedByUser ? 'currentColor' : 'none'} />
                        <span className="font-mono text-xs font-semibold">{graph.likes}</span>
                      </button>

                      {/* Comments tab */}
                      <button
                        id={`comment-btn-action-${graph.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onGraphSelect(graph);
                        }}
                        className="flex items-center space-x-1 hover:text-[#00BFFF] transition-all cursor-pointer text-left text-neutral-400 font-sans"
                        title="Open discussion thread"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs font-semibold">{graph.commentsCount}</span>
                      </button>


                    </div>

                    {/* Social Action Deck */}
                    <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      {/* Repost button */}
                      <button
                        id={`repost-action-${graph.id}`}
                        onClick={(e) => handleRepost(e, graph.id)}
                        className={`p-1.5 rounded-lg border transition-all hover:bg-neutral-905 hover:text-[#00BFFF] cursor-pointer ${
                          repostedIds.includes(graph.id) 
                            ? 'border-white/10 text-[#00BFFF]' 
                            : 'border-transparent text-neutral-500'
                        }`}
                        title="Repost to my channel"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${repostedIds.includes(graph.id) ? 'rotate-180 text-success' : 'currentColor'}`} />
                      </button>

                      {/* Excel Download button */}
                      <button
                        id={`save-action-${graph.id}`}
                        onClick={(e) => handleDownloadExcel(e, graph)}
                        className="p-1.5 rounded-lg border border-transparent transition-all hover:bg-neutral-900 hover:text-[#00BFFF] cursor-pointer text-neutral-500"
                        title="Download raw data in Excel Sheet"
                      >
                        <Download className="w-3.5 h-3.5 hover:text-[#00BFFF]" />
                      </button>

                      {/* Share button with temporary badge */}
                      <div className="relative inline-block">
                        <button
                          id={`share-action-${graph.id}`}
                          onClick={(e) => handleShare(e, graph)}
                          className={`p-1.5 rounded-lg border border-transparent transition-all hover:bg-neutral-900 hover:text-[#00BFFF] cursor-pointer ${
                            copiedId === graph.id ? 'text-[#00BFFF]' : 'text-neutral-500'
                          }`}
                          title="Share link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        {copiedId === graph.id && (
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-[#00BFFF] text-neutral-950 text-[8.5px] font-mono rounded font-bold uppercase tracking-wider whitespace-nowrap shadow-[0_0_10px_rgba(0,191,255,0.4)] z-50 animate-bounce">
                            Copied
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
