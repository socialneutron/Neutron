import React, { useState } from "react";
import { Talent } from "../types";
import { Star, ShieldCheck, MapPin, Calendar, Play, Pause, ChevronRight, Music, Users } from "lucide-react";

interface TalentCardProps {
  key?: string;
  talent: Talent;
  onBookRequest: (talent: Talent) => void;
  onMockMessage: (talent: Talent) => void;
}

export default function TalentCard({ talent, onBookRequest, onMockMessage }: TalentCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col group hover:border-blue-500/40 transition-all duration-300 relative">
      
      {/* Top Background Glow Card */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-950/10 to-transparent pointer-events-none" />

      {/* Main Stats Segment */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header row with Avatar & Name */}
          <div className="flex gap-4 items-start mb-4">
            <div className="relative">
              <img 
                src={talent.avatar} 
                alt={talent.name}
                className="w-16 h-16 rounded-xl object-cover border-2 border-blue-500/35 group-hover:border-blue-400"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-blue-500/50 p-0.5 rounded-full" title="Verified Creator Account">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-blue-400 font-mono tracking-wider uppercase font-semibold">Verified Talent</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-mono text-white font-bold">{talent.rating.toFixed(2)}</span>
                </div>
              </div>
              <h4 className="text-lg font-display font-medium text-white group-hover:text-blue-400 transition-colors duration-300 tracking-tight">
                {talent.name}
              </h4>
              <p className="text-slate-450 text-xs font-mono">{talent.role}</p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {talent.tags.map((tag) => (
              <span key={tag} className="bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>

          <p className="text-xs text-slate-350 mb-4 h-12 line-clamp-3 leading-relaxed">
            {talent.bio}
          </p>

          {/* Interactive Audio demo preview slot */}
          {talent.audioPreview && (
            <div className="bg-slate-950/85 rounded-xl p-2.5 mb-4 border border-blue-500/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <div className="w-8 h-8 rounded-full bg-blue-950/50 flex items-center justify-center border border-blue-500/20 text-blue-400 shrink-0">
                  <Music className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[9px] text-slate-500 font-mono block uppercase">Audio Showcase</span>
                  <span className="text-xs text-white block truncate">{talent.audioPreview}</span>
                </div>
              </div>

              {/* Toggle Audio Play button */}
              <button 
                onClick={handleTogglePlay}
                className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors shrink-0 flex items-center justify-center cursor-pointer animate-pulse"
                title={isPlaying ? "Pause System Demo" : "Play System Demo"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
              </button>
            </div>
          )}

          {/* Simulated availability checker select */}
          <div className="mb-4">
            <span className="text-[10px] text-slate-500 font-mono block uppercase mb-1.5">Availability Slot</span>
            <div className="grid grid-cols-3 gap-1.5">
              {["2026-06-18", "2026-06-25", "2026-07-02"].map((d) => {
                const isBooked = talent.availability.includes(d);
                const isSelected = selectedDate === d;
                return (
                  <button
                    key={d}
                    disabled={isBooked}
                    onClick={() => setSelectedDate(d)}
                    className={`text-[10px] font-mono py-1 rounded-lg text-center transition-all cursor-pointer ${
                      isBooked 
                        ? "bg-red-950/20 text-red-500/50 border border-slate-900 cursor-not-allowed line-through" 
                        : isSelected
                        ? "bg-blue-600 text-white font-bold border border-blue-500 shadow-md shadow-blue-900/50"
                        : "bg-slate-950 text-slate-400 border border-slate-800 hover:border-blue-500/30"
                    }`}
                  >
                    {d.slice(5)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pricing tag & book CTA */}
        <div>
          <div className="border-t border-slate-800 pt-3 flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Enterprise Day Rate</span>
              <span className="text-lg font-display font-medium text-white">
                ${talent.dayRate.toLocaleString()}<span className="text-xs text-slate-500"> Credits / day</span>
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-450">
              <MapPin className="w-3 h-3 text-blue-450" />
              <span>{talent.countries[0]}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => onMockMessage(talent)}
              className="py-2 font-mono text-[11px] text-center text-slate-300 border border-slate-800 bg-transparent hover:border-blue-400/50 hover:bg-slate-950/50 rounded-lg transition-all cursor-pointer"
            >
              Message agent
            </button>
            <button
              onClick={() => {
                // Attach selected date
                const finalTalent = { ...talent, selectedDate };
                onBookRequest(finalTalent);
              }}
              className="py-2 bg-blue-600/10 hover:bg-blue-650/20 border border-blue-500/20 text-blue-400 font-mono text-[11px] hover:text-white rounded-lg text-center block font-bold transition-all hover:glow-blue cursor-pointer"
            >
              Secure Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
