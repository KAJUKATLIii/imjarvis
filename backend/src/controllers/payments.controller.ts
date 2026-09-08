import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { ActivityAction } from '../config/constants';
import { discordLogger } from '../services/discord/discord.logger';
import { env } from '../config/env';
import { antiFraudService } from '../services/billing/antiFraud.service';

// UTR format: 12 digits (standard UPI reference number)
const submitUTRSchema = z.object({
  orderId: z.string().min(1),
  utr: z.string().regex(/^\d{12}$/, 'UTR must be exactly 12 digits'),
});

export const paymentsController = {
  // POST /api/payments/verify-utr
  async submitUTR(req: Request, res: Response) {
    const parsed = submitUTRSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { orderId, utr } = parsed.data;
    const userId = req.user!.id;

    // Check order belongs to user
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { plan: true, os: true, user: true, payment: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.status !== 'PENDING') {
      return res.status(409).json({ error: 'Order is not in a pending state.' });
    }

    // Check no payment already exists for this order
    if (order.payment) {
      return res.status(409).json({ error: 'Payment already submitted for this order.' });
    }

    // Run Anti-Fraud Assessment
    const assessment = await antiFraudService.assessUTR(utr, orderId);

    if (assessment.isDuplicate) {
      return res.status(409).json({
        error: 'DUPLICATE_UTR: This UPI reference number has already been submitted or cleared on another order.',
      });
    }

    if (assessment.isDummy) {
      return res.status(400).json({
        error: `INVALID_UTR: Anti-Fraud Guard detected dummy/sequential test numbers (${assessment.flags[0] || 'Invalid pattern'}). Please enter an authentic 12-digit bank reference number.`,
      });
    }

    // Create payment with anti-fraud metadata
    const payment = await prisma.payment.create({
      data: {
        userId,
        orderId,
        amount: order.plan.priceMonthly,
        utr,
        status: 'PENDING_VERIFICATION',
        notes: JSON.stringify(assessment),
      },
    });

    // Create payment verification ticket
    const ticket = await prisma.ticket.create({
      data: {
        userId,
        paymentId: payment.id,
        type: 'PAYMENT',
        category: 'BILLING',
        title: `Payment Verification — ${order.plan.name} — UTR: ${utr}`,
        status: 'OPEN',
        messages: {
          create: {
            userId,
            message: `Payment of ₹${order.plan.priceMonthly} submitted.\nPlan: ${order.plan.name}\nUTR: ${utr}\nAwaiting admin verification.`,
            isAdmin: false,
          },
        },
      },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId,
        action: ActivityAction.UTR_SUBMITTED,
        details: JSON.stringify({ paymentId: payment.id, utr, orderId, plan: order.plan.name }),
      },
    });

    // Discord logs — fire and forget
    discordLogger.sendPaymentLog({
      username: order.user.username,
      plan: order.plan.name,
      amount: order.plan.priceMonthly.toString(),
      utr,
      paymentId: payment.id,
    }).catch(console.error);

    discordLogger.sendPaymentTicketLog({
      username: order.user.username,
      ticketId: ticket.id,
      plan: order.plan.name,
      amount: order.plan.priceMonthly.toString(),
      utr,
    }).catch(console.error);

    res.status(201).json({
      message: 'UTR submitted. Payment pending verification.',
      paymentId: payment.id,
      ticketId: ticket.id,
      status: payment.status,
      upiId: env.MERCHANT_UPI_ID,
      merchantName: env.MERCHANT_NAME,
    });
  },

  // GET /api/payments
  async getAll(req: Request, res: Response) {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.id },
      include: { order: { include: { plan: true, os: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  },

  // GET /api/payments/:id
  async getOne(req: Request, res: Response) {
    const payment = await prisma.payment.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
      include: { order: { include: { plan: true, os: true } }, invoice: true },
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    res.json(payment);
  },

  // GET /api/payments/merchant-info — returns UPI details for QR code display
  async getMerchantInfo(req: Request, res: Response) {
    res.json({
      upiId: env.MERCHANT_UPI_ID,
      merchantName: env.MERCHANT_NAME,
    });
  },
};
