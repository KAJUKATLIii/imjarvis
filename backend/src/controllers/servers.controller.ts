import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const serversController = {
  // GET /api/servers
  async getAll(req: Request, res: Response) {
    const servers = await prisma.server.findMany({
      where: { userId: req.user!.id },
      include: { order: { include: { plan: true, os: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(servers);
  },

  // GET /api/servers/:id
  async getOne(req: Request, res: Response) {
    const server = await prisma.server.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
      include: { order: { include: { plan: true, os: true } } },
    });
    if (!server) return res.status(404).json({ error: 'Server not found.' });
    res.json(server);
  },

  // GET /api/servers/:id/access — returns console credentials (only to server owner)
  async getAccess(req: Request, res: Response) {
    const server = await prisma.server.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
      select: {
        id: true,
        name: true,
        status: true,
        accessStatus: true,
        consoleUrl: true,
        consoleUsername: true,
        consolePassword: true,
        accessNotes: true,
        order: { include: { plan: true, os: true } },
      },
    });
    if (!server) return res.status(404).json({ error: 'Server not found.' });
    res.json(server);
  },
};
