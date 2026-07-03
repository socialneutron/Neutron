import React, { useState } from "react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line 
} from "recharts";
import { TrendingUp, Activity, Compass, ArrowUpRight, Cpu } from "lucide-react";

// Mock financial statistics matching the space-commercial ecosystem
const COMMERCIAL_VOLUME_HISTORY = [
  { month: "Jan", saasVol: 120, realEstateVol: 450, ipLicensing: 80 },
  { month: "Feb", saasVol: 155, realEstateVol: 420, ipLicensing: 110 },
  { month: "Mar", saasVol: 180, realEstateVol: 490, ipLicensing: 145 },
  { month: "Apr", saasVol: 240, realEstateVol: 650, ipLicensing: 210 },
  { month: "May", saasVol: 310, realEstateVol: 810, ipLicensing: 320 },
  { month: "Jun", saasVol: 425, realEstateVol: 980, ipLicensing: 410 }
];

const SECTOR_DISTRIBUTION = [
  { name: "Digital SaaS", value: 320000, color: "#2563eb" },
  { name: "Sovereign IP", value: 1450000, color: "#3b82f6" },
  { name: "Commercial Space", value: 5600000, color: "#6366f1" },
  { name: "Financial Yields", value: 2500000, color: "#10b981" }
];

const RECENT_DEMAND_VECTORS = [
  { industry: "Defense", index: 88, acceleration: 12 },
  { industry: "Logistics", index: 94, acceleration: 18 },
  { industry: "Entertainment", index: 72, acceleration: -3 },
  { industry: "Agrotech", index: 85, acceleration: 15 },
  { industry: "Computing", index: 97, acceleration: 22 }
];

export default function AnalyticsPanel() {
  const [activeTab, setActiveTab] = useState<"vol" | "alloc" | "demand">("vol");

  // Sum total asset value represented
  const totalMarketCap = 320000 + 1450000 + 5600000 + 2500000;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
      
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-700/5 to-transparent rounded-full pointer-events-none" />

      {/* Header section with telemetry stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] text-blue-400 font-mono tracking-wider uppercase font-semibold flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> Neutron Ledger Telemetry
          </span>
          <h3 className="text-xl font-display font-medium text-white tracking-tight">
            Advanced Market Analytics
          </h3>
        </div>

        <div className="flex bg-slate-950/80 p-1 rounded-lg border border-slate-800 gap-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab("vol")}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${activeTab === "vol" ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-600/20" : "text-slate-400 hover:text-white"}`}
          >
            Volume Trends
          </button>
          <button
            onClick={() => setActiveTab("alloc")}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${activeTab === "alloc" ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-600/20" : "text-slate-400 hover:text-white"}`}
          >
            Sectors (Cap)
          </button>
          <button
            onClick={() => setActiveTab("demand")}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${activeTab === "demand" ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-600/20" : "text-slate-400 hover:text-white"}`}
          >
            Demand Velocity
          </button>
        </div>
      </div>

      {/* Top Level Telemetry Widgets Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 hover:border-blue-500/30 transition-all">
          <span className="text-[10px] text-slate-500 font-mono uppercase">Global MarketCap</span>
          <div className="text-lg font-display font-bold text-white mt-1">${(totalMarketCap / 1000000).toFixed(2)}M</div>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> +14.8% (Q2)
          </span>
        </div>

        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 hover:border-blue-500/30 transition-all">
          <span className="text-[10px] text-slate-500 font-mono uppercase">Daily Escrow Locked</span>
          <div className="text-lg font-display font-bold text-white mt-1">$1.42M</div>
          <span className="text-[10px] text-blue-400 font-mono flex items-center gap-0.5 mt-0.5">
            <Cpu className="w-3 h-3 text-blue-400" /> Secure Pool
          </span>
        </div>

        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 hover:border-blue-500/30 transition-all">
          <span className="text-[10px] text-slate-500 font-mono uppercase">Avg Licensing APR</span>
          <div className="text-lg font-display font-bold text-white mt-1">11.64%</div>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5 mt-0.5">
            <ArrowUpRight className="w-3 h-3 text-emerald-400" /> Beat inflation
          </span>
        </div>

        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 hover:border-blue-500/30 transition-all">
          <span className="text-[10px] text-slate-500 font-mono uppercase">Active Grid Shards</span>
          <div className="text-lg font-display font-bold text-white mt-1">428 Nodes</div>
          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">100% Core Online</span>
        </div>
      </div>

      {/* Main Dynamically Swapped Recharts panels */}
      <div className="h-64 md:h-80 w-full relative z-10">
        
        {activeTab === "vol" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={COMMERCIAL_VOLUME_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSaas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorIp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#4b5563" fontSize={11} fontFamily="SFMono-Regular, Consolas, monospace" />
              <YAxis stroke="#4b5563" fontSize={11} fontFamily="SFMono-Regular, Consolas, monospace" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#020617", borderColor: "#2563eb" }}
                labelStyle={{ color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}
                itemStyle={{ color: "#3b82f6" }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
              <Area type="monotone" name="Digital SaaS ($k)" dataKey="saasVol" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorSaas)" />
              <Area type="monotone" name="IP Licensing ($k)" dataKey="ipLicensing" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorIp)" />
              <Area type="monotone" name="Space Commercial ($k)" dataKey="realEstateVol" stroke="#10b981" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === "alloc" && (
          <div className="grid grid-cols-1 md:grid-cols-2 items-center h-full gap-4">
            <div className="h-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SECTOR_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {SECTOR_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`$${value.toLocaleString()}`, "Capitalization Pool"]}
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#3b82f6", color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-[10px] text-slate-500 font-mono block uppercase">Total Pool</span>
                <span className="text-sm font-bold text-white font-display">${(totalMarketCap / 1000000).toFixed(1)}M</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 justify-center">
              {SECTOR_DISTRIBUTION.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs text-slate-300 font-sans">{entry.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    ${(entry.value / 1000).toFixed(0)}k credits
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "demand" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={RECENT_DEMAND_VECTORS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="industry" stroke="#4b5563" fontSize={11} fontFamily="JetBrains Mono" />
              <YAxis stroke="#4b5563" fontSize={11} fontFamily="JetBrains Mono" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#020617", borderColor: "#2563eb" }}
                labelStyle={{ color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}
                itemStyle={{ color: "#3b82f6" }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
              <Bar name="Velocity Index" dataKey="index" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {RECENT_DEMAND_VECTORS.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.acceleration >= 0 ? "#3b82f6" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

      </div>

      {/* Footnote stating ledger timestamp validation */}
      <div className="mt-4 border-t border-slate-800 pt-3 text-right flex justify-between items-center">
        <span className="text-[10px] text-slate-500 font-mono">Ledger block: #194,502 verified</span>
        <span className="text-[10px] text-blue-400 font-mono flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 rotate-45" /> Universal Neutron Time: 2026 UTC
        </span>
      </div>

    </div>
  );
}
