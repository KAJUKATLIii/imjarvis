import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: 'Unauthorized. Please log in with Discord.' });
    return;
  }
  req.user = {
    id: req.session.userId,
    discordId: req.session.discordId!,
    username: req.session.username!,
    role: req.session.role!,
  };
  next();
}
