import React, { useState } from "react";
import { AuditLog, Asset } from "../types";
import { ShieldCheck, Server, AlertTriangle, Key, Terminal, QrCode, RefreshCw } from "lucide-react";

interface SecurityCenterProps {
  auditLogs: AuditLog[];
  ownedAssetIds: string[];
  allAssets: Asset[];
}

export default function SecurityCenter({ auditLogs, ownedAssetIds, allAssets }: SecurityCenterProps) {
  const [mfaSecret, setMfaSecret] = useState("NTRN-KEY-99F-SYS");
  const [mfaActive, setMfaActive] = useState(true);
  const [mfaCode, setMfaCode] = useState("402 188");
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate a random 6-digit space MFA code
  const handleRegenerateMfa = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const code1 = Math.floor(Math.random() * 900) + 100;
      const code2 = Math.floor(Math.random() * 900) + 100;
      setMfaCode(`${code1} ${code2}`);
      setIsGenerating(false);
    }, 800);
  };

  // Find actual asset objects that the user has bought
  const ownedAssets = allAssets.filter(a => ownedAssetIds.includes(a.id));

  return (
    <div className="space-y-6">
      
      {/* Upper Security Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Physical multi-factor authenticator token */}
        <div className="lg:col-span-12 xl:col-span-5 bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono text-blue-400 font-bold block flex items-center gap-1">
                  <Key className="w-3.5 h-3.5" /> Quantum MFA Core
                </span>
                <h4 className="text-base font-display text-white mt-0.5">Biometric Key Crypt</h4>
              </div>
              <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-800 px-2 py-0.5 text-[9px] rounded font-mono uppercase font-semibold">Active</span>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-lg border border-gray-800 flex items-center justify-between gap-4 mb-4">
              <div className="flex-1">
                <span className="text-[9px] text-gray-500 font-mono block uppercase">Grid Access Code</span>
                <span className="text-2xl font-mono text-white tracking-widest font-bold glow-text block mt-1">
                  {mfaCode}
                </span>
                <span className="text-[9px] text-gray-400 block mt-1.5 leading-relaxed">
                  Rotates on anti-friction clock cycles to safeguard escrow wallets from planetary interception vectors.
                </span>
              </div>

              <div className="shrink-0 p-2 bg-slate-900 border border-blue-500/20 rounded-lg">
                <QrCode className="w-12 h-12 text-blue-400" />
              </div>
            </div>
          </div>

          <div>
            <div className="border-t border-gray-900 pt-3 flex items-center justify-between">
              <span className="text-[9px] text-gray-500 font-mono">Secret: {mfaSecret}</span>
              <button
                onClick={handleRegenerateMfa}
                disabled={isGenerating}
                className="flex items-center gap-1 py-1.5 px-3 bg-slate-905 border border-blue-500/20 rounded-lg text-[11px] font-mono text-blue-400 hover:border-blue-500 hover:text-white hover:bg-slate-950 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                Rotate Token
              </button>
            </div>
          </div>
        </div>

        {/* Ownership Vault List */}
        <div className="lg:col-span-12 xl:col-span-7 bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono text-blue-400 font-bold block flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Consensus Sovereign Vault
                </span>
                <h4 className="text-base font-display text-white mt-0.5">Asset Registration Ledger</h4>
              </div>
              <span className="text-xs font-mono text-blue-400 font-bold font-semibold">
                {ownedAssets.length} Cryptographic Keys Owned
              </span>
            </div>

            {ownedAssets.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {ownedAssets.map((asset) => (
                  <div key={asset.id} className="p-2.5 bg-slate-950/65 rounded-lg border border-slate-850 flex justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded overflow-hidden">
                        <img src={asset.image} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <span className="text-xs text-white font-medium block">{asset.name}</span>
                        <span className="text-[9px] text-gray-500 block font-mono uppercase">ID: {asset.id.toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 font-mono block">Consensus: 100%</span>
                      <span className="text-[9px] text-gray-400 font-mono uppercase block">Registered epiclegend766</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-28 flex flex-col items-center justify-center text-center p-4 border border-dashed border-gray-800 rounded">
                <AlertTriangle className="w-6 h-6 text-slate-850 mb-1" />
                <span className="text-xs text-gray-400 font-medium">No active assets owned.</span>
                <p className="text-[10px] text-gray-500 max-w-xs mt-0.5">
                  Go to the Explorer or Home tab, click on "Acquire / Bid" and lock/verify the escrow process to establish ownership registries.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-900 pt-3 text-[10px] text-gray-500 font-mono">
            Vault security standard: ECDSA-256-R1 Node Protection Enabled.
          </div>
        </div>

      </div>

      {/* Interactive System Security logs */}
      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            <div>
              <h4 className="text-sm font-display text-white">System Security Ledger Logs</h4>
              <span className="text-[10px] text-gray-500 font-mono">Audit trailing ledger for account epiclegend766@gmail.com</span>
            </div>
          </div>

          <div className="text-xs font-mono text-blue-400 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-lg">
            Audit Nodes: Active
          </div>
        </div>

        <div className="bg-slate-950 rounded-lg p-3 border border-gray-850 max-h-56 overflow-y-auto font-mono text-[11px] leading-relaxed text-gray-300 space-y-2">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex gap-4 items-start py-1 border-b border-gray-900 last:border-0 hover:bg-slate-900/45 transition-colors duration-200">
              <span className="text-gray-500 shrink-0 select-none">[{log.timestamp.slice(11)}]</span>
              <span className={`shrink-0 select-all font-bold ${log.category === "SECURITY" ? "text-blue-400" : log.category === "TRANSACTION" ? "text-emerald-400" : "text-indigo-400"}`}>
                {log.action}
              </span>
              <span className="flex-1 text-gray-300">{log.details}</span>
              <span className="text-gray-600 font-mono shrink-0 select-all text-[10px]">{log.ipAddress}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
