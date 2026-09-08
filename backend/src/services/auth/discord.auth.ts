import axios from 'axios';
import { env } from '../../config/env';
import prisma from '../../config/prisma';
import { discordLogger } from '../discord/discord.logger';
import { discordService } from '../discord/discord.service';
import { ActivityAction } from '../../config/constants';

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const DISCORD_OAUTH_TOKEN_URL = 'https://discord.com/api/oauth2/token';

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  email?: string;
  avatar?: string;
}

export function getDiscordOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email guilds.members.read',
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: env.DISCORD_REDIRECT_URI,
  });

  const response = await axios.post(DISCORD_OAUTH_TOKEN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data.access_token;
}

export async function getDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await axios.get(`${DISCORD_API_BASE}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function findOrCreateUser(discordUser: DiscordUser, accessToken?: string) {
  // Check if user has the admin role in the configured Discord guild
  const isAdmin = await discordService.isUserAdmin(discordUser.id, accessToken);
  const resolvedRole = isAdmin ? 'ADMIN' : 'USER';

  let user = await prisma.user.findUnique({
    where: { discordId: discordUser.id },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        discordId: discordUser.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator || '0',
        email: discordUser.email,
        avatar: discordUser.avatar,
        role: resolvedRole,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: ActivityAction.USER_REGISTERED,
        details: JSON.stringify({ discordId: discordUser.id, username: discordUser.username, role: resolvedRole }),
      },
    });

    // Discord system log
    await discordLogger.sendSystemLog(
      `👤 New user registered: **${user.username}** (Discord: ${user.discordId}) [Role: ${resolvedRole}]`
    );
  } else {
    // Update profile info and sync admin role
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: discordUser.username,
        email: discordUser.email,
        avatar: discordUser.avatar,
        role: resolvedRole,
      },
    });
  }

  return user;
}
