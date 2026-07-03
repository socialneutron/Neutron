import React, { useMemo } from 'react';
import { useAnimations } from '../context/AnimationContext';
import { Graph, CreatorProfile } from '../types';
import { ArrowLeft, Users, Eye, Heart, MessageSquare, Award, Clock, ArrowUpRight, Zap, Target } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface CreatorProfileViewProps {
  creator: CreatorProfile;
  graphs: Graph[];
  onBack: () => void;
  onFollow: (creatorId: string) => void;
  onGraphSelect: (graph: Graph) => void;
}

export default function CreatorProfileView({
  creator,
  graphs,
  onBack,
  onFollow,
  onGraphSelect
}: CreatorProfileViewProps) {
  const { animationsEnabled } = useAnimations();

  // Filter graphs authored by this creator
  const creatorGraphs = useMemo(() => {
    return graphs.filter(g => g.creatorId === creator.id);
  }, [graphs, creator.id]);

  // Render Mini Chart
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
                <linearGradient id={`profileMiniGrad-${graph.id}`} x1="0" y1="0" x2="0" y2="1">
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
                fill={`url(#profileMiniGrad-${graph.id})`}
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
        const valKey = graph.seriesList[0]?.key || Object.keys(data[0] || {}).find(k => k !== graph.independentKey) || 'value';
        const pieData = data.map((d, i) => ({
          name: String(d[graph.independentKey] || i),
          value: Number(d[valKey] || 0)
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
                paddingAngle={2}
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
                      <div className="bg-neutral-950/95 border border-white/10 px-2.5 py-1 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.5)] font-mono text-[8.5px] pointer-events-none select-none text-left">
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
                      <div className="bg-neutral-950/95 border border-white/10 px-2.5 py-1 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.5)] font-mono text-[8.5px] pointer-events-none select-none space-y-0.5 text-left">
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
                  stroke={series.color || color}
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
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Navigation Return Hook */}
      <div className="flex items-center justify-between border-b border-white/5 pb-5">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-white/5 hover:border-white/15 bg-white/[0.02] text-neutral-400 hover:text-white text-xs font-mono transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#00BFFF]" />
          <span>Back to Telemetry Console</span>
        </button>
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest cursor-default">
          Node Identity Account Directory
        </span>
      </div>

      {/* Hero Header Space Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00BFFF]/5 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-550/5 blur-3xl rounded-full -ml-24 -mb-24 pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 w-full md:w-auto text-center sm:text-left">
          <img
            src={creator.avatar}
            alt={creator.name}
            className="w-20 col-span-1 h-20 md:w-24 md:h-24 rounded-2xl border-2 border-white/10 hover:border-[#00BFFF]/30 transition-colors object-cover object-top shadow-xl shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-2 mt-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-wide font-sans">{creator.name}</h1>
              <span className="text-[8px] font-mono tracking-widest bg-[#00BFFF]/10 border border-[#00BFFF]/20 text-[#00BFFF] px-2 py-0.5 rounded uppercase font-extrabold flex items-center gap-1">
                <Target className="w-2.5 h-2.5 animate-pulse" /> Verified Signal
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#00BFFF]">{creator.handle}</p>
            <p className="text-xs text-neutral-400 font-sans max-w-xl leading-relaxed">{creator.bio}</p>
          </div>
        </div>

        {/* Dynamic Action Trigger */}
        <div className="shrink-0 w-full sm:w-auto flex justify-center py-1 sm:py-0 relative z-10">
          {creator.id !== 'user_u1' ? (
            <button
              id={`profile-follow-action-${creator.id}`}
              onClick={() => onFollow(creator.id)}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl uppercase font-mono tracking-widest text-[10px] transition-all border cursor-pointer font-bold ${
                creator.isFollowing
                  ? 'bg-[#00BFFF]/15 border-[#00BFFF]/30 text-white shadow-[0_0_15px_rgba(0,191,255,0.15)] hover:bg-[#00BFFF]/25'
                  : 'bg-white text-neutral-950 font-black border-transparent hover:bg-neutral-100 shadow-[0_4px_20px_rgba(255,255,255,0.1)]'
              }`}
            >
              {creator.isFollowing ? 'Following Creator' : 'Establish Connection'}
            </button>
          ) : (
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest border border-white/5 bg-white/[0.01] px-4 py-2 rounded-xl">
              This is your profile workspace
            </div>
          )}
        </div>
      </div>

      {/* Numeric Stats Grid Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Followers Signal', value: creator.followers, icon: <Users className="w-4 h-4 text-purple-450" /> },
          { label: 'Connected Nodes', value: creator.following, icon: <Zap className="w-4 h-4 text-blue-400" /> },
          { label: 'Cumulative Views', value: creator.totalViews.toLocaleString(), icon: <Eye className="w-4 h-4 text-[#00BFFF]" /> },
          { label: 'Endorsements Received', value: creator.totalLikes.toLocaleString(), icon: <Heart className="w-4 h-4 text-[#FF3E3E]" /> }
        ].map((stat, i) => (
          <div key={i} className="bg-neutral-900/40 border border-white/5 rounded-2xl p-4 space-y-2 select-default">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-semibold">{stat.label}</span>
              {stat.icon}
            </div>
            <p className="text-xl font-mono text-white font-extrabold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Telemetry Workbooks Section */}
      <div className="space-y-6 pt-2">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-widest font-sans flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00BFFF]"></span>
            Active Telemetry Streams ({creatorGraphs.length})
          </h2>
          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
            Broadcast Records
          </span>
        </div>

        {creatorGraphs.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-neutral-900/5">
            <p className="text-neutral-500 text-xs font-mono mb-2 uppercase tracking-widest">No active transmissions detected</p>
            <p className="text-neutral-600 text-xs font-sans">This user has not broadcasted any visual worksheet graphs yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatorGraphs.map((graph) => (
              <div
                key={graph.id}
                id={`profile-graph-card-${graph.id}`}
                onClick={() => onGraphSelect(graph)}
                className={`group relative overflow-hidden rounded-2xl border bg-white/[0.02] border-white/5 p-5 transition-all flex flex-col justify-between cursor-pointer ${
                  animationsEnabled 
                    ? 'hover:scale-[1.015] hover:border-[#00BFFF]/30 hover:shadow-[0_8px_32px_rgba(0,191,255,0.06)] hover:bg-white/[0.03] duration-300 ease-out' 
                    : 'border-white/5'
                }`}
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#00BFFF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[8px] font-mono bg-neutral-900 border border-white/5 text-neutral-450 px-2 py-1 rounded uppercase font-bold tracking-wider">
                      {graph.category}
                    </span>
                    <span className="text-[9px] font-mono text-[#00BFFF] font-semibold tracking-wider flex items-center gap-1 uppercase">
                      <Clock className="w-3 h-3" /> {graph.uploadDate}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-white group-hover:text-[#00BFFF] transition-colors leading-snug tracking-wide line-clamp-1 text-left">
                    {graph.title}
                  </h3>
                  <p className="text-xs text-neutral-500 line-clamp-2 mt-1.5 leading-relaxed text-left font-sans">
                    {graph.description}
                  </p>

                  {/* Realtime Sparks Sparkline Layout */}
                  <div className="my-5 bg-neutral-950/40 rounded-xl p-2.5 border border-white/[0.03] relative min-h-[140px] flex flex-col justify-center">
                    {renderMiniChart(graph)}
                  </div>
                </div>

                {/* Footer Metrics Row */}
                <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{graph.views} Views</span>
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-neutral-500">
                      <Heart className="w-3.5 h-3.5" />
                      <span>{graph.likes}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{graph.commentsCount}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
