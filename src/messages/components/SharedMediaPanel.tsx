import React, { useState } from 'react';
import { Conversation, Message, Attachment } from '../types';
import {
  X,
  Grid,
  FileText,
  Volume2,
  Lock,
  Eye,
  Download,
  UserX,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Shield,
  Clock,
  Calendar,
  Share2,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SharedMediaPanelProps {
  conversation: Conversation;
  onClose: () => void;
  onToggleBlock: (id: string) => void;
  onToggleReport: (id: string) => void;
  isPlaintextToggle: boolean;
}

type TabType = 'media' | 'files' | 'voice' | 'info';

export default function SharedMediaPanel({
  conversation,
  onClose,
  onToggleBlock,
  onToggleReport,
  isPlaintextToggle,
}: SharedMediaPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('media');
  const [selectedMedia, setSelectedMedia] = useState<Message | null>(null);
  const [inspectingFile, setInspectingFile] = useState<Message | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);

  const participant = conversation.participant;

  // Filter messages by type or attachments
  const messages = conversation.messages;

  // 1. Media: images, svgs, unsplash images, videos
  const mediaMessages = messages.filter((msg) => {
    if (msg.type === 'image' || msg.type === 'video') return true;
    if (msg.attachment?.type.startsWith('image/') || msg.attachment?.type.startsWith('video/')) return true;
    return false;
  });

  // 2. Files: anything that is a file and not an image
  const fileMessages = messages.filter((msg) => {
    if (msg.type === 'file') {
      const isImg = msg.attachment?.type.startsWith('image/');
      return !isImg;
    }
    return false;
  });

  // 3. Voice notes
  const voiceMessages = messages.filter((msg) => {
    return msg.type === 'voice' || msg.voiceDuration;
  });

  // Safe format date
  const formatDate = (dateInput: Date | string) => {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0.9 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0.9 }}
      transition={{ type: 'spring', damping: 24, stiffness: 220 }}
      className="w-full md:w-[380px] lg:w-[420px] h-full bg-[#070b1e] border-l border-white/10 flex flex-col relative z-20 overflow-hidden text-gray-200"
    >
      {/* Header bar inspired by Instagram DM Detail Screen */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
        <span className="font-display font-bold text-sm text-white tracking-wide uppercase">
          Details
        </span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
          title="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-white/5">
        
        {/* Profile Card Section */}
        <div className="p-6 flex flex-col items-center text-center bg-gradient-to-b from-black/20 to-transparent">
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-pink-500 via-purple-600 to-[#4DA6FF] rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 animated-instagram-ring" />
            <img
              src={participant.avatar}
              alt={participant.username}
              className="relative w-20 h-20 rounded-full object-cover border-2 border-slate-900"
              referrerPolicy="no-referrer"
            />
            {participant.online && (
              <span className="absolute bottom-1 right-1 block h-4 w-4 rounded-full bg-green-500 ring-4 ring-[#070b1e] animate-pulse" />
            )}
          </div>

          <h2 className="mt-4 font-display font-extrabold text-lg text-white flex items-center gap-1.5">
            {participant.username}
            {participant.isVerified && (
              <span className="inline-flex items-center justify-center bg-[#4DA6FF] text-[#070b1e] p-0.5 rounded-full" title="Verified secure channel">
                <Shield className="w-3.5 h-3.5 fill-current" />
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-1 select-all tracking-wider bg-black/30 px-2 py-0.5 rounded border border-white/5">
            FP: {participant.encryptionKeyFingerprint}
          </p>
          <p className="mt-3 text-xs text-gray-300 italic max-w-xs leading-relaxed px-4">
            "{participant.statusText}"
          </p>

          {/* Quick Instagram-style DM Actions */}
          <div className="grid grid-cols-3 gap-3 w-full mt-6 max-w-xs">
            <button
              onClick={() => onToggleBlock(conversation.id)}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                conversation.isBlocked
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  : 'bg-black/40 border-white/10 hover:border-white/20 text-gray-300'
              }`}
            >
              <UserX className="w-4 h-4" />
              <span>{conversation.isBlocked ? 'Blocked' : 'Block'}</span>
            </button>
            <button
              onClick={() => onToggleReport(conversation.id)}
              disabled={conversation.isReported}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                conversation.isReported
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 opacity-60'
                  : 'bg-black/40 border-white/10 hover:border-white/20 text-gray-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{conversation.isReported ? 'Reported' : 'Report'}</span>
            </button>
            <div className="py-2 px-3 rounded-xl border border-white/10 bg-black/40 flex flex-col items-center gap-1.5 text-gray-300">
              <Lock className="w-4 h-4 text-[#4DA6FF]" />
              <span className="text-[10px] uppercase font-mono tracking-wide text-gray-400">E2EE Live</span>
            </div>
          </div>
        </div>

        {/* Tab Selection Row (Instagram inspired icons / thin borders) */}
        <div className="bg-black/20 backdrop-blur">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-3 px-1 text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'media'
                  ? 'border-[#4DA6FF] text-[#4DA6FF]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Media ({mediaMessages.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 py-3 px-1 text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'files'
                  ? 'border-[#4DA6FF] text-[#4DA6FF]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Files ({fileMessages.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex-1 py-3 px-1 text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'voice'
                  ? 'border-[#4DA6FF] text-[#4DA6FF]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>Audio ({voiceMessages.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-3 px-1 text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'info'
                  ? 'border-[#4DA6FF] text-[#4DA6FF]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Keys</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-4 bg-black/10 min-h-[220px]">
          <AnimatePresence mode="wait">
            
            {/* 1. MEDIA GRID */}
            {activeTab === 'media' && (
              <motion.div
                key="media-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="space-y-3"
              >
                {mediaMessages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-500 font-semibold flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 text-white/10" />
                    <span>No media has been shared in this chat.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {mediaMessages.map((msg) => {
                      const attach = msg.attachment;
                      const fallbackUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&q=80';
                      const urlToUse = attach?.url || fallbackUrl;

                      return (
                        <div
                          key={msg.id}
                          className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer border border-white/5 bg-slate-950"
                          onClick={() => setSelectedMedia(msg)}
                        >
                          <img
                            src={urlToUse}
                            alt={attach?.name || 'Shared Media'}
                            className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-110 transition duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-end p-1.5">
                            <span className="text-[9px] font-semibold text-white/95 truncate">
                              {attach?.name || 'Photo'}
                            </span>
                            <span className="text-[7.5px] text-[#4DA6FF] font-mono">
                              {attach?.size || 'unknown'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. DOCUMENTS & FILES */}
            {activeTab === 'files' && (
              <motion.div
                key="files-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="space-y-2.5"
              >
                {fileMessages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-500 font-semibold flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-white/10" />
                    <span>No document attachments shared yet.</span>
                  </div>
                ) : (
                  fileMessages.map((msg) => {
                    const attach = msg.attachment;
                    if (!attach) return null;
                    return (
                      <div
                        key={msg.id}
                        className="bg-black/35 hover:bg-black/55 border border-white/5 hover:border-[#4DA6FF]/35 rounded-xl p-3 flex items-start gap-3 transition cursor-pointer"
                        onClick={() => setInspectingFile(msg)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate hover:text-[#4DA6FF] transition">
                            {attach.name}
                          </h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {attach.size} • {attach.type.split('/')[1] || 'binary'}
                          </p>
                          <p className="text-[8px] text-gray-500 font-mono mt-1">
                            Dispatched: {formatDate(msg.timestamp)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 shrink-0 self-center" />
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}

            {/* 3. VOICE RECORDINGS */}
            {activeTab === 'voice' && (
              <motion.div
                key="voice-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="space-y-2.5"
              >
                {voiceMessages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-500 font-semibold flex flex-col items-center gap-2">
                    <Volume2 className="w-8 h-8 text-white/10" />
                    <span>No audio voice messages found.</span>
                  </div>
                ) : (
                  voiceMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-black/35 border border-white/5 rounded-xl p-3 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          <Volume2 className="w-4 h-4 text-[#4DA6FF] animate-pulse" />
                          <span className="font-bold">Secure Voice Memo</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#4DA6FF] bg-[#4DA6FF]/10 px-1.5 py-0.5 rounded">
                          {msg.voiceDuration || '0:03'}
                        </span>
                      </div>

                      {/* Interactive visualizer waveform simulation */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsPlayingAudio(isPlayingAudio === msg.id ? null : msg.id)}
                          className="w-8 h-8 rounded-full bg-[#4DA6FF] hover:bg-white text-black flex items-center justify-center shrink-0 transition"
                        >
                          {isPlayingAudio === msg.id ? (
                            <div className="flex gap-0.5 items-center justify-center">
                              <span className="w-1 h-3 bg-black animate-pulse" />
                              <span className="w-1 h-3 bg-black animate-pulse delay-75" />
                            </div>
                          ) : (
                            <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </button>

                        <div className="flex-1 flex items-end gap-0.5 h-6 overflow-hidden pb-1">
                          {[50, 80, 45, 90, 30, 75, 40, 85, 60, 95, 30, 45, 80, 50, 70, 40, 85, 30, 60, 40, 80, 25, 45].map((height, i) => (
                            <span
                              key={i}
                              className={`flex-1 rounded-sm transition-all duration-300 ${
                                isPlayingAudio === msg.id
                                  ? 'bg-[#4DA6FF] animate-pulse'
                                  : 'bg-white/10'
                              }`}
                              style={{
                                height: isPlayingAudio === msg.id ? `${height * Math.random() + 10}%` : `${height / 2}%`,
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[8.5px] text-gray-500 font-mono">
                        <span>SENT: {formatDate(msg.timestamp)}</span>
                        <span>AES-256 SECURED</span>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* 4. RATCHETS & SECURITY DEBRIEF */}
            {activeTab === 'info' && (
              <motion.div
                key="info-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="space-y-4 text-xs"
              >
                <div className="bg-black/30 border border-white/5 rounded-xl p-4.5 space-y-3.5">
                  <h3 className="text-white font-bold flex items-center gap-1.5 font-display text-sm">
                    <Lock className="w-4 h-4 text-[#4DA6FF]" />
                    Symmetric Key Details
                  </h3>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Dynamic Master Key</span>
                      <span className="font-mono text-gray-200 select-all font-semibold overflow-x-auto whitespace-nowrap block bg-slate-950 px-2.5 py-1.5 rounded border border-white/5 mt-1">
                        {isPlaintextToggle ? conversation.sharedEncryptionKey : '••••••••••••••••••••••••••••••••'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Ratchet Index</span>
                      <span className="font-mono text-[#4DA6FF] font-semibold">STATE_BLOCK_{conversation.messages.length + 8}a</span>
                    </div>

                    <div className="pt-2 border-t border-white/5 space-y-1 text-gray-300 text-[11px] leading-relaxed">
                      <p>• Computed over Curve25519</p>
                      <p>• Symmetric Ratchet Cipher: AES-GCM-256</p>
                      <p>• Ephemeral public/private handshake confirmed</p>
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 border border-white/5 rounded-xl p-4.5 space-y-2.5">
                  <h3 className="text-white font-bold flex items-center gap-1.5 font-display text-sm">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Channel Logs
                  </h3>
                  <div className="space-y-1.5 font-mono text-[9px] text-gray-400">
                    <div className="flex justify-between">
                      <span>KEYPAIR CREATION:</span>
                      <span className="text-white">OK (2026-06-14)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SIGNATURE VERIFICATION:</span>
                      <span className="text-emerald-400 font-bold">MATCHED ✅</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DISAPPEARING PROTOCOL:</span>
                      <span className="text-amber-400">
                        {conversation.disappearingSetting > 0 ? `${conversation.disappearingSetting}s Delay` : 'DISABLED'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>PREKEYS IN FLIGHT:</span>
                      <span className="text-white">16 Rachets Active</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer info brand */}
        <div className="p-6 text-center text-[10px] text-gray-500 font-mono tracking-wider">
          NEUTRON CRYPTO SHELL PORT 3000
        </div>
      </div>

      {/* Lightbox Modal overlay for Media Previews (Instagram feel) */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 z-30 p-4 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center text-white p-2">
              <span className="text-xs font-bold font-mono tracking-wider uppercase text-gray-400">Preview Media</span>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <img
                src={selectedMedia.attachment?.url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80'}
                alt={selectedMedia.attachment?.name}
                className="max-h-[60%] max-w-full rounded-xl object-contain border border-white/10 select-none shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-white">{selectedMedia.attachment?.name}</h4>
                  <p className="text-[10px] text-[#4DA6FF] mt-0.5">{selectedMedia.attachment?.size}</p>
                </div>
                <a
                  href={selectedMedia.attachment?.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition flex items-center gap-1.5 text-[9.5px] font-bold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Full-res</span>
                </a>
              </div>
              <p className="text-[10px] text-gray-400 italic">"{selectedMedia.text}"</p>
              <div className="text-[8px] text-gray-500 font-mono flex justify-between">
                <span>SENT BY: {selectedMedia.senderId === 'me' ? 'Navigator (You)' : participant.username}</span>
                <span>{formatDate(selectedMedia.timestamp)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox / Inspector for non-image Bin/PEM files */}
      <AnimatePresence>
        {inspectingFile && inspectingFile.attachment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 z-30 p-4 flex flex-col"
          >
            <div className="flex justify-between items-center text-white pb-3 border-b border-white/10">
              <span className="text-xs font-bold font-mono text-[#4DA6FF] uppercase tracking-wider">File Decryption Sandbox</span>
              <button
                onClick={() => setInspectingFile(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition animate-none"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-4">
              <div className="p-4 bg-slate-950/80 border border-[#4DA6FF]/10 rounded-xl flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-950 flex items-center justify-center text-[#4DA6FF]">
                  <FileText className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">{inspectingFile.attachment.name}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">{inspectingFile.attachment.size} • {inspectingFile.attachment.type}</p>
                </div>
              </div>

              {/* Hex / Binary visualizer */}
              <div className="space-y-1.5">
                <span className="text-[9.5px] font-bold text-gray-400 font-mono block uppercase">RAW BINARY DATA STREAMS:</span>
                <div className="p-3.5 bg-black/80 font-mono text-[10px] text-yellow-500 leading-relaxed rounded-xl border border-yellow-500/10 h-44 overflow-y-auto break-all select-all">
                  {inspectingFile.attachment.rawBytesSimulated ? (
                    inspectingFile.attachment.rawBytesSimulated
                  ) : (
                    'AE8F012B9D33E678B2A10C249EFF4EA23B70119A2BC35F7E00CE'
                  )}
                  {'\n\n[E2EE PACKET STRUCTURE VERIFIED]\n[DECODE STACK OK]\n[CIPHER: AES-GCM-256]'}
                </div>
              </div>

              <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5 text-[10.5px] text-gray-300 leading-normal">
                <p className="font-extrabold text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#4DA6FF]" /> Timestamped Ledger Frame
                </p>
                <p>Calculated secure path exchange confirmed. Payload authenticated on secure device client sandbox.</p>
              </div>
            </div>

            <button
              onClick={() => {
                alert(`Interactive Sandbox Simulator: Simulated download profile started for file "${inspectingFile.attachment?.name}"!`);
                setInspectingFile(null);
              }}
              className="w-full bg-[#4DA6FF] hover:bg-white text-black font-semibold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 mt-auto"
            >
              <Download className="w-4 h-4" />
              <span>Simulate Local Decrypted Export</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
