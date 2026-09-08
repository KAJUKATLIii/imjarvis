import { Request, Response, NextFunction } from 'express';
import { requireAuth } from './auth.middleware';
import { discordService } from '../services/discord/discord.service';
import prisma from '../config/prisma';

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, async () => {
    if (req.user?.role === 'ADMIN') {
      return next();
    }

    // Dynamic verification using DISCORD_ADMIN_ROLE_ID in DISCORD_GUILD_ID
    if (req.user?.discordId) {
      try {
        const isAdmin = await discordService.isUserAdmin(req.user.discordId);
        if (isAdmin) {
          req.user.role = 'ADMIN';
          if (req.session) {
            req.session.role = 'ADMIN';
          }
          await prisma.user.update({
            where: { id: req.user.id },
            data: { role: 'ADMIN' },
          });
          return next();
        }
      } catch (err) {
        console.error('[Admin Middleware] Error checking Discord admin role:', err);
      }
    }

    res.status(403).json({ error: 'Forbidden. Admin access required.' });
  });
}
