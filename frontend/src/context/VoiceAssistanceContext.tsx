import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { socketService, AdminPresence, AssistanceRequest } from '../services/socket';
import { AudioCallRoomModal } from '../components/AudioCallRoomModal';

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
  const { user } = useAuth();
  const [presence, setPresence] = useState<AdminPresence>({
    onlineAdminsCount: 0,
    adminNames: [],
    isAvailable: false,
  });

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<AssistanceRequest | null>(null);

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
    socketService.requestVoiceAssistance({ ticketId, customerName, customerId });
    startCall(`ticket-${ticketId}`, `Ticket #${ticketId.slice(-6)} - Voice Assist`);
  };

  const startDirectVoiceCall = (customSubject?: string) => {
    const callerName = user?.username || 'Client-' + Math.floor(1000 + Math.random() * 9000);
    const callerId = user?.id || `client-${Math.random().toString(36).slice(2, 8)}`;
    const callIdentifier = `direct-${Date.now().toString(36)}`;
    const roomId = `room-${callIdentifier}`;
    const subject = customSubject || `Voice Assist • ${callerName}`;

    // Register user if not already registered
    if (!user) {
      socketService.registerUser(callerId, callerName, 'USER');
    }

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
      {activeRoomId && (
        <AudioCallRoomModal
          roomId={activeRoomId}
          username={user?.username || 'Client'}
          role={user?.role || 'USER'}
          ticketSubject={activeSubject || undefined}
          onClose={endCall}
        />
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
