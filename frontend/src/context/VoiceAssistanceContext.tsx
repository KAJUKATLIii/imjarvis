import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { socketService, AdminPresence, AssistanceRequest } from '../services/socket';
import { AudioCallRoomModal } from '../components/AudioCallRoomModal';
import { Lock, LogIn, X, Headphones } from 'lucide-react';

interface VoiceAssistanceContextType {
  presence: AdminPresence;
  activeRoomId: string | null;
  activeSubject: string | null;
  incomingRequest: AssistanceRequest | null;
  startCall: (roomId: string, subject?: string) => void;
  endCall: () => void;
  acceptIncomingRequest: () => void;
  dismissIncomingRequest: () => void;
  requestVoiceAssistance: (ticketId: string, customerName: string, customerId: string) => void;
  startDirectVoiceCall: (customSubject?: string) => void;
}

const VoiceAssistanceContext = createContext<VoiceAssistanceContextType | null>(null);

export const VoiceAssistanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loginWithDiscord } = useAuth();
  const [presence, setPresence] = useState<AdminPresence>({
    onlineAdminsCount: 0,
    adminNames: [],
    isAvailable: false,
  });

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<AssistanceRequest | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (user) {
      socketService.registerUser(user.id, user.username, user.role);
    }
    socketService.requestPresence();

    const unsubPresence = socketService.onPresenceUpdate((data) => {
      setPresence(data);
    });

    const unsubAssistance = socketService.onIncomingAssistance((req) => {
      // Only show incoming request to admin if they are not the caller themselves
      if (user?.role === 'ADMIN' && req.customerId !== user.id) {
        setIncomingRequest(req);
      }
    });

    const unsubCancelled = socketService.onAssistanceCancelled((data) => {
      setIncomingRequest((prev) => (prev && prev.ticketId === data.ticketId ? null : prev));
    });

    return () => {
      unsubPresence();
      unsubAssistance();
      unsubCancelled();
    };
  }, [user]);

  const startCall = (roomId: string, subject?: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setActiveRoomId(roomId);
    setActiveSubject(subject || 'Support Assistance Room');
  };

  const endCall = () => {
    if (activeRoomId) {
      const callId = activeRoomId.replace(/^(room-|ticket-|voice-)/, '');
      socketService.cancelVoiceAssistance(callId);
    }
    setActiveRoomId(null);
    setActiveSubject(null);
  };

  const acceptIncomingRequest = () => {
    if (incomingRequest) {
      const isDirect = incomingRequest.ticketId.startsWith('direct-');
      const roomId = isDirect ? `room-${incomingRequest.ticketId}` : `ticket-${incomingRequest.ticketId}`;
      const subject = isDirect
        ? `Live Call • ${incomingRequest.customerName}`
        : `Ticket #${incomingRequest.ticketId.slice(-6)} - ${incomingRequest.customerName}`;
      startCall(roomId, subject);
      setIncomingRequest(null);
    }
  };

  const dismissIncomingRequest = () => {
    if (incomingRequest) {
      socketService.cancelVoiceAssistance(incomingRequest.ticketId);
      setIncomingRequest(null);
    }
  };

  const requestVoiceAssistance = (ticketId: string, customerName: string, customerId: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    socketService.requestVoiceAssistance({ ticketId, customerName, customerId });
    startCall(`ticket-${ticketId}`, `Ticket #${ticketId.slice(-6)} - Voice Assist`);
  };

  const startDirectVoiceCall = (customSubject?: string) => {
    // Only logged in users can use Voice Assist
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const callerName = user.username;
    const callerId = user.id;
    const callIdentifier = `direct-${Date.now().toString(36)}`;
    const roomId = `room-${callIdentifier}`;
    const subject = customSubject || `Voice Assist • @${callerName}`;

    // Broadcast assistance request to all online admins
    socketService.requestVoiceAssistance({
      ticketId: callIdentifier,
      customerName: callerName,
      customerId: callerId,
    });

    startCall(roomId, subject);
  };

  return (
    <VoiceAssistanceContext.Provider
      value={{
        presence,
        activeRoomId,
        activeSubject,
        incomingRequest,
        startCall,
        endCall,
        acceptIncomingRequest,
        dismissIncomingRequest,
        requestVoiceAssistance,
        startDirectVoiceCall,
      }}
    >
      {children}

      {/* Floating Incoming Call Alert for Admin */}
      {incomingRequest && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#11161b] border-2 border-[#ccff00] rounded-xl p-4 shadow-[0_0_30px_rgba(204,255,0,0.3)] flex items-center gap-4 animate-bounce">
          <div className="w-10 h-10 rounded-full bg-[#ccff00] text-black flex items-center justify-center font-bold">
            🎧
          </div>
          <div>
            <div className="text-xs font-mono-tech text-[#ccff00] uppercase font-bold">
              Incoming Voice Assistance Request
            </div>
            <div className="text-sm font-bold text-white">
              Customer: {incomingRequest.customerName}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={acceptIncomingRequest}
              className="px-3 py-1.5 rounded bg-[#ccff00] hover:bg-[#b8e600] text-black font-mono-tech text-xs font-bold uppercase cursor-pointer transition-all hover:scale-105"
            >
              Join Call
            </button>
            <button
              onClick={dismissIncomingRequest}
              className="px-2 py-1.5 rounded bg-[#182028] text-[#8a99ad] hover:text-white font-mono-tech text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Active WebRTC Audio Call Room */}
      {activeRoomId && user && (
        <AudioCallRoomModal
          roomId={activeRoomId}
          username={user.username}
          role={user.role}
          ticketSubject={activeSubject || undefined}
          onClose={endCall}
        />
      )}

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#11161b] border border-[#2d3844] rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-[#0d1115] border-b border-[#1e262e] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ccff00]/10 border border-[#ccff00]/30 flex items-center justify-center text-[#ccff00]">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono-tech tracking-widest text-[#ccff00]">
                    AUTHENTICATION REQUIRED
                  </div>
                  <h3 className="text-sm font-bold text-white">Voice Assist Access</h3>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-1.5 rounded-lg bg-[#182028] text-[#8a99ad] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/30 flex items-center justify-center mx-auto text-[#5865F2]">
                <Headphones className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Sign In to Use Voice Assist</h4>
                <p className="text-xs text-[#8a99ad] mt-1.5 leading-relaxed">
                  Real-time encrypted audio assistance is reserved for logged-in accounts to verify your profile and link you directly with infrastructure operators.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    loginWithDiscord();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-mono-tech text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(88,101,242,0.3)] transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login with Discord</span>
                </button>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#182028] hover:bg-[#202933] text-[#8a99ad] hover:text-white font-mono-tech text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </VoiceAssistanceContext.Provider>
  );
};

export const useVoiceAssistance = () => {
  const context = useContext(VoiceAssistanceContext);
  if (!context) {
    throw new Error('useVoiceAssistance must be used within a VoiceAssistanceProvider');
  }
  return context;
};
