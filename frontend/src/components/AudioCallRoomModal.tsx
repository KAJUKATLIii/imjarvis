import React from 'react';
import { useWebRTCAudio } from '../hooks/useWebRTCAudio';
import {
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Shield,
  User,
  Headphones,
  Volume2,
  AlertCircle,
  Activity,
} from 'lucide-react';

interface AudioCallModalProps {
  roomId: string;
  username: string;
  role: 'USER' | 'ADMIN';
  ticketSubject?: string;
  onClose: () => void;
}

export const AudioCallRoomModal: React.FC<AudioCallModalProps> = ({
  roomId,
  username,
  role,
  ticketSubject,
  onClose,
}) => {
  const {
    isConnected,
    isConnecting,
    isMuted,
    peerMuted,
    peerInfo,
    audioLevel,
    error,
    toggleMute,
    endCall,
  } = useWebRTCAudio({
    roomId,
    username,
    role,
    onCallEnd: onClose,
  });

  const handleEndCall = () => {
    endCall();
    onClose();
  };

  // Generate 12 equalizer bars based on audio level
  const bars = Array.from({ length: 12 }, (_, i) => {
    // Dynamic height based on audioLevel with wave offset
    const factor = Math.sin((i / 12) * Math.PI) * 1.5;
    const height = Math.max(8, Math.min(48, Math.round((audioLevel * factor * 0.45) + (Math.random() * 4))));
    return isConnected && !isMuted ? height : 6;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#11161b] border border-[#2d3844] rounded-xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Top Tech Header */}
        <div className="px-6 py-4 bg-[#0d1115] border-b border-[#1e262e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#ccff00]/10 border border-[#ccff00]/30 flex items-center justify-center text-[#ccff00]">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-mono-tech tracking-widest text-[#ccff00] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-ping" />
                JARVIS LIVE REMOTE ASSIST
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {ticketSubject ? `Room: ${ticketSubject}` : 'Interactive Troubleshooting Room'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-[#182028] border border-[#1e262e] text-[10px] font-mono-tech text-[#8a99ad]">
              P2P ENCRYPTED
            </div>
          </div>
        </div>

        {/* Room Call Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono-tech flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Connected Participants */}
          <div className="grid grid-cols-2 gap-4">
            {/* You */}
            <div className="bg-[#0a0d10] border border-[#1e262e] rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[#182028] border border-[#2d3844] flex items-center justify-center text-white">
                  <User className="w-6 h-6" />
                </div>
                {isMuted ? (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <MicOff className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#ccff00] text-black flex items-center justify-center">
                    <Mic className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
                  {username} <span className="text-[10px] text-[#5c6b73]">(You)</span>
                </div>
                <div className="text-[10px] font-mono-tech text-[#ccff00] uppercase mt-0.5">
                  {role === 'ADMIN' ? 'Infrastructure Operator' : 'Customer Client'}
                </div>
              </div>
            </div>

            {/* Remote Peer */}
            <div className="bg-[#0a0d10] border border-[#1e262e] rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-full border flex items-center justify-center ${
                    isConnected
                      ? 'bg-[#182028] border-[#ccff00] text-[#ccff00] shadow-[0_0_15px_rgba(204,255,0,0.15)]'
                      : 'bg-[#182028] border-[#2d3844] text-[#5c6b73]'
                  }`}
                >
                  <Headphones className="w-6 h-6" />
                </div>
                {isConnected && peerMuted && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center">
                    <MicOff className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {peerInfo?.username || (isConnecting ? 'Calling...' : 'Waiting for Remote Party...')}
                </div>
                <div className="text-[10px] font-mono-tech text-[#8a99ad] mt-0.5">
                  {isConnected
                    ? peerInfo?.role === 'ADMIN'
                      ? 'Operator Connected'
                      : 'Customer Connected'
                    : 'Awaiting connection...'}
                </div>
              </div>
            </div>
          </div>

          {/* Animated Audio Equalizer Visualizer */}
          <div className="bg-[#0a0d10] border border-[#1e262e] rounded-lg p-5 flex flex-col items-center justify-center space-y-3">
            <div className="flex items-center gap-1.5 h-12">
              {bars.map((height, i) => (
                <div
                  key={i}
                  style={{ height: `${height}px` }}
                  className={`w-2 rounded-full transition-all duration-75 ${
                    isConnected && !isMuted
                      ? 'bg-[#ccff00] shadow-[0_0_8px_rgba(204,255,0,0.5)]'
                      : 'bg-[#1e262e]'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono-tech text-[#5c6b73]">
              <Activity className="w-3.5 h-3.5 text-[#ccff00]" />
              <span>
                {isConnected
                  ? isMuted
                    ? 'Microphone Muted'
                    : 'Direct Voice Link Established • STUN / Low Latency'
                  : 'Ringing remote peer via signaling socket...'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="px-6 py-4 bg-[#0d1115] border-t border-[#1e262e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className={`px-4 py-2.5 rounded text-xs font-mono-tech uppercase font-bold tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                isMuted
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                  : 'btn-outline-dark text-white'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#ccff00]" />}
              <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
            </button>
          </div>

          <button
            onClick={handleEndCall}
            className="px-5 py-2.5 rounded bg-red-600 hover:bg-red-500 text-white font-mono-tech text-xs uppercase font-bold tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)]"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
