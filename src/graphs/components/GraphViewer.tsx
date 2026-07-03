import React, { useState, useMemo } from 'react';
import { useAnimations } from '../context/AnimationContext';
import { Graph, GraphComment, CreatorProfile } from '../types';
import { 
  X, Heart, MessageSquare, Eye, Share2, CornerDownRight, 
  Send, Sparkles, AlertCircle, TrendingUp, Calendar, ArrowLeft, Shield 
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, Area, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';

interface GraphViewerProps {
  graph: Graph;
  currentProfile: CreatorProfile;
  onClose: () => void;
  onLikeGraph: (graphId: string) => void;
  onAddComment: (graphId: string, comment: GraphComment) => void;
  onAddReply: (graphId: string, commentId: string, replyText: string) => void;
  onSelectCreator?: (creatorId: string) => void;
}

export default function GraphViewer({ 
  graph, 
  currentProfile, 
  onClose, 
  onLikeGraph, 
  onAddComment, 
  onAddReply,
  onSelectCreator
}: GraphViewerProps) {
  const { animationsEnabled } = useAnimations();

  // Dialog comment writing states
  const [newCommentText, setNewCommentText] = useState('');
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  // Password confirmation (if isPrivate & password set up)
  const [unlocked, setUnlocked] = useState(!graph.passwordProtected);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Local interaction handlers
  const handleUnlock = () => {
    if (passwordAttempt === graph.password) {
      setUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const freshComment: GraphComment = {
      id: `c_${Date.now()}`,
      graphId: graph.id,
      creatorName: currentProfile.name,
      creatorAvatar: currentProfile.avatar,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: []
    };

    onAddComment(graph.id, freshComment);
    setNewCommentText('');
  };

  const handlePostReply = (commentId: string) => {
    const text = replyInputs[commentId];
    if (!text || !text.trim()) return;

    onAddReply(graph.id, commentId, text.trim());
    setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
    setActiveReplyId(null);
  };

  // Main Chart Rendering System
  const renderInteractiveChart = () => {
    const data = graph.data;
    const color = graph.themeColor || '#00BFFF';

    if (graph.type === 'pie') {
      const valKey = graph.seriesList[0]?.key || Object.keys(data[0] || {}).find(k => k !== graph.independentKey) || '';
      const pieData = data.map((d, i) => ({
        name: String(d[graph.independentKey] || i),
        value: Number(d[valKey] || 0)
      }));

      const colors = [color, '#FF00FF', '#00FF00', '#FFD700', '#FF4500', '#9370DB', '#FF4500'];

      return (
        <ResponsiveContainer width="100%" height={340}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={110}
              paddingAngle={4}
              dataKey="value"
              isAnimationActive={animationsEnabled}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#090909', borderColor: '#222', borderRadius: '12px', color: '#FFF' }}
              itemStyle={{ color: '#DDD' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (graph.type === 'candlestick') {
      return (
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 15 }}>
            <XAxis dataKey={graph.independentKey} stroke="#444" tick={{ fill: '#777', fontSize: 10 }} />
            <YAxis stroke="#444" tick={{ fill: '#777', fontSize: 10 }} />
            {graph.gridVisible && <CartesianGrid strokeDasharray="3 3" stroke="#222" />}
            <Tooltip
              contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#222', borderRadius: '12px', color: '#FFF' }}
            />
            <Legend />
            {/* Draw High/Low wick line */}
            <Bar 
              dataKey="high" 
              name="Shadow Wick Up" 
              fill="#FF3E3E" 
              barSize={2.5}
              isAnimationActive={animationsEnabled}
            />
            {/* Draw Open/Close candle box */}
            <Bar 
              dataKey="close" 
              name="Gas Spot close" 
              fill={color} 
              barSize={18}
              radius={[3, 3, 0, 0]}
              isAnimationActive={animationsEnabled}
            />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 15 }}>
          <XAxis dataKey={graph.independentKey} stroke="#444" tick={{ fill: '#777', fontSize: 10 }} />
          <YAxis stroke="#444" tick={{ fill: '#777', fontSize: 10 }} />
          {graph.gridVisible && <CartesianGrid strokeDasharray="3 3" stroke="#222" />}
          
          <Tooltip 
            contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#222', borderRadius: '12px', color: '#FFF' }}
          />
          <Legend />

          {graph.seriesList.map((series, idx) => {
            const hexColor = series.color || color;
            const rep = graph.type === 'mixed' 
              ? (idx % 2 === 0 ? 'bar' : 'line') 
              : graph.type;

            if (rep === 'bar') {
              return (
                <Bar 
                  key={series.key} 
                  dataKey={series.key} 
                  name={series.name} 
                  fill={hexColor} 
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={animationsEnabled}
                />
              );
            }

            if (rep === 'area') {
              return (
                <React.Fragment key={series.key}>
                  <defs>
                    <linearGradient id={`viewGrad-${series.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={hexColor} stopOpacity={0.45}/>
                      <stop offset="95%" stopColor={hexColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey={series.key}
                    name={series.name}
                    stroke={hexColor}
                    strokeWidth={2}
                    fillOpacity={2.5}
                    fill={graph.isAreaGradient ? `url(#viewGrad-${series.key})` : hexColor}
                    dot={graph.dotVisible ? { r: 4, fill: hexColor } : false}
                    isAnimationActive={animationsEnabled}
                  />
                </React.Fragment>
              );
            }

            if (rep === 'scatter') {
              return (
                <Scatter 
                  key={series.key} 
                  dataKey={series.key} 
                  name={series.name} 
                  fill={hexColor}
                  isAnimationActive={animationsEnabled}
                />
              );
            }

            return (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.name}
                stroke={hexColor}
                strokeWidth={2.5}
                dot={graph.dotVisible ? { r: 5, fill: hexColor, strokeWidth: 0 } : false}
                isAnimationActive={animationsEnabled}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div id="full-modal-viewer" className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md overflow-y-auto p-4 md:p-6 flex justify-center items-start text-left">
      
      {/* Locked Screen Mode */}
      {!unlocked ? (
        <div className="w-full max-w-sm mx-auto bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mt-24 text-center space-y-4">
          <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-pink-500">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white font-sans">Password Protected Telemetry</h2>
            <p className="text-xs text-neutral-500 font-sans">This file is private. Verify credential tokens to proceed.</p>
          </div>
          <div className="space-y-3.5">
            <input
              type="password"
              placeholder="Enter cryptographic key..."
              value={passwordAttempt}
              onChange={(e) => setPasswordAttempt(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-center text-white focus:outline-none focus:border-[#00BFFF]"
            />
            {passwordError && (
              <p className="text-[10px] font-mono text-pink-500">Invalid authorization key. Try again.</p>
            )}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-white/5 text-[10px] uppercase font-mono text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Exit Node
              </button>
              <button
                onClick={handleUnlock}
                className="flex-1 px-4 py-2 bg-[#00BFFF] text-neutral-950 text-[10px] uppercase font-mono font-bold rounded-lg transition-all text-glow shadow-[0_0_15px_rgba(0,191,255,0.25)] cursor-pointer"
              >
                Decrypt
              </button>
            </div>
          </div>
        </div>
      ) : (
        
        // Fullscreen Active Visual Interface
        <div className="w-full max-w-6xl bg-neutral-950/95 border border-white/10 rounded-2xl p-5 md:p-7 space-y-6 relative backdrop-blur-2xl shadow-2xl">
          
          {/* Header Controls */}
          <div className="flex justify-between items-center pb-4 border-b border-white/5">
            <button
              onClick={onClose}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-white/5 hover:border-white/15 bg-white/[0.02] text-neutral-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#00BFFF]" /> <span>Back to Feed</span>
            </button>
            <div className="flex items-center space-x-2.5">
              <span className="text-[9px] font-mono bg-[#00BFFF]/10 border border-[#00BFFF]/20 text-[#00BFFF] px-2.5 py-1.5 rounded-lg uppercase font-bold tracking-wider">
                {graph.category} // {graph.type}
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/[0.03] text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Core Interactive Layout: Grid 2 Column */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Box: Graphic and Description Metadata (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Plot canvas */}
              <div className="bg-neutral-900/10 border border-white/5 rounded-2xl p-5 flex flex-col justify-center relative min-h-[380px] shadow-inner pb-6">
                <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-neutral-900/80 border border-white/5 px-2.5 py-1 rounded-md">
                  <div className="w-2 h-2 rounded-full bg-[#00BFFF] animate-pulse" />
                  <span className="text-[9px] font-mono tracking-widest text-[#00BFFF] font-bold">STREAM ACTIVE // 32-BIT GRAPHICS PRESET</span>
                </div>
                {renderInteractiveChart()}
              </div>

              {/* Title & Description card */}
              <div className="border border-white/5 rounded-2xl p-6 bg-white/[0.01] space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="text-left space-y-1.5">
                    <h1 className="text-xl md:text-2xl font-black text-white tracking-wide font-sans">{graph.title}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-sans">
                      <span className="flex items-center space-x-1 font-mono text-[10px]">
                        <Calendar className="w-3.5 h-3.5 text-[#00BFFF]" /> <span>{graph.uploadDate}</span>
                      </span>
                      <span className="h-3 w-[1px] bg-white/5" />
                      <span className="flex items-center space-x-1 font-mono text-[10px]">
                        <Eye className="w-3.5 h-3.5 text-neutral-400" /> <span>{graph.views} views</span>
                      </span>
                    </div>
                  </div>

                  {/* Creator and Like metrics bubble */}
                  <div 
                    id="viewer-creator-card"
                    onClick={() => onSelectCreator && onSelectCreator(graph.creatorId)}
                    className="flex items-center space-x-3.5 bg-neutral-950/80 p-2.5 rounded-xl border border-white/5 cursor-pointer hover:border-[#00BFFF]/40 hover:bg-neutral-900/40 transition-all group"
                    title="View creator's account page"
                  >
                    <img
                      src={graph.creatorAvatar}
                      alt={graph.creatorName}
                      className="w-8.5 h-8.5 rounded-lg border border-white/10 group-hover:border-[#00BFFF]/30 object-cover object-top transition-all"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-left font-sans">
                      <span className="text-xs font-bold text-neutral-200 block leading-tight group-hover:text-white transition-colors">{graph.creatorName}</span>
                      <span className="text-[9px] font-mono text-[#00BFFF] block leading-none mt-1">{graph.creatorHandle}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLikeGraph(graph.id);
                      }}
                      className={`p-1.5 px-2.5 rounded-lg border transition-all hover:bg-white/[0.03] flex items-center space-x-1.5 cursor-pointer ${
                        graph.isLikedByUser 
                          ? 'border-[#00BFFF]/30 bg-[#00BFFF]/10 text-[#00BFFF]' 
                          : 'border-white/5 text-neutral-400 font-bold'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5" fill={graph.isLikedByUser ? 'currentColor' : 'none'} />
                      <span className="text-xs font-mono font-bold">{graph.likes}</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-neutral-350 leading-relaxed font-sans text-left">{graph.description}</p>

                {/* Tag clouds */}
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {graph.tags.map((t, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/5 text-[9px] font-mono text-neutral-450 uppercase tracking-widest hover:border-[#00BFFF]/30 transition-all font-semibold"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>



            </div>

            {/* Right Box: Discussion comment feed board (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="border border-white/5 rounded-2xl p-5 bg-white/[0.01] backdrop-blur-md flex flex-col min-h-[500px] justify-between h-full shadow-lg">
                
                {/* Header title */}
                <div className="pb-3 border-b border-white/5 mb-3 text-left">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00BFFF] flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-glow" /> Discussion Panel ({graph.comments.length})
                  </span>
                </div>

                {/* Scroll comments block */}
                <div className="flex-1 overflow-y-auto max-h-96 space-y-4 mb-4 pr-1 text-left">
                  {graph.comments.length === 0 ? (
                    <div className="py-20 text-center text-neutral-500 text-xs font-sans">
                      No commentary packets transmitted.
                      <p className="text-[10px] text-neutral-600 font-mono mt-1 uppercase tracking-wide">Initialize discussion thread below.</p>
                    </div>
                  ) : (
                    graph.comments.map((comment) => (
                      <div key={comment.id} className="space-y-2.5 border-b border-white/5 pb-3.5" id={`comment-${comment.id}`}>
                        <div className="flex items-start space-x-2.5">
                          <img
                            src={comment.creatorAvatar}
                            alt={comment.creatorName}
                            className="w-7.5 h-7.5 rounded-lg border border-white/10 object-cover object-top mt-0.5"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 text-left">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <span className="text-xs font-bold text-neutral-200">{comment.creatorName}</span>
                              <span className="text-[9px] font-mono text-neutral-500">
                                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-300 leading-normal font-sans">{comment.text}</p>
                            
                            {/* Comment tools footer */}
                            <div className="flex items-center space-x-4 mt-2">
                              <button
                                className="text-[10px] text-neutral-500 hover:text-white font-mono flex items-center space-x-0.5 cursor-pointer"
                              >
                                <Heart className="w-2.5 h-2.5" /> <span>{comment.likes}</span>
                              </button>
                              <button
                                id={`reply-trigger-${comment.id}`}
                                onClick={() => setActiveReplyId(activeReplyId === comment.id ? null : comment.id)}
                                className="text-[10px] text-neutral-400 hover:text-[#00BFFF] font-mono cursor-pointer"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Rendering Nested Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="pl-6 space-y-3 pt-1.5 border-l border-white/5 ml-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start space-x-2.5" id={`reply-${reply.id}`}>
                                <CornerDownRight className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-1" />
                                <img
                                  src={reply.creatorAvatar}
                                  alt={reply.creatorName}
                                  className="w-6 h-6 rounded-lg border border-white/10 object-cover object-top shrink-0"
                                  referrerPolicy="no-referrer"
                               />
                                <div className="flex-1 text-left">
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-semibold text-neutral-300">{reply.creatorName}</span>
                                    <span className="text-[9px] font-mono text-neutral-500">
                                      {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-neutral-400 leading-normal font-sans">{reply.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Expandable inline reply composition */}
                        {activeReplyId === comment.id && (
                          <div className="pl-6 ml-3 pt-2" id={`reply-composer-${comment.id}`}>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder={`Reply to ${comment.creatorName}...`}
                                value={replyInputs[comment.id] || ''}
                                onChange={(e) => setReplyInputs(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                className="flex-1 bg-neutral-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#00BFFF]"
                              />
                              <button
                                id={`submit-reply-btn-${comment.id}`}
                                onClick={() => handlePostReply(comment.id)}
                                className="p-1.5 px-3 bg-[#00BFFF] text-neutral-950 rounded-lg text-xs font-bold hover:bg-[#00BFFF]/95 cursor-pointer font-mono uppercase text-[9px]"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    ))
                  )}
                </div>

                {/* Primary writing deck */}
                <form onSubmit={handlePostComment} className="border-t border-white/5 pt-3.5">
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={currentProfile.avatar}
                      alt={currentProfile.name}
                      className="w-8.5 h-8.5 rounded-lg border border-white/10 object-cover object-top"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        id="comment-input-field"
                        placeholder="Write dynamic commentary..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00BFFF] transition-all"
                      />
                      <button
                        type="submit"
                        id="comment-submit-btn"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#00BFFF] transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </form>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
