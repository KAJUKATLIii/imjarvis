import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { ActivityAction } from '../config/constants';
import { discordLogger } from '../services/discord/discord.logger';
import { generateInvoice, formatInvoiceText } from '../services/billing/invoice.service';
import { generateInvoicePdf } from '../services/billing/pdf.service';
import { antiFraudService } from '../services/billing/antiFraud.service';

const approvePaymentSchema = z.object({
  notes: z.string().optional(),
});

const failPaymentSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

const updateServerAccessSchema = z.object({
  consoleUrl: z.string().url().optional().or(z.literal('')),
  consoleUsername: z.string().optional(),
  consolePassword: z.string().optional(),
  accessNotes: z.string().optional(),
  adminNotes: z.string().optional(),
  accessStatus: z.enum(['PENDING', 'ACCESS_AVAILABLE']).optional(),
  status: z.enum(['PROVISIONING', 'ACTIVE', 'SUSPENDED', 'TERMINATED']).optional(),
  name: z.string().optional(),
  ipAddress: z.string().optional(),
  port: z.number().int().optional(),
});

const addTicketMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
});

export const adminController = {
  // ─── Orders ─────────────────────────────────────────────────────────────────
  async getOrders(req: Request, res: Response) {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        plan: true,
        os: true,
        payment: true,
        server: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  },

  // ─── Payments ───────────────────────────────────────────────────────────────

  // GET /api/admin/payments
  async getPayments(req: Request, res: Response) {
    const { status } = req.query;
    const payments = await prisma.payment.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        user: true,
        order: { include: { plan: true, os: true } },
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedPayments = await Promise.all(
      payments.map(async (p) => {
        let fraudAssessment: any = null;
        if (p.notes) {
          try {
            fraudAssessment = JSON.parse(p.notes);
          } catch {}
        }
        if (!fraudAssessment && p.utr) {
          fraudAssessment = await antiFraudService.assessUTR(p.utr, p.orderId);
        }
        return {
          ...p,
          fraudAssessment,
        };
      })
    );

    res.json(enrichedPayments);
  },

  // PATCH /api/admin/payments/:paymentId/approve
  async approvePayment(req: Request, res: Response) {
    const parsed = approvePaymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const paymentId = req.params.paymentId as string;
    const adminId = req.user!.id;
    const adminName = req.user!.username;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true, order: { include: { plan: true, os: true } } },
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    if (payment.status !== 'PENDING_VERIFICATION') {
      return res.status(409).json({ error: `Payment is already ${payment.status}.` });
    }

    // Approve payment
    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'APPROVED',
        verifiedBy: adminId,
        verifiedAt: new Date(),
        notes: parsed.data.notes,
      },
    });

    // Update order status
    const billingEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'ACTIVE',
        billingPeriodStart: new Date(),
        billingPeriodEnd: billingEnd,
      },
    });

    // Generate invoice (ONLY after approval)
    const invoice = await generateInvoice({
      userId: payment.userId,
      orderId: payment.orderId,
      paymentId: payment.id,
      amount: Number(payment.amount),
      billingPeriodStart: new Date(),
      billingPeriodEnd: billingEnd,
    });

    // Create server record
    const server = await prisma.server.create({
      data: {
        userId: payment.userId,
        orderId: payment.orderId,
        status: 'PROVISIONING',
        location: payment.order.location,
        accessStatus: 'PENDING',
      },
    });

    // Resolve payment ticket
    const ticket = await prisma.ticket.findFirst({ where: { paymentId } });
    if (ticket) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: 'RESOLVED',
          messages: {
            create: {
              userId: adminId,
              message: `✅ Payment of ₹${payment.amount} has been verified and approved.\nInvoice ${invoice.invoiceNumber} has been generated.\nServer provisioning has begun.`,
              isAdmin: true,
            },
          },
        },
      });

      discordLogger.sendPaymentTicketResolvedLog({
        username: payment.user.username,
        ticketId: ticket.id,
        amount: payment.amount.toString(),
      }).catch(console.error);
    }

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: ActivityAction.PAYMENT_APPROVED,
        details: JSON.stringify({ paymentId, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber }),
      },
    });

    // Discord logs
    discordLogger.sendPaymentApprovedLog({
      username: payment.user.username,
      plan: payment.order.plan.name,
      amount: payment.amount.toString(),
      utr: payment.utr,
      paymentId: payment.id,
      verifiedBy: adminName,
    }).catch(console.error);

    discordLogger.sendInvoiceLog({
      invoiceNumber: invoice.invoiceNumber,
      username: payment.user.username,
      amount: payment.amount.toString(),
      plan: payment.order.plan.name,
      utr: payment.utr,
    }).catch(console.error);

    res.json({ message: 'Payment approved.', invoiceId: invoice.id, serverId: server.id });
  },

  // PATCH /api/admin/payments/:paymentId/fail
  async failPayment(req: Request, res: Response) {
    const parsed = failPaymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const paymentId = req.params.paymentId as string;
    const adminId = req.user!.id;
    const adminName = req.user!.username;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true, order: { include: { plan: true } } },
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    if (payment.status !== 'PENDING_VERIFICATION') {
      return res.status(409).json({ error: `Payment is already ${payment.status}.` });
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        verifiedBy: adminId,
        verifiedAt: new Date(),
        failReason: parsed.data.reason,
      },
    });

    // Update payment ticket
    const ticket = await prisma.ticket.findFirst({ where: { paymentId } });
    if (ticket) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: 'CLOSED',
          messages: {
            create: {
              userId: adminId,
              message: `❌ Payment verification failed.\nReason: ${parsed.data.reason}\nPlease contact support if you believe this is an error.`,
              isAdmin: true,
            },
          },
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: ActivityAction.PAYMENT_FAILED,
        details: JSON.stringify({ paymentId, reason: parsed.data.reason }),
      },
    });

    discordLogger.sendPaymentFailedLog({
      username: payment.user.username,
      plan: payment.order.plan.name,
      amount: payment.amount.toString(),
      utr: payment.utr,
      paymentId: payment.id,
      reason: parsed.data.reason,
      verifiedBy: adminName,
    }).catch(console.error);

    res.json({ message: 'Payment marked as failed.' });
  },

  // ─── Invoices ────────────────────────────────────────────────────────────────

  // GET /api/admin/invoices
  async getInvoices(req: Request, res: Response) {
    const invoices = await prisma.invoice.findMany({
      include: {
        user: true,
        order: { include: { plan: true, os: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invoices);
  },

  // GET /api/admin/invoices/:invoiceId/download
  async downloadInvoice(req: Request, res: Response) {
    const invoiceId = req.params.invoiceId as string;
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: true,
        order: { include: { plan: true, os: true } },
        payment: true,
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    try {
      const pdfBuffer = await generateInvoicePdf(invoice as any);
      const filename = `${invoice.invoiceNumber}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      return res.send(pdfBuffer);
    } catch (err) {
      console.error('PDF generation error, falling back to text:', err);
      const text = formatInvoiceText(invoice as any);
      const filename = `${invoice.invoiceNumber}.txt`;

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(text);
    }
  },

  // ─── Servers ─────────────────────────────────────────────────────────────────

  // GET /api/admin/servers
  async getServers(req: Request, res: Response) {
    const servers = await prisma.server.findMany({
      include: {
        user: true,
        order: { include: { plan: true, os: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(servers);
  },

  // GET /api/admin/servers/:serverId
  async getServer(req: Request, res: Response) {
    const serverId = req.params.serverId as string;
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        user: true,
        order: { include: { plan: true, os: true } },
      },
    });
    if (!server) return res.status(404).json({ error: 'Server not found.' });
    res.json(server);
  },

  // PATCH /api/admin/servers/:serverId/access
  async updateServerAccess(req: Request, res: Response) {
    const parsed = updateServerAccessSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const serverId = req.params.serverId as string;
    const adminId = req.user!.id;
    const adminName = req.user!.username;

    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: { user: true, order: { include: { plan: true, os: true } } },
    });
    if (!server) return res.status(404).json({ error: 'Server not found.' });

    const updated = await prisma.server.update({
      where: { id: serverId },
      data: {
        ...parsed.data,
        // Never log passwords; they are stored but not returned in logs
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: ActivityAction.SERVER_ACCESS_UPDATED,
        details: JSON.stringify({
          serverId,
          accessStatus: parsed.data.accessStatus,
          consoleUrl: parsed.data.consoleUrl,
        }),
      },
    });

    discordLogger.sendServerAccessUpdatedLog({
      username: server.user.username,
      serverId: server.id,
      plan: server.order.plan.name,
      os: server.order.os.name,
      consoleUrl: parsed.data.consoleUrl || server.consoleUrl || 'Not set',
      updatedBy: adminName,
      status: parsed.data.accessStatus || server.accessStatus,
    }).catch(console.error);

    // Return updated server WITHOUT password
    const { consolePassword: _, ...safeServer } = updated;
    res.json(safeServer);
  },

  // PATCH /api/admin/servers/:serverId/extend
  async extendSubscription(req: Request, res: Response) {
    const serverId = req.params.serverId as string;
    const days = Number(req.body.days || 30);
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: { order: true, user: true },
    });
    if (!server) return res.status(404).json({ error: 'Server not found.' });

    const currentEnd = server.order.billingPeriodEnd && new Date(server.order.billingPeriodEnd) > new Date()
      ? new Date(server.order.billingPeriodEnd)
      : new Date();

    const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);

    await prisma.order.update({
      where: { id: server.orderId },
      data: {
        billingPeriodEnd: newEnd,
        status: 'ACTIVE',
      },
    });

    res.json({ message: `Subscription extended by ${days} days.`, billingPeriodEnd: newEnd });
  },

  // ─── Customers ───────────────────────────────────────────────────────────────

  // GET /api/admin/customers
  async getCustomers(req: Request, res: Response) {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { orders: true, payments: true, tickets: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  },

  // GET /api/admin/customers/:userId
  async getCustomer(req: Request, res: Response) {
    const userId = req.params.userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: { include: { plan: true, os: true } },
        payments: true,
        invoices: true,
        servers: true,
        tickets: { include: { messages: { orderBy: { createdAt: 'asc' } } } },
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!user) return res.status(404).json({ error: 'Customer not found.' });
    res.json(user);
  },

  // ─── CRM (Admin Tickets) ─────────────────────────────────────────────────────

  // GET /api/admin/tickets
  async getTickets(req: Request, res: Response) {
    const { status, type } = req.query;
    const tickets = await prisma.ticket.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(type ? { type: type as any } : {}),
      },
      include: {
        user: true,
        messages: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(tickets);
  },

  // POST /api/admin/tickets/:ticketId/messages
  async replyToTicket(req: Request, res: Response) {
    const parsed = addTicketMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const ticketId = req.params.ticketId as string;
    const adminId = req.user!.id;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

    const admin = await prisma.user.findUnique({ where: { id: adminId } });

    const msg = await prisma.ticketMessage.create({
      data: { ticketId, userId: adminId, message: parsed.data.message, isAdmin: true },
    });

    const newStatus = parsed.data.status || 'IN_PROGRESS';
    await prisma.ticket.update({ where: { id: ticketId }, data: { status: newStatus } });

    discordLogger.sendTicketReplyLog({
      username: ticket.user.username,
      ticketId,
      author: admin!.username,
      message: parsed.data.message,
      isAdmin: true,
    }).catch(console.error);

    res.status(201).json(msg);
  },
};
