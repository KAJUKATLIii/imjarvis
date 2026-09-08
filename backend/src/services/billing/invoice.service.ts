import prisma from '../../config/prisma';

async function getNextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();

  // Upsert the counter for this year and atomically increment
  const counter = await prisma.$transaction(async (tx) => {
    const existing = await tx.invoiceCounter.findUnique({ where: { id: 1 } });

    if (!existing || existing.year !== year) {
      return tx.invoiceCounter.upsert({
        where: { id: 1 },
        update: { year, counter: 1 },
        create: { id: 1, year, counter: 1 },
      });
    } else {
      return tx.invoiceCounter.update({
        where: { id: 1 },
        data: { counter: { increment: 1 } },
      });
    }
  });

  const num = counter.counter.toString().padStart(6, '0');
  return `INV-${year}-${num}`;
}

export interface InvoiceInput {
  userId: string;
  orderId: string;
  paymentId: string;
  serverId?: string;
  amount: number;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
}

export async function generateInvoice(input: InvoiceInput) {
  const invoiceNumber = await getNextInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      userId: input.userId,
      orderId: input.orderId,
      paymentId: input.paymentId,
      serverId: input.serverId,
      amount: input.amount,
      tax: 0,
      totalAmount: input.amount,
      status: 'PAID',
      billingPeriodStart: input.billingPeriodStart || new Date(),
      billingPeriodEnd: input.billingPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    include: {
      user: true,
      order: { include: { plan: true, os: true } },
      payment: true,
    },
  });

  return invoice;
}

export function formatInvoiceText(invoice: Awaited<ReturnType<typeof generateInvoice>>): string {
  const { order, payment, user } = invoice;
  const pad = '='.repeat(42);
  const dash = '-'.repeat(42);
  const dateStr = new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return `
${pad}
              JARVIS HOSTING
${pad}

INVOICE: ${invoice.invoiceNumber}
DATE: ${dateStr}

CUSTOMER
${dash}
Username:   ${user.username}
Account ID: ${user.discordId}
Email:      ${user.email || 'N/A'}

SERVICE
${dash}
Plan:      ${order.plan.name}
RAM:       ${order.plan.ramGb} GB DDR4
vCPU:      ${order.plan.vcpuCores} Cores
Storage:   ${order.plan.storageGb} GB NVMe SSD
Bandwidth: ${order.plan.bandwidth}
OS:        ${order.os.name}
Location:  ${order.location}
Period:    ${new Date(invoice.billingPeriodStart!).toLocaleDateString('en-IN')} – ${new Date(invoice.billingPeriodEnd!).toLocaleDateString('en-IN')}

PAYMENT
${dash}
Amount:  ₹${invoice.totalAmount}
Method:  UPI
UTR:     ${payment.utr}
Status:  PAID

${pad}
TOTAL PAID: ₹${invoice.totalAmount}
${pad}
`.trim();
}
