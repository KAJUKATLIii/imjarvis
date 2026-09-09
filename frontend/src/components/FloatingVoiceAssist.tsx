import React, { useState } from 'react';
import { useVoiceAssistance } from '../context/VoiceAssistanceContext';
import { useAuth } from '../context/AuthContext';
import {
  Headphones,
  Phone,
  PhoneCall,
  Radio,
  Shield,
  X,
  Volume2,
  Mic,
  Activity,
  Zap,
} from 'lucide-react';

export const FloatingVoiceAssist: React.FC = () => {
  const { presence, activeRoomId, startDirectVoiceCall, endCall } = useVoiceAssistance();
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const handleStartCall = () => {
    setShowPrompt(false);
    startDirectVoiceCall(user ? `Direct Assist • @${user.username}` : 'Direct Live Voice Assist');
  };

  // If a call is active, render a mini active call status badge in the corner
  if (activeRoomId) {
    return (
      <div className="fixed bottom-5 right-5 z-40 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="bg-[#11161b] border-2 border-[#ccff00] rounded-2xl p-3.5 shadow-[0_0_30px_rgba(204,255,0,0.35)] flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#ccff00] text-black">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#11161b] animate-ping" />
          </div>
          <div>
            <div className="text-[10px] font-mono-tech uppercase font-bold text-[#ccff00] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-ping" />
              Live Voice Link
            </div>
            <div className="text-xs font-bold text-white">Call in Progress</div>
          </div>
          <button
            onClick={endCall}
            className="ml-2 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-mono-tech uppercase font-bold tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.4)]"
            title="Cut / End Call"
          >
            <Phone className="w-3.5 h-3.5 rotate-[135deg]" />
            <span>Cut Call</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Expanded Quick Call Popover */}
      {showPrompt && (
        <div className="absolute bottom-16 right-0 mb-2 w-80 bg-[#11161b] border border-[#2d3844] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-4 text-white animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1e262e]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#ccff00]/10 border border-[#ccff00]/30 flex items-center justify-center text-[#ccff00]">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <span className="text-xs font-mono-tech font-bold uppercase tracking-wider text-white">
                Live Voice Assist
              </span>
            </div>
            <button
              onClick={() => setShowPrompt(false)}
              className="p-1 rounded text-[#8a99ad] hover:text-white hover:bg-[#182028] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono-tech">
              <span className="text-[#8a99ad]">Network Status:</span>
              {presence.isAvailable ? (
                <span className="text-[#ccff00] font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
                  {presence.onlineAdminsCount} {presence.onlineAdminsCount === 1 ? 'Operator' : 'Operators'} Online
                </span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Standby / Auto-Queue
                </span>
              )}
            </div>

            <p className="text-xs text-[#8a99ad] leading-relaxed">
              Initiate an encrypted 1-on-1 WebRTC audio link directly with our cloud engineers & automated diagnostics.
            </p>

            <div className="bg-[#0d1115] border border-[#1e262e] rounded-lg p-2.5 flex items-center justify-between text-[11px] font-mono-tech text-[#5c6b73]">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#ccff00]" />
                <span>P2P STUN Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-[#ccff00]" />
                <span>HD Audio</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleStartCall}
              className="w-full py-2.5 px-4 rounded-xl bg-[#ccff00] hover:bg-[#b8e600] text-black font-mono-tech text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all hover:scale-[1.02] cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Start Voice Call</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <div className="relative group">
        {/* Pulsing ring when operators are online */}
        {presence.isAvailable && (
          <span className="absolute -inset-1 rounded-full bg-[#ccff00]/30 animate-ping pointer-events-none" />
        )}

        <button
          onClick={() => setShowPrompt((prev) => !prev)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative flex items-center gap-2.5 p-3.5 sm:px-4 sm:py-3 rounded-full border shadow-2xl transition-all duration-300 cursor-pointer ${
            presence.isAvailable
              ? 'bg-[#11161b] border-[#ccff00] text-[#ccff00] hover:bg-[#ccff00] hover:text-black shadow-[0_0_25px_rgba(204,255,0,0.25)]'
              : 'bg-[#11161b] border-[#2d3844] text-white hover:border-[#ccff00] hover:text-[#ccff00]'
          }`}
          title="Click to Call Live Voice Assist"
          aria-label="Click to Call Live Voice Assist"
        >
          <div className="relative">
            <Headphones className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            <span
              className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#11161b] ${
                presence.isAvailable ? 'bg-[#ccff00] animate-pulse' : 'bg-amber-400'
              }`}
            />
          </div>

          {/* Label on larger screens or hover */}
          <span className="hidden sm:inline font-mono-tech text-xs font-bold uppercase tracking-wider">
            {presence.isAvailable ? 'Voice Assist' : 'Voice Assist'}
          </span>
        </button>

        {/* Hover Tooltip (when popover not open) */}
        {!showPrompt && (
          <div className="absolute right-0 bottom-full mb-2 hidden md:group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d1115] border border-[#2d3844] text-[11px] font-mono-tech text-white whitespace-nowrap shadow-xl pointer-events-none animate-in fade-in duration-150">
            <Phone className="w-3 h-3 text-[#ccff00]" />
            <span>Click to start Voice Call ({presence.isAvailable ? `${presence.onlineAdminsCount} Online` : 'Standby'})</span>
          </div>
        )}
      </div>
    </div>
  );
};
