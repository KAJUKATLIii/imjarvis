import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const plansController = {
  // GET /api/plans
  async getAll(req: Request, res: Response) {
    const plans = await prisma.hostingPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(plans);
  },

  // GET /api/plans/:id
  async getOne(req: Request, res: Response) {
    const plan = await prisma.hostingPlan.findUnique({
      where: { id: req.params.id as string },
    });
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });
    res.json(plan);
  },
};

export const operatingSystemsController = {
  // GET /api/os
  async getAll(req: Request, res: Response) {
    const systems = await prisma.operatingSystem.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
    res.json(systems);
  },
};
