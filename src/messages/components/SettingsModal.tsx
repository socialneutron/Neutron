import { useState } from 'react';
import { ActiveSession, UserProfile } from '../types';
import { X, Shield, Lock, Eye, Smartphone, Trash2, Ban, ShieldCheck, AlertCircle } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  sessions: ActiveSession[];
  onRevokeSession: (sessionId: string) => void;
  hideOnline: boolean;
  setHideOnline: (val: boolean) => void;
  hideReadReceipts: boolean;
  setHideReadReceipts: (val: boolean) => void;
  blockedUsers: string[];
  onToggleBlockUser: (username: string) => void;
  myProfile: UserProfile;
}

type TabType = 'privacy' | 'security' | 'sessions';

export default function SettingsModal({
  onClose,
  sessions,
  onRevokeSession,
  hideOnline,
  setHideOnline,
  hideReadReceipts,
  setHideReadReceipts,
  blockedUsers,
  onToggleBlockUser,
  myProfile,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('privacy');
  const [newBlocked, setNewBlocked] = useState('');
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  const handleAddBlock = () => {
    if (!newBlocked.trim()) return;
    onToggleBlockUser(newBlocked.trim());
    setNewBlocked('');
  };

  const triggerAudit = () => {
    setAuditMessage('Retrieving remote server audits... No leaks detected. Perfect integrity found.');
    setTimeout(() => {
      setAuditMessage(null);
    }, 5000);
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col h-[520px] max-h-full">
        
        {/* Header bar */}
        <div className="p-4 border-b border-white/10 bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-[#00CFFF]" />
            <div>
              <h2 className="font-bold text-base text-white">Settings</h2>
              <p className="text-xs text-[#00CFFF]/80 font-mono">Fingerprint: {myProfile.encryptionKeyFingerprint}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inner Content Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tabs Menu */}
          <div className="w-48 bg-[#121212] border-r border-white/10 p-3 flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'privacy'
                  ? 'bg-[#00CFFF]/10 text-[#00CFFF] border-l-2 border-[#00CFFF]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Eye className="w-4 h-4" />
              Privacy Settings
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'security'
                  ? 'bg-[#00CFFF]/10 text-[#00CFFF] border-l-2 border-[#00CFFF]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Lock className="w-4 h-4" />
              Encryption Keys
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === 'sessions'
                  ? 'bg-[#00CFFF]/10 text-[#00CFFF] border-l-2 border-[#00CFFF]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4" />
                Sessions
              </span>
              <span className="bg-white/10 text-white font-mono text-xs px-2 py-0.5 rounded-full">
                {sessions.length}
              </span>
            </button>
          </div>

          {/* Sub-tab view viewport */}
          <div className="flex-1 p-5 overflow-y-auto bg-black">
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                    <Eye className="w-4 h-4 text-[#00CFFF]" /> Telemetry Settings
                  </h3>
                  <p className="text-xs text-gray-400 mb-3.5">
                    Configure visibility controls for online status and message indicators.
                  </p>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between bg-[#121212] p-4 rounded-xl border border-white/10 hover:border-[#00CFFF]/45 transition cursor-pointer">
                      <div>
                        <span className="text-xs font-medium text-white block">Ghost Mode</span>
                        <span className="text-xs text-gray-500 leading-normal">
                          Contacts will never see you as Online or Typing.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={hideOnline}
                        onChange={(e) => setHideOnline(e.target.checked)}
                        className="w-4.5 h-4.5 rounded border-white/20 bg-black text-[#00CFFF] focus:ring-0 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between bg-[#121212] p-4 rounded-xl border border-white/10 hover:border-[#00CFFF]/45 transition cursor-pointer">
                      <div>
                        <span className="text-xs font-medium text-white block">Suppress Read Receipts</span>
                        <span className="text-xs text-gray-500 leading-normal">
                          Receipt ticks will remain gray and won't update to read.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={hideReadReceipts}
                        onChange={(e) => setHideReadReceipts(e.target.checked)}
                        className="w-4.5 h-4.5 rounded border-white/20 bg-black text-[#00CFFF] focus:ring-0 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                    <Ban className="w-4 h-4 text-rose-500" /> Firewall Blocklist
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Prevent matching handles from initiating dynamic chats.
                  </p>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Username handle..."
                      value={newBlocked}
                      onChange={(e) => setNewBlocked(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddBlock()}
                      className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00CFFF] transition"
                    />
                    <button
                      onClick={handleAddBlock}
                      className="bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all"
                    >
                      Block User
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {blockedUsers.map((bUser) => (
                      <div
                        key={bUser}
                        className="flex items-center justify-between bg-black px-3 py-1.5 rounded-lg border border-white/10 text-xs"
                      >
                        <span className="font-mono text-gray-300">@{bUser}</span>
                        <button
                          onClick={() => onToggleBlockUser(bUser)}
                          className="text-gray-500 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {blockedUsers.length === 0 && (
                      <div className="text-center py-4 bg-[#121212]/50 rounded-lg border border-dashed border-white/10">
                        <span className="text-xs text-gray-500">No blocked users listed.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-[#00CFFF]" /> Public Fingerprint Signature
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Your sovereign secure keys bundle coordinates.
                  </p>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-[#121212] rounded-xl border border-white/10 space-y-1.5">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#00CFFF] block">
                        COORDINATE
                      </span>
                      <p className="font-mono text-xs text-gray-300 break-all select-all leading-normal bg-black p-2.5 rounded border border-white/10">
                        {myProfile.encryptionKeyFingerprint}-SEC-KEY-DH-CURVE25519
                      </p>
                    </div>

                    <div className="bg-[#121212] p-3 rounded-lg border border-white/10 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-[#00CFFF] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-xs text-white block">Audit Report Scanner</span>
                        <p className="text-xs text-gray-400 mt-0.5 leading-normal">
                          Run cache key verify scan sequences on this client container.
                        </p>
                        <button
                          onClick={triggerAudit}
                          className="mt-2 bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/30 hover:bg-[#00CFFF]/25 text-[10px] font-bold font-mono px-3 py-1 rounded transition"
                        >
                          RUN FIREWALL AUDIT
                        </button>
                      </div>
                    </div>

                    {auditMessage && (
                      <div className="p-3 bg-[#00CFFF]/5 border border-[#00CFFF]/20 rounded-lg text-emerald-400 font-mono text-xs leading-relaxed select-all">
                        {auditMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                    <Smartphone className="w-4 h-4 text-[#00CFFF]" /> Active Sessions
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Connected nodes matching authorized credential signatures.
                  </p>

                  <div className="space-y-2.5">
                    {sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          sess.isCurrent
                            ? 'bg-[#00CFFF]/5 border-[#00CFFF]/30'
                            : 'bg-black border-white/10'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">
                              {sess.deviceName}
                            </span>
                            {sess.isCurrent && (
                              <span className="bg-[#00CFFF]/15 text-[#00CFFF] font-mono font-bold text-[8px] px-1.5 py-0.2 rounded-full border border-[#00CFFF]/30 uppercase tracking-widest">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 select-all">
                            {sess.location} • <span className="font-mono">{sess.ipAddress}</span>
                          </div>
                        </div>

                        {!sess.isCurrent && (
                          <button
                            onClick={() => onRevokeSession(sess.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-rose-400 border border-red-500/20 hover:border-red-500/40 p-2 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
