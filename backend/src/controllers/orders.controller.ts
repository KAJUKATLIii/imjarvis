import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { ActivityAction } from '../config/constants';

const createOrderSchema = z.object({
  planId: z.string().min(1),
  osId: z.string().min(1),
  location: z.string().default('Mumbai, India'),
});

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

export const ordersController = {
  // POST /api/orders
  async create(req: Request, res: Response) {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { planId, osId, location } = parsed.data;
    const userId = req.user!.id;

    // Validate plan and OS exist
    const plan = await prisma.hostingPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) return res.status(404).json({ error: 'Plan not found.' });

    const os = await prisma.operatingSystem.findUnique({ where: { id: osId } });
    if (!os || !os.isActive) return res.status(404).json({ error: 'Operating system not found.' });

    // If customer already has an unpaid pending order, update it with new selection instead of blocking them
    const existing = await prisma.order.findFirst({
      where: { userId, status: 'PENDING', payment: null },
    });

    if (existing) {
      const updated = await prisma.order.update({
        where: { id: existing.id },
        data: {
          planId,
          osId,
          location,
          updatedAt: new Date(),
        },
        include: { plan: true, os: true },
      });
      return res.status(200).json(updated);
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        planId,
        osId,
        location,
      },
      include: { plan: true, os: true },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.ORDER_CREATED,
        details: JSON.stringify({ orderId: order.id, plan: plan.name, os: os.name }),
      },
    });

    res.status(201).json(order);
  },

  // GET /api/orders
  async getAll(req: Request, res: Response) {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: { plan: true, os: true, payment: true, invoice: true, server: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  },

  // GET /api/orders/:id
  async getOne(req: Request, res: Response) {
    const isOwnerOrAdmin =
      req.user!.role === 'ADMIN'
        ? { id: req.params.id as string }
        : { id: req.params.id as string, userId: req.user!.id };

    const order = await prisma.order.findFirst({
      where: isOwnerOrAdmin,
      include: { plan: true, os: true, payment: true, invoice: true, server: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(order);
  },

  // POST /api/orders/renew/:serverId
  async createRenewal(req: Request, res: Response) {
    const serverId = req.params.serverId as string;
    const userId = req.user!.id;

    const server = await prisma.server.findFirst({
      where: { id: serverId, userId },
      include: { order: true },
    });
    if (!server) return res.status(404).json({ error: 'Server not found.' });

    // Check if an unpaid pending order already exists
    const existing = await prisma.order.findFirst({
      where: { userId, status: 'PENDING', payment: null },
      include: { plan: true, os: true },
    });

    if (existing) {
      const updated = await prisma.order.update({
        where: { id: existing.id },
        data: {
          planId: server.order.planId,
          osId: server.order.osId,
          location: server.location,
          updatedAt: new Date(),
        },
        include: { plan: true, os: true },
      });
      return res.status(200).json(updated);
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        planId: server.order.planId,
        osId: server.order.osId,
        location: server.location,
      },
      include: { plan: true, os: true },
    });

    res.status(201).json(order);
  },
};
