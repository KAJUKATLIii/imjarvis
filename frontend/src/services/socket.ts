import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // Connect to backend via Vite proxy or direct window origin
    socket = io({
      path: '/socket.io',
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export interface AdminPresence {
  onlineAdminsCount: number;
  adminNames: string[];
  isAvailable: boolean;
}

export interface AssistanceRequest {
  ticketId: string;
  customerName: string;
  customerId: string;
}

export const socketService = {
  getSocket,

  registerUser(userId: string, username: string, role: 'USER' | 'ADMIN') {
    const s = getSocket();
    s.emit('user:register', { userId, username, role });
  },

  requestPresence() {
    const s = getSocket();
    s.emit('presence:get');
  },

  onPresenceUpdate(callback: (presence: AdminPresence) => void) {
    const s = getSocket();
    s.on('presence:update', callback);
    return () => {
      s.off('presence:update', callback);
    };
  },

  requestVoiceAssistance(data: AssistanceRequest) {
    const s = getSocket();
    s.emit('assistance:request', data);
  },

  cancelVoiceAssistance(ticketId: string) {
    const s = getSocket();
    s.emit('assistance:cancel', { ticketId });
  },

  onIncomingAssistance(callback: (data: AssistanceRequest) => void) {
    const s = getSocket();
    s.on('assistance:incoming', callback);
    return () => {
      s.off('assistance:incoming', callback);
    };
  },

  onAssistanceCancelled(callback: (data: { ticketId: string }) => void) {
    const s = getSocket();
    s.on('assistance:cancelled', callback);
    return () => {
      s.off('assistance:cancelled', callback);
    };
  },
};
