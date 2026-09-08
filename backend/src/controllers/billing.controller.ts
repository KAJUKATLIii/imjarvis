import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { formatInvoiceText } from '../services/billing/invoice.service';
import { generateInvoicePdf } from '../services/billing/pdf.service';

export const billingController = {
  // GET /api/billing/invoices
  async getInvoices(req: Request, res: Response) {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user!.id },
      include: { order: { include: { plan: true, os: true } }, payment: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invoices);
  },

  // GET /api/billing/invoices/:id
  async getInvoice(req: Request, res: Response) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
      include: {
        user: true,
        order: { include: { plan: true, os: true } },
        payment: true,
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
    res.json(invoice);
  },

  // GET /api/billing/invoices/:id/download & /pdf
  async downloadInvoice(req: Request, res: Response) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
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
};
