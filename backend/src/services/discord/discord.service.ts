import { Client, GatewayIntentBits, TextChannel, EmbedBuilder, Events, ActivityType } from 'discord.js';
import axios from 'axios';
import { env } from '../../config/env';

class DiscordService {
  private client: Client;
  private ready = false;

  constructor() {
    // Only standard non-privileged intents
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });
    this.init();
  }

  private async init() {
    try {
      await this.client.login(env.DISCORD_BOT_TOKEN);
      this.client.once(Events.ClientReady, () => {
        console.log(`[Discord] Bot logged in as ${this.client.user?.tag}`);
        this.ready = true;

        // Set bot status and custom activity
        this.client.user?.setPresence({
          activities: [
            {
              name: 'I AM JARVIS',
              state: 'I AM JARVIS',
              type: ActivityType.Custom,
            },
          ],
          status: 'online',
        });
        console.log('[Discord] Bot presence status set to: I AM JARVIS');
      });
    } catch (err) {
      console.error('[Discord] Bot login failed. Discord logging will be disabled.', err);
    }
  }

  async sendEmbed(channelId: string, embed: EmbedBuilder): Promise<void> {
    if (!this.ready || !channelId) return;
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel && channel.isTextBased()) {
        await (channel as TextChannel).send({ embeds: [embed] });
      }
    } catch (err) {
      console.error(`[Discord] Failed to send embed to channel ${channelId}:`, err);
    }
  }

  async sendMessage(channelId: string, content: string): Promise<void> {
    if (!this.ready || !channelId) return;
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel && channel.isTextBased()) {
        await (channel as TextChannel).send(content);
      }
    } catch (err) {
      console.error(`[Discord] Failed to send message to channel ${channelId}:`, err);
    }
  }

  /**
   * Check if a Discord user has the admin role in the target guild.
   * Uses Discord REST API to avoid requiring privileged WebSocket intents.
   */
  async isUserAdmin(discordUserId: string, userAccessToken?: string): Promise<boolean> {
    if (!env.DISCORD_GUILD_ID || !env.DISCORD_ADMIN_ROLE_ID) {
      return false;
    }

    // Method 1: If user OAuth access token is provided, check their guild member object directly
    if (userAccessToken) {
      try {
        const res = await axios.get(
          `https://discord.com/api/v10/users/@me/guilds/${env.DISCORD_GUILD_ID}/member`,
          {
            headers: { Authorization: `Bearer ${userAccessToken}` },
          }
        );
        const roles: string[] = res.data?.roles || [];
        const hasRole = roles.includes(env.DISCORD_ADMIN_ROLE_ID);
        console.log(`[Discord Auth] User OAuth member check for ${discordUserId}: ${hasRole ? 'ADMIN' : 'USER'}`);
        return hasRole;
      } catch (err: any) {
        // Fallback to bot REST API
      }
    }

    // Method 2: Query Discord REST API with bot token
    try {
      const res = await axios.get(
        `https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/members/${discordUserId}`,
        {
          headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
        }
      );
      const roles: string[] = res.data?.roles || [];
      const hasRole = roles.includes(env.DISCORD_ADMIN_ROLE_ID);
      console.log(`[Discord Auth] Bot REST check for ${discordUserId}: ${hasRole ? 'ADMIN' : 'USER'}`);
      return hasRole;
    } catch (err: any) {
      console.warn(
        `[Discord Auth] Unable to fetch member for user ${discordUserId} in guild ${env.DISCORD_GUILD_ID}:`,
        err.response?.data?.message || err.message
      );
      return false;
    }
  }
}

// Singleton
export const discordService = new DiscordService();
