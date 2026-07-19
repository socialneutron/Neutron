import { useState, useEffect } from 'react';
import { ActiveSession, UserProfile, CryptoLogEntry } from '../types';
import { X, Shield, Lock, Eye, Smartphone, Trash2, Ban, ShieldCheck, AlertCircle, Key, RefreshCw, FileText } from 'lucide-react';
import type { E2ECryptoManager } from '../crypto/manager';

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
  myFingerprint: string;
  onRotateKeys: () => void;
  cryptoReady: boolean;
  cryptoManager: E2ECryptoManager | null;
}

type TabType = 'privacy' | 'security' | 'sessions' | 'audit';

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
  myFingerprint,
  onRotateKeys,
  cryptoReady,
  cryptoManager,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('privacy');
  const [newBlocked, setNewBlocked] = useState('');
  const [auditLogs, setAuditLogs] = useState<CryptoLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [rotating, setRotating] = useState(false);

  const handleAddBlock = () => {
    if (!newBlocked.trim()) return;
    onToggleBlockUser(newBlocked.trim());
    setNewBlocked('');
  };

  const loadAuditLogs = async () => {
    if (!cryptoManager) return;
    setLoadingLogs(true);
    try {
      const logs = await cryptoManager.getCryptoLogs(30);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load crypto logs:', err);
    }
    setLoadingLogs(false);
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const handleRotateKeys = async () => {
    setRotating(true);
    await onRotateKeys();
    setTimeout(() => setRotating(false), 1000);
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col h-[560px] max-h-full">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-[#00CFFF]" />
            <div>
              <h2 className="font-bold text-base text-white">Settings</h2>
              <p className="text-xs text-[#00CFFF]/80 font-mono">
                Fingerprint: {myFingerprint || 'Loading...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Tabs */}
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
              Privacy
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
              onClick={() => setActiveTab('audit')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'audit'
                  ? 'bg-[#00CFFF]/10 text-[#00CFFF] border-l-2 border-[#00CFFF]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4" />
              Crypto Audit
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

          {/* Content */}
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
                        className="w-4 h-4 rounded border-white/20 bg-black text-[#00CFFF] focus:ring-0 cursor-pointer"
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
                        className="w-4 h-4 rounded border-white/20 bg-black text-[#00CFFF] focus:ring-0 cursor-pointer"
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
                    <Key className="w-4 h-4 text-[#00CFFF]" /> Identity Key Pair
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Your ECDH P-256 key pair used for all end-to-end encrypted conversations.
                  </p>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-[#121212] rounded-xl border border-white/10 space-y-1.5">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#00CFFF] block">
                        YOUR FINGERPRINT
                      </span>
                      <p className="font-mono text-sm text-gray-300 break-all select-all leading-normal bg-black p-2.5 rounded border border-white/10">
                        {myFingerprint || 'Generating...'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#121212] rounded-xl border border-white/10 space-y-1.5">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#00CFFF] block">
                        ALGORITHM
                      </span>
                      <p className="font-mono text-xs text-gray-300 leading-normal">
                        ECDH P-256 + Double Ratchet + AES-256-GCM
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#121212] rounded-xl border border-white/10 space-y-1.5">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#00CFFF] block">
                        KEY STORAGE
                      </span>
                      <p className="font-mono text-xs text-gray-300 leading-normal">
                        IndexedDB (local device only) &mdash; never leaves your device
                      </p>
                    </div>

                    <button
                      onClick={handleRotateKeys}
                      disabled={rotating}
                      className="w-full flex items-center justify-center gap-2 bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/30 hover:bg-[#00CFFF]/25 text-xs font-bold font-mono px-3 py-2.5 rounded-lg transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${rotating ? 'animate-spin' : ''}`} />
                      {rotating ? 'ROTATING KEYS...' : 'ROTATE IDENTITY KEYS'}
                    </button>

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300 leading-relaxed">
                      <strong>Warning:</strong> Rotating keys will generate a new identity key pair. Existing conversations will need a new key exchange to re-establish encryption.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-[#00CFFF]" /> Cryptographic Audit Log
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Client-side log of all encryption operations. Stored in IndexedDB.
                  </p>

                  <button
                    onClick={loadAuditLogs}
                    className="mb-3 bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/30 hover:bg-[#00CFFF]/25 text-[10px] font-bold font-mono px-3 py-1 rounded transition"
                  >
                    {loadingLogs ? 'LOADING...' : 'REFRESH LOGS'}
                  </button>

                  <div className="space-y-1.5 max-h-80 overflow-y-auto">
                    {auditLogs.length === 0 && (
                      <div className="text-center py-8 bg-[#121212]/50 rounded-lg border border-dashed border-white/10">
                        <FileText className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                        <span className="text-xs text-gray-500">
                          {loadingLogs ? 'Loading logs...' : 'No cryptographic events logged yet.'}
                        </span>
                      </div>
                    )}
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-black p-2.5 rounded-lg border border-white/10 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] uppercase ${
                              log.type === 'keygen'
                                ? 'bg-purple-500/20 text-purple-300'
                                : log.type === 'encrypt'
                                ? 'bg-green-500/20 text-green-300'
                                : log.type === 'decrypt'
                                ? 'bg-blue-500/20 text-blue-300'
                                : log.type === 'key_exchange'
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : log.type === 'ratchet'
                                ? 'bg-orange-500/20 text-orange-300'
                                : 'bg-gray-500/20 text-gray-300'
                            }`}
                          >
                            {log.type}
                          </span>
                          <span className="text-gray-600 font-mono text-[10px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-400 leading-relaxed">{log.details}</p>
                        <p className="text-gray-600 font-mono text-[10px] mt-0.5">
                          {log.algorithm}
                        </p>
                      </div>
                    ))}
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
                            {sess.location} &bull;{' '}
                            <span className="font-mono">{sess.ipAddress}</span>
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
