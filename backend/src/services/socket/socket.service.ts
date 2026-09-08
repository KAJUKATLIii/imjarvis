import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../../config/env';

interface ConnectedUser {
  socketId: string;
  userId: string;
  username: string;
  role: 'USER' | 'ADMIN';
}

const connectedUsers = new Map<string, ConnectedUser>();
const activeVoiceRooms = new Map<string, Set<string>>(); // roomId -> Set of socketIds

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        env.FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ],
      credentials: true,
    },
  });

  const broadcastPresence = () => {
    const onlineAdmins: string[] = [];
    connectedUsers.forEach((user) => {
      if (user.role === 'ADMIN') {
        onlineAdmins.push(user.username);
      }
    });

    const uniqueAdmins = Array.from(new Set(onlineAdmins));
    io?.emit('presence:update', {
      onlineAdminsCount: uniqueAdmins.length,
      adminNames: uniqueAdmins,
      isAvailable: uniqueAdmins.length > 0,
    });
  };

  io.on('connection', (socket: Socket) => {
    // ─── 1. Identity & Presence ──────────────────────────────────────────────
    socket.on('user:register', (data: { userId: string; username: string; role: 'USER' | 'ADMIN' }) => {
      if (!data?.userId) return;
      connectedUsers.set(socket.id, {
        socketId: socket.id,
        userId: data.userId,
        username: data.username,
        role: data.role,
      });

      broadcastPresence();
    });

    socket.on('presence:get', () => {
      const onlineAdmins: string[] = [];
      connectedUsers.forEach((user) => {
        if (user.role === 'ADMIN') {
          onlineAdmins.push(user.username);
        }
      });
      const uniqueAdmins = Array.from(new Set(onlineAdmins));
      socket.emit('presence:update', {
        onlineAdminsCount: uniqueAdmins.length,
        adminNames: uniqueAdmins,
        isAvailable: uniqueAdmins.length > 0,
      });
    });

    // ─── 2. Assistance Request Notification ──────────────────────────────────
    socket.on('assistance:request', (data: { ticketId: string; customerName: string; customerId: string }) => {
      // Notify all connected admins
      connectedUsers.forEach((user, socketId) => {
        if (user.role === 'ADMIN') {
          io?.to(socketId).emit('assistance:incoming', data);
        }
      });
    });

    // ─── 3. WebRTC Audio Signaling ───────────────────────────────────────────
    socket.on('webrtc:join', (data: { roomId: string; username: string; role: string }) => {
      const { roomId, username, role } = data;
      socket.join(roomId);

      if (!activeVoiceRooms.has(roomId)) {
        activeVoiceRooms.set(roomId, new Set());
      }
      const roomSockets = activeVoiceRooms.get(roomId)!;
      roomSockets.add(socket.id);

      // Notify others in room
      socket.to(roomId).emit('webrtc:peer-joined', {
        socketId: socket.id,
        username,
        role,
      });

      // Send existing peers in room to the newly joined peer
      const otherPeers: string[] = [];
      roomSockets.forEach((sId) => {
        if (sId !== socket.id) otherPeers.push(sId);
      });

      socket.emit('webrtc:room-peers', { peers: otherPeers });
    });

    // Relay Offer
    socket.on('webrtc:offer', (data: { roomId: string; sdp: any; targetSocketId?: string }) => {
      socket.to(data.roomId).emit('webrtc:offer', {
        sdp: data.sdp,
        fromSocketId: socket.id,
      });
    });

    // Relay Answer
    socket.on('webrtc:answer', (data: { roomId: string; sdp: any; targetSocketId?: string }) => {
      socket.to(data.roomId).emit('webrtc:answer', {
        sdp: data.sdp,
        fromSocketId: socket.id,
      });
    });

    // Relay ICE Candidate
    socket.on('webrtc:candidate', (data: { roomId: string; candidate: any }) => {
      socket.to(data.roomId).emit('webrtc:candidate', {
        candidate: data.candidate,
        fromSocketId: socket.id,
      });
    });

    // Mute Status Toggle
    socket.on('webrtc:toggle-mute', (data: { roomId: string; isMuted: boolean }) => {
      socket.to(data.roomId).emit('webrtc:peer-muted', {
        fromSocketId: socket.id,
        isMuted: data.isMuted,
      });
    });

    // Leave Call
    socket.on('webrtc:leave', (data: { roomId: string }) => {
      socket.leave(data.roomId);
      const roomSockets = activeVoiceRooms.get(data.roomId);
      if (roomSockets) {
        roomSockets.delete(socket.id);
        if (roomSockets.size === 0) activeVoiceRooms.delete(data.roomId);
      }
      socket.to(data.roomId).emit('webrtc:peer-left', { fromSocketId: socket.id });
    });

    // ─── Disconnection ───────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      connectedUsers.delete(socket.id);

      // Clean up rooms
      activeVoiceRooms.forEach((sockets, roomId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          socket.to(roomId).emit('webrtc:peer-left', { fromSocketId: socket.id });
          if (sockets.size === 0) activeVoiceRooms.delete(roomId);
        }
      });

      if (user?.role === 'ADMIN') {
        broadcastPresence();
      }
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}
