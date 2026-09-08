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
      if (user?.role === 'ADMIN') {
        setIncomingRequest(req);
      }
    });

    return () => {
      unsubPresence();
      unsubAssistance();
    };
  }, [user]);

  const startCall = (roomId: string, subject?: string) => {
    setActiveRoomId(roomId);
    setActiveSubject(subject || 'Support Assistance Room');
  };

  const endCall = () => {
    setActiveRoomId(null);
    setActiveSubject(null);
  };

  const acceptIncomingRequest = () => {
    if (incomingRequest) {
      startCall(`ticket-${incomingRequest.ticketId}`, `Ticket #${incomingRequest.ticketId.slice(-6)} - ${incomingRequest.customerName}`);
      setIncomingRequest(null);
    }
  };

  const dismissIncomingRequest = () => {
    setIncomingRequest(null);
  };

  const requestVoiceAssistance = (ticketId: string, customerName: string, customerId: string) => {
    socketService.requestVoiceAssistance({ ticketId, customerName, customerId });
    startCall(`ticket-${ticketId}`, `Ticket #${ticketId.slice(-6)} - Voice Assist`);
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
              className="px-3 py-1.5 rounded bg-[#ccff00] hover:bg-[#b8e600] text-black font-mono-tech text-xs font-bold uppercase cursor-pointer"
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
