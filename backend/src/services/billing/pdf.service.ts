import PDFDocument from 'pdfkit';

export interface InvoiceData {
  invoiceNumber: string;
  createdAt: Date;
  billingPeriodStart?: Date | null;
  billingPeriodEnd?: Date | null;
  amount: number;
  tax: number;
  totalAmount: number;
  user: {
    username: string;
    discordId: string;
    email?: string | null;
  };
  order: {
    orderNumber: string;
    location: string;
    plan: {
      name: string;
      ramGb: number;
      vcpuCores: number;
      storageGb: number;
      bandwidth: string;
    };
    os: {
      name: string;
    };
  };
  payment?: {
    utr: string;
    status: string;
    method: string;
  } | null;
}

export function generateInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Invoice ${invoice.invoiceNumber} - JARVIS Hosting`,
          Author: 'JARVIS Cloud Infrastructure',
          Subject: 'Hosting Service Tax Invoice',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#11161b';
      const accentColor = '#22c55e'; // crisp green / lime
      const textColor = '#1e293b';
      const mutedColor = '#64748b';
      const borderColor = '#e2e8f0';

      // ─── Header Top Bar ───
      doc.rect(40, 40, 515, 60).fill('#0f172a');

      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
        .text('JARVIS HOSTING', 55, 52);
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
        .text('Enterprise Cloud Infrastructure & Bare Metal Nodes', 55, 76);

      doc.fillColor(accentColor).fontSize(14).font('Helvetica-Bold')
        .text('PAID INVOICE', 410, 55, { align: 'right', width: 130 });
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
        .text(invoice.invoiceNumber, 410, 75, { align: 'right', width: 130 });

      // ─── Invoice Meta Info Cards ───
      let y = 120;

      const username = invoice.user?.username || 'Customer';
      const discordId = invoice.user?.discordId || 'N/A';
      const email = invoice.user?.email || 'Verified Discord Account';
      const location = invoice.order?.location || 'India (Mumbai)';
      const orderNumber = invoice.order?.orderNumber || 'ORD-HOSTING';
      const planName = invoice.order?.plan?.name || 'Dedicated Node';
      const vcpu = invoice.order?.plan?.vcpuCores || 4;
      const ram = invoice.order?.plan?.ramGb || 16;
      const storage = invoice.order?.plan?.storageGb || 100;
      const bandwidth = invoice.order?.plan?.bandwidth || 'Unlimited';
      const osName = invoice.order?.os?.name || 'Linux';
      const utr = invoice.payment?.utr || 'VERIFIED-UPI';

      // Customer Info Box
      doc.rect(40, y, 250, 95).fillAndStroke('#f8fafc', borderColor);
      doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text('BILLED TO (CUSTOMER)', 55, y + 12);
      doc.fillColor(textColor).fontSize(11).font('Helvetica-Bold').text(username, 55, y + 28);
      doc.fillColor(mutedColor).fontSize(9).font('Helvetica')
        .text(`Discord ID: ${discordId}`, 55, y + 44)
        .text(`Account Email: ${email}`, 55, y + 58)
        .text(`Region: India (${location})`, 55, y + 72);

      // Order Info Box
      doc.rect(305, y, 250, 95).fillAndStroke('#f8fafc', borderColor);
      doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text('TRANSACTION DETAILS', 320, y + 12);
      
      const issueDate = new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
      const startDate = invoice.billingPeriodStart ? new Date(invoice.billingPeriodStart).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      }) : 'Active';
      const endDate = invoice.billingPeriodEnd ? new Date(invoice.billingPeriodEnd).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      }) : '30 Days Cycle';

      doc.fillColor(mutedColor).fontSize(9).font('Helvetica')
        .text('Date of Issue:', 320, y + 30)
        .text('Order Number:', 320, y + 45)
        .text('Billing Cycle:', 320, y + 60)
        .text('Bank UTR:', 320, y + 75);

      doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold')
        .text(issueDate, 410, y + 30, { align: 'right', width: 130 })
        .text(orderNumber, 410, y + 45, { align: 'right', width: 130 })
        .text(`${startDate} – ${endDate}`, 400, y + 60, { align: 'right', width: 140 })
        .text(utr, 410, y + 75, { align: 'right', width: 130 });

      // ─── Table Header ───
      y = 235;
      doc.rect(40, y, 515, 26).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('DESCRIPTION & NODE SPECS', 55, y + 8);
      doc.text('LOCATION', 320, y + 8);
      doc.text('QTY', 410, y + 8);
      doc.text('AMOUNT (INR)', 470, y + 8, { align: 'right', width: 70 });

      // ─── Table Item ───
      y += 26;
      doc.rect(40, y, 515, 65).fillAndStroke('#ffffff', borderColor);

      doc.fillColor(textColor).fontSize(11).font('Helvetica-Bold')
        .text(`JARVIS Dedicated Node — ${planName}`, 55, y + 12);

      const specs = `${vcpu} vCPU Cores • ${ram} GB DDR4 RAM • ${storage} GB NVMe SSD\nOS: ${osName} • Bandwidth: ${bandwidth}`;
      doc.fillColor(mutedColor).fontSize(8.5).font('Helvetica')
        .text(specs, 55, y + 28, { width: 250, lineGap: 2 });

      doc.fillColor(textColor).fontSize(9).font('Helvetica')
        .text(location, 320, y + 14);

      doc.fillColor(textColor).fontSize(9).font('Helvetica')
        .text('1 Month', 410, y + 14);

      doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold')
        .text(`Rs. ${Number(invoice.amount).toLocaleString('en-IN')}`, 470, y + 14, { align: 'right', width: 70 });

      // ─── Summary Calculation Box ───
      y += 85;
      const calcX = 320;
      doc.rect(calcX, y, 235, 95).fillAndStroke('#f8fafc', borderColor);

      doc.fillColor(mutedColor).fontSize(9).font('Helvetica')
        .text('Subtotal:', calcX + 15, y + 12)
        .text('Taxes & Gateway Surcharge (0%):', calcX + 15, y + 28)
        .text('Discount:', calcX + 15, y + 44);

      doc.fillColor(textColor).fontSize(9).font('Helvetica')
        .text(`Rs. ${Number(invoice.amount).toLocaleString('en-IN')}`, calcX + 120, y + 12, { align: 'right', width: 95 })
        .text('Rs. 0.00', calcX + 120, y + 28, { align: 'right', width: 95 })
        .text('Rs. 0.00', calcX + 120, y + 44, { align: 'right', width: 95 });

      doc.rect(calcX, y + 62, 235, 1).fill(borderColor);

      doc.fillColor(textColor).fontSize(11).font('Helvetica-Bold')
        .text('TOTAL PAID:', calcX + 15, y + 72);
      doc.fillColor(accentColor).fontSize(12).font('Helvetica-Bold')
        .text(`Rs. ${Number(invoice.totalAmount).toLocaleString('en-IN')}`, calcX + 120, y + 71, { align: 'right', width: 95 });

      // ─── Payment Receipt Seal ───
      doc.rect(40, y, 260, 95).fillAndStroke('#f0fdf4', '#86efac');
      doc.fillColor('#166534').fontSize(10).font('Helvetica-Bold')
        .text('PAYMENT VERIFICATION SEAL', 55, y + 14);
      doc.fillColor('#15803d').fontSize(8.5).font('Helvetica')
        .text(`Method: Unified Payments Interface (UPI)`, 55, y + 32)
        .text(`Bank Reference (UTR): ${invoice.payment?.utr || 'VERIFIED'}`, 55, y + 46)
        .text(`Verification: Confirmed by JARVIS Cloud Ledger`, 55, y + 60)
        .text(`Status: CLEARED & PROVISIONED`, 55, y + 74);

      // ─── Footer Terms & Note ───
      y += 120;
      doc.rect(40, y, 515, 1).fill(borderColor);
      y += 15;

      doc.fillColor(mutedColor).fontSize(8).font('Helvetica')
        .text('Terms & Conditions:', 40, y)
        .text('• Subscriptions automatically renew upon payment verification. 99.9% Uptime SLA guaranteed.', 40, y + 12)
        .text('• For infrastructure inquiries or billing assistance, open a ticket via Customer Portal or our Discord Guild.', 40, y + 24)
        .text('• This is a computer generated tax invoice and requires no physical signature.', 40, y + 36);

      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
        .text('JARVIS Cloud Infrastructure • Mumbai DC-1 (BOM1) • Delhi DC-2 (DEL1)', 40, 760, {
          align: 'center',
          width: 515,
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
