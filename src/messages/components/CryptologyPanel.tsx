import { useState } from 'react';
import { Conversation, CryptographicLog } from '../types';
import { Shield, Key, Lock } from 'lucide-react';

interface CryptologyPanelProps {
  conversation: Conversation;
  logs: CryptographicLog[];
  onVerify: (id: string) => void;
  isPlaintextToggle: boolean;
  onPlaintextToggle: () => void;
}

export default function CryptologyPanel({
  conversation,
  logs,
  onVerify,
  isPlaintextToggle,
  onPlaintextToggle,
}: CryptologyPanelProps) {
  const [copiedKey, setCopiedKey] = useState(false);

  const copyKeyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const currentFingerprint = conversation.participant.encryptionKeyFingerprint;

  return (
    <div className="w-full lg:w-80 bg-black border-l border-white/10 flex flex-col h-full overflow-y-auto font-sans text-sm text-white">
      {/* Title Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#121212]">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#00CFFF]" />
          <span className="font-semibold tracking-wide uppercase text-xs text-gray-200">
            Security Details
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#00CFFF]/10 text-[#00CFFF] px-2.5 py-0.5 rounded-full border border-[#00CFFF]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00CFFF]" />
          <span className="font-mono text-[10px] font-bold">SECURE PROTOCOL</span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="p-4 space-y-5">
        {/* Dynamic encryption checklist */}
        <div className="space-y-3 bg-[#121212] p-4 rounded-xl border border-white/10">
          <div className="flex items-center justify-between text-gray-300">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-400" /> End-to-End Encrypted
            </span>
            <span className="text-green-400 font-mono text-xs bg-green-500/10 px-2 py-0.5 rounded font-bold">ACTIVE</span>
          </div>
          
          <div className="flex items-center justify-between text-gray-300">
            <span className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${conversation.participant.isVerified ? 'text-green-400' : 'text-amber-500'}`} /> 
              Device Verification
            </span>
            {conversation.participant.isVerified ? (
              <span className="text-green-400 font-mono text-xs font-bold bg-green-500/10 px-2 py-0.5 rounded">VERIFIED</span>
            ) : (
              <button
                onClick={() => onVerify(conversation.id)}
                className="text-amber-500 hover:text-white font-mono text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded transition hover:bg-amber-500/30"
              >
                VERIFY NOW
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-gray-300">
            <span className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" /> Dynamic Key Swaps
            </span>
            <span className="text-blue-400 font-mono text-xs font-bold bg-blue-500/10 px-2 py-0.5 rounded">SECURE</span>
          </div>
        </div>

        {/* Live Hex Decryptor Switch */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 font-medium">Ciphertext Preview</span>
            <button
              onClick={onPlaintextToggle}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all border ${
                isPlaintextToggle
                  ? 'bg-[#00CFFF]/10 text-[#00CFFF] border-[#00CFFF]/30'
                  : 'bg-white/5 text-gray-400 border-white/10'
              }`}
            >
              {isPlaintextToggle ? 'DECRYPTED' : 'SCRAMBLED'}
            </button>
          </div>
          <p className="text-xs text-gray-400 leading-normal">
            Toggle view inside the chat interface to show raw secure payload packages or readable messages.
          </p>
        </div>

        {/* Interactive Verification Fingerprint */}
        <div className="bg-[#121212] rounded-xl p-4 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 flex items-center gap-2 font-medium">
              Fingerprint Signature
            </span>
            <button
              onClick={() => copyKeyText(currentFingerprint)}
              className="text-[#00CFFF] hover:underline text-xs font-medium"
            >
              {copiedKey ? 'COPIED' : 'COPY'}
            </button>
          </div>
          <div className="bg-black p-3 rounded-lg border border-white/10 font-mono text-center text-[#00CFFF] text-xs leading-relaxed tracking-wider font-semibold">
            {currentFingerprint}
          </div>
          <div className="text-xs text-gray-400 leading-relaxed">
            Verify this secure string with{' '}
            <span className="text-white font-medium">@{conversation.participant.username}</span>. If both signatures match, your connection is fully secure.
          </div>
        </div>
      </div>
    </div>
  );
}
