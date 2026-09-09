import { Request, Response } from 'express';
import { env } from '../config/env';
import prisma from '../config/prisma';
import {
  getDiscordOAuthUrl,
  exchangeCodeForToken,
  getDiscordUser,
  findOrCreateUser,
} from '../services/auth/discord.auth';

export const authController = {
  // GET /api/auth/discord — redirect to Discord OAuth
  discord(req: Request, res: Response) {
    const url = getDiscordOAuthUrl();
    res.redirect(url);
  },

  // GET /api/auth/discord/callback
  async discordCallback(req: Request, res: Response) {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=access_denied`);
    }

    if (!code || typeof code !== 'string') {
      return res.redirect(`${env.FRONTEND_URL}/login?error=missing_code`);
    }

    try {
      const accessToken = await exchangeCodeForToken(code);
      const discordUser = await getDiscordUser(accessToken);
      const user = await findOrCreateUser(discordUser, accessToken);

      // Set session
      req.session.userId = user.id;
      req.session.discordId = user.discordId;
      req.session.username = user.username;
      req.session.role = user.role as any;
      req.session.avatar = user.avatar;
      req.session.email = user.email;

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('[Auth] Error saving session:', saveErr);
          return res.redirect(`${env.FRONTEND_URL}/portal?error=session_error`);
        }
        res.redirect(env.FRONTEND_DASHBOARD_URL);
      });
    } catch (err) {
      console.error('[Auth] Discord callback error:', err);
      res.redirect(`${env.FRONTEND_URL}/portal?error=auth_failed`);
    }
  },

  // GET /api/auth/me
  async me(req: Request, res: Response) {
    if (!req.session?.userId) {
      return res.status(401).json({ authenticated: false });
    }

    try {
      // Fetch latest user data including avatar from DB
      const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        select: {
          id: true,
          discordId: true,
          username: true,
          role: true,
          avatar: true,
          email: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(401).json({ authenticated: false });
      }

      res.json({
        authenticated: true,
        user: {
          id: user.id,
          discordId: user.discordId,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      console.error('[Auth] Error querying me:', err);
      res.json({
        authenticated: true,
        user: {
          id: req.session.userId,
          discordId: req.session.discordId,
          username: req.session.username,
          role: req.session.role,
          avatar: req.session.avatar || null,
          email: req.session.email || null,
        },
      });
    }
  },

  // POST /api/auth/logout
  logout(req: Request, res: Response) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully.' });
    });
  },
};
