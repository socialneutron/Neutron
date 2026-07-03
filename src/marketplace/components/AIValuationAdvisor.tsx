import React, { useState } from "react";
import { Cpu, HelpCircle, ShieldAlert, Sparkles, Loader2, ArrowRight } from "lucide-react";

interface EvaluationResult {
  simulated: boolean;
  analysis: string;
  riskRating: string;
  projectedValue: string;
}

const VALUATION_EXAMPLES = [
  {
    name: "Aero-Drive Hyper Charger",
    category: "Digital Assets",
    description: "Integrated planetary vehicle fast charging firmware. Currently active across 45 charging grids.",
    val: "$230,000",
    score: "78"
  },
  {
    name: "Luna-Grown Wheat Genome Patent",
    category: "Intellectual Property",
    description: "Gene strain optimized to thrive under low atmosphere, requiring 40% less soil humidity.",
    val: "$1,200,000",
    score: "92"
  },
  {
    name: "Jupiter Station Pod Lease",
    category: "Real Estate",
    description: "Premium single-tier habitat pod inside Jupiter Cloud base, guaranteed lease receipts till 2038.",
    val: "$640,000",
    score: "85"
  }
];

export default function AIValuationAdvisor() {
  const [assetName, setAssetName] = useState("");
  const [category, setCategory] = useState("Digital Assets");
  const [description, setDescription] = useState("");
  const [currentValuation, setCurrentValuation] = useState("");
  const [growthScore, setGrowthScore] = useState("80");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState("");

  const handleRunEvaluation = async (e?: React.FormEvent, customAsset?: typeof VALUATION_EXAMPLES[0]) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    const targetName = customAsset ? customAsset.name : assetName;
    const targetCat = customAsset ? customAsset.category : category;
    const targetDesc = customAsset ? customAsset.description : description;
    const targetVal = customAsset ? customAsset.val : currentValuation;
    const targetScore = customAsset ? customAsset.score : growthScore;

    if (!targetName) {
      setError("Asset Name is required to compute quantum metrics.");
      setLoading(false);
      return;
    }

    // Apply pre-fills if selected from custom list
    if (customAsset) {
      setAssetName(customAsset.name);
      setCategory(customAsset.category as any);
      setDescription(customAsset.description);
      setCurrentValuation(customAsset.val);
      setGrowthScore(customAsset.score);
    }

    try {
      const response = await fetch("/api/gemini/valuation-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetName: targetName,
          category: targetCat,
          description: targetDesc,
          currentValuation: targetVal,
          growthScore: targetScore
        })
      });

      if (!response.ok) {
        throw new Error("Server communication failure. Verification pipeline down.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError("Valuation error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative shadow-sm">
      <div className="absolute top-3 right-3 bg-blue-950/40 rounded px-2.5 py-0.5 border border-blue-500/40 text-[9px] font-mono font-bold text-blue-400 flex items-center gap-1">
        <Cpu className="w-3 h-3 text-blue-400 animate-spin-slow" /> Real-time Quantum Valuation Core
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-display font-medium text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" /> AI Pricing & Valuation Engine
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Submit any orbital corporate venture, domain license, or commercial building to evaluate against simulated orbital indices.
        </p>
      </div>

      {/* Quick Select Preset Templates */}
      <div className="mb-6">
        <span className="text-[10px] text-slate-505 font-mono uppercase block mb-2">Preset Valuation Scenarios</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {VALUATION_EXAMPLES.map((ex) => (
            <button
              key={ex.name}
              onClick={() => handleRunEvaluation(undefined, ex)}
              disabled={loading}
              className="text-left p-2.5 rounded bg-slate-950 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-900 text-xs transition-all flex flex-col justify-between h-20 cursor-pointer"
            >
              <span className="text-[9px] text-blue-400 font-mono uppercase">{ex.category}</span>
              <span className="text-white font-medium truncate block w-full mt-1">{ex.name}</span>
              <div className="flex justify-between items-center w-full mt-2">
                <span className="text-[10px] text-slate-500 font-mono">{ex.val}</span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                  Index: {ex.score}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Input Form */}
        <form onSubmit={(e) => handleRunEvaluation(e)} className="space-y-4">
          <div>
            <label className="text-[10px] text-slate-450 font-mono uppercase block mb-1">Self-Valuation ($)</label>
            <input
              type="text"
              placeholder="e.g. 240000"
              value={currentValuation}
              onChange={(e) => setCurrentValuation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-white rounded-lg p-2 text-xs font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-450 font-mono uppercase block mb-1">Asset Name</label>
            <input
              type="text"
              placeholder="e.g. Pulsar CDN Route"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-white rounded-lg p-2 text-xs font-mono outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-450 font-mono uppercase block mb-1">Asset Profile & Capabilities</label>
            <textarea
              placeholder="Detail the target revenue, codebase maturity, or licensing rights..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-white rounded-lg p-2 text-xs font-sans outline-none leading-relaxed"
            / >
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] text-slate-450 font-mono uppercase">Assigned Growth Score ({growthScore}%)</label>
            </div>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={growthScore}
              onChange={(e) => setGrowthScore(e.target.value)}
              className="w-full accent-blue-500 h-1 rounded bg-slate-950 appearance-none outline-none border border-slate-810"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold font-mono text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Recalculating Orbit...
              </>
            ) : (
              <>
                Analyze Asset with Gemini
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>

          {error && (
            <div className="p-2.5 bg-red-950/45 border border-red-500/40 rounded-lg text-xs text-red-400 font-mono">
              ⚠️ {error}
            </div>
          )}
        </form>

        {/* Results Block Column */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Quantum Report</span>
              {result && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${result.simulated ? 'bg-amber-950 text-amber-400 border border-amber-900/40' : 'bg-blue-950 text-blue-450 border border-blue-500/20'}`}>
                  {result.simulated ? "SIMULATED INSIGHT" : "LIVE GEMINI TELEMETRY"}
                </span>
              )}
            </div>

            {/* Markdown Display space */}
            {result ? (
              <div className="space-y-4 font-sans text-xs text-slate-300 leading-relaxed overflow-y-auto max-h-72 pr-1">
                {/* Simulated metadata labels */}
                <div className="grid grid-cols-2 gap-2 mb-2 bg-slate-900/60 p-2.5 rounded border border-gray-800/40">
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono block uppercase">Risk Rating</span>
                    <span className="text-xs text-white font-mono font-bold">{result.riskRating}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-505 font-mono block uppercase">Projected Value (Pro)</span>
                    <span className="text-xs text-blue-400 font-mono font-bold">{result.projectedValue}</span>
                  </div>
                </div>

                <div className="text-slate-200 whitespace-pre-wrap font-mono prose prose-xs prose-invert max-w-none text-[11px]">
                  {result.analysis}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                <ShieldAlert className="w-8 h-8 text-slate-800 stroke-[1.5] mb-2" />
                <span className="text-xs text-slate-400 font-medium">Ready for input telemetry</span>
                <p className="text-[11px] text-slate-500 max-w-[240px] mt-1 leading-relaxed">
                  Enter asset parameters or click an evaluation preset above to query Gemini analysis.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-850 pt-3 text-[10px] text-slate-505 font-mono text-center">
            Standard deviation index: ±1.24% of Earth-spot values.
          </div>
        </div>
      </div>
    </div>
  );
}
