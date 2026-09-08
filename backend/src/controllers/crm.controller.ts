import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { ActivityAction } from '../config/constants';
import { discordLogger } from '../services/discord/discord.logger';

const createTicketSchema = z.object({
  category: z.enum(['BILLING', 'TECHNICAL', 'SERVER_UPGRADE', 'GENERAL']),
  title: z.string().min(5).max(200),
  message: z.string().min(10).max(2000),
});

const createMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});

export const crmController = {
  // POST /api/crm/tickets
  async createTicket(req: Request, res: Response) {
    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { category, title, message } = parsed.data;
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const ticket = await prisma.ticket.create({
      data: {
        userId,
        type: 'SUPPORT',
        category,
        title,
        messages: { create: { userId, message, isAdmin: false } },
      },
      include: { messages: true },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.TICKET_CREATED,
        details: JSON.stringify({ ticketId: ticket.id, category, title }),
      },
    });

    discordLogger.sendTicketCreatedLog({
      username: user!.username,
      ticketId: ticket.id,
      category,
      title,
    }).catch(console.error);

    res.status(201).json(ticket);
  },

  // GET /api/crm/tickets
  async getTickets(req: Request, res: Response) {
    const tickets = await prisma.ticket.findMany({
      where: { userId: req.user!.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(tickets);
  },

  // GET /api/crm/tickets/:id
  async getTicket(req: Request, res: Response) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    res.json(ticket);
  },

  // POST /api/crm/tickets/:id/messages
  async addMessage(req: Request, res: Response) {
    const parsed = createMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { message } = parsed.data;
    const userId = req.user!.id;

    const ticket = await prisma.ticket.findFirst({
      where: { id: req.params.id as string, userId },
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    if (ticket.status === 'CLOSED') {
      return res.status(400).json({ error: 'Cannot reply to a closed ticket.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const msg = await prisma.ticketMessage.create({
      data: { ticketId: ticket.id, userId, message, isAdmin: false },
    });

    // Update ticket status to OPEN if it was resolved
    if (ticket.status === 'RESOLVED') {
      await prisma.ticket.update({ where: { id: ticket.id }, data: { status: 'OPEN' } });
    } else {
      await prisma.ticket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } });
    }

    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.TICKET_REPLIED,
        details: JSON.stringify({ ticketId: ticket.id }),
      },
    });

    discordLogger.sendTicketReplyLog({
      username: user!.username,
      ticketId: ticket.id,
      author: user!.username,
      message,
      isAdmin: false,
    }).catch(console.error);

    res.status(201).json(msg);
  },
};
