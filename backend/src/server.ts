import http from 'http';
import app from './app';
import { env } from './config/env';
import { discordService } from './services/discord/discord.service';
import prisma from './config/prisma';
import { initSocketServer } from './services/socket/socket.service';

const server = http.createServer(app);

// Initialize WebRTC & Presence Socket.IO Server
initSocketServer(server);

server.listen(env.PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 JARVIS Hosting Backend API`);
  console.log(`🌐 Port: http://localhost:${env.PORT}`);
  console.log(`⚙️  Environment: ${env.NODE_ENV}`);
  console.log(`🔒 Frontend URL: ${env.FRONTEND_URL}`);
  console.log(`🎧 WebRTC Signaling: ACTIVE`);
  console.log(`========================================`);
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    await prisma.$disconnect();
    console.log('[Database] Disconnected Prisma.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[Server] Forced shutdown after 10s timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
  process.exit(1);
});
