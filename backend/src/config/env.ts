import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: requireEnv('DATABASE_URL'),
  SESSION_SECRET: requireEnv('SESSION_SECRET'),

  // Discord OAuth2
  DISCORD_CLIENT_ID: requireEnv('DISCORD_CLIENT_ID'),
  DISCORD_CLIENT_SECRET: requireEnv('DISCORD_CLIENT_SECRET'),
  DISCORD_REDIRECT_URI: requireEnv('DISCORD_REDIRECT_URI'),

  // Discord Bot
  DISCORD_BOT_TOKEN: requireEnv('DISCORD_BOT_TOKEN'),
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID || '',
  DISCORD_ADMIN_ROLE_ID: process.env.DISCORD_ADMIN_ROLE_ID || '',

  // Discord Channels
  DISCORD_PAYMENT_LOG_CHANNEL_ID: process.env.DISCORD_PAYMENT_LOG_CHANNEL_ID || '',
  DISCORD_PAYMENT_TICKET_CHANNEL_ID: process.env.DISCORD_PAYMENT_TICKET_CHANNEL_ID || '',
  DISCORD_BILLING_LOG_CHANNEL_ID: process.env.DISCORD_BILLING_LOG_CHANNEL_ID || '',
  DISCORD_SERVER_LOG_CHANNEL_ID: process.env.DISCORD_SERVER_LOG_CHANNEL_ID || '',
  DISCORD_SUPPORT_CHANNEL_ID: process.env.DISCORD_SUPPORT_CHANNEL_ID || '',
  DISCORD_SYSTEM_LOG_CHANNEL_ID: process.env.DISCORD_SYSTEM_LOG_CHANNEL_ID || '',

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  FRONTEND_DASHBOARD_URL: process.env.FRONTEND_DASHBOARD_URL || 'http://localhost:5173/dashboard',

  // UPI
  MERCHANT_UPI_ID: process.env.MERCHANT_UPI_ID || 'jarvishosting@upi',
  MERCHANT_NAME: process.env.MERCHANT_NAME || 'JARVIS Hosting',

  get isProduction() {
    return this.NODE_ENV === 'production';
  },
  get isDevelopment() {
    return this.NODE_ENV === 'development';
  },
};
