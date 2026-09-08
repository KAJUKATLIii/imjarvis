import { EmbedBuilder, ColorResolvable } from 'discord.js';

const BRAND_COLOR: ColorResolvable = 0x5865f2; // Discord blurple / JARVIS theme
const SUCCESS_COLOR: ColorResolvable = 0x57f287;
const DANGER_COLOR: ColorResolvable = 0xed4245;
const WARNING_COLOR: ColorResolvable = 0xfee75c;
const INFO_COLOR: ColorResolvable = 0x5865f2;

function timestamp(): string {
  return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
}

// ─── Payment Embeds ──────────────────────────────────────────────────────────

export function buildPaymentSubmittedEmbed(data: {
  username: string;
  plan: string;
  amount: string;
  utr: string;
  paymentId: string;
}): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('💳 NEW PAYMENT SUBMISSION')
    .setColor(WARNING_COLOR)
    .addFields(
      { name: 'Customer', value: data.username, inline: true },
      { name: 'Plan', value: data.plan, inline: true },
      { name: 'Amount', value: `₹${data.amount}`, inline: true },
      { name: 'UTR', value: data.utr, inline: true },
      { name: 'Payment ID', value: data.paymentId, inline: true },
      { name: 'Status', value: '⏳ PENDING_VERIFICATION', inline: true },
    )
    .setFooter({ text: `Time: ${timestamp()}` });
}

export function buildPaymentApprovedEmbed(data: {
  username: string;
  plan: string;
  amount: string;
  utr: string;
  paymentId: string;
  verifiedBy: string;
}): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('✅ PAYMENT RECEIVED')
    .setColor(SUCCESS_COLOR)
    .addFields(
      { name: 'Customer', value: data.username, inline: true },
      { name: 'Plan', value: data.plan, inline: true },
      { name: 'Amount', value: `₹${data.amount}`, inline: true },
      { name: 'UTR', value: data.utr, inline: true },
      { name: 'Payment ID', value: data.paymentId, inline: true },
      { name: 'Status', value: '✅ APPROVED', inline: true },
      { name: 'Verified By', value: data.verifiedBy, inline: true },
    )
    .setFooter({ text: `Time: ${timestamp()}` });
}

export function buildPaymentFailedEmbed(data: {
  username: string;
  plan: string;
  amount: string;
  utr: string;
  paymentId: string;
  reason: string;
  verifiedBy: string;
}): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('❌ PAYMENT VERIFICATION FAILED')
    .setColor(DANGER_COLOR)
    .addFields(
      { name: 'Customer', value: data.username, inline: true },
      { name: 'Plan', value: data.plan, inline: true },
      { name: 'Amount', value: `₹${data.amount}`, inline: true },
      { name: 'UTR', value: data.utr, inline: true },
      { name: 'Payment ID', value: data.paymentId, inline: true },
      { name: 'Reason', value: data.reason || 'Not specified', inline: false },
      { name: 'Verified By', value: data.verifiedBy, inline: true },
    )
    .setFooter({ text: `Time: ${timestamp()}` });
}

// ─── Payment Ticket Embeds ───────────────────────────────────────────────────

export function buildPaymentTicketEmbed(data: {
  username: string;
  ticketId: string;
  plan: string;
  amount: string;
  utr: string;
}): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🎫 NEW PAYMENT TICKET')
    .setColor(WARNING_COLOR)
    .addFields(
      { name: 'Customer', value: data.username, inline: true },
      { name: 'Ticket', value: data.ticketId, inline: true },
      { name: 'Plan', value: data.plan, inline: true },
      { name: 'Amount', value: `₹${data.amount}`, inline: true },
      { name: 'UTR', value: data.utr, inline: true },
      { name: 'Status', value: '⏳ PENDING_VERIFICATION', inline: true },
    )
    .setFooter({ text: `Time: ${timestamp()}` });
}

export function buildPaymentTicketResolvedEmbed(data: {
  username: string;
  ticketId: string;
  amount: string;
}): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('✅ PAYMENT TICKET RESOLVED')
    .setColor(SUCCESS_COLOR)
    .addFields(
      { name: 'Customer', value: data.username, inline: true },
      { name: 'Ticket', value: data.ticketId, inline: true },
      { name: 'Payment', value: `₹${data.amount}`, inline: true },
      { name: 'Status', value: 'PAYMENT RECEIVED', inline: true },
      { name: 'Action', value: 'Invoice Generated\nServer Access Details Pending', inline: false },
    )
    .setFooter({ text: `Time: ${timestamp()}` });
}

// ─── Billing Embeds ──────────────────────────────────────────────────────────

export function buildInvoiceGeneratedEmbed(data: {
  invoiceNumber: string;
  username: string;
  amount: string;
  plan: string;
  utr: string;
}): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🧾 INVOICE GENERATED')
    .setColor(SUCCESS_COLOR)
    .addFields(
      { name: 'Invoice', value: data.invoiceNumber, inline: true },
      { name: 'Customer', value: data.username, inline: true },
      { name: 'Payment', value: `₹${data.amount}`, inline: true },
      { name: 'Plan', value: data.plan, inline: true },
      { name: 'UTR', value: data.utr, inline: true },
      { name: 'Status', value: '✅ PAID', inline: true },
    )
    .setFooter({ text: `Time: ${timestamp()}` });
}

// ─── Server Embeds ───────────────────────────────────────────────────────────

export function buildServerAccessUpdatedEmbed(data: {
  username: string;
  serverId: string;
  plan: string;
  os: string;
  consoleUrl: string;
  updatedBy: string;
  status: string;
}): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🖥️ SERVER ACCESS UPDATED')
    .setColor(INFO_COLOR)
    .addFields(
      { name: 'Customer', value: data.username, inline: true },
      { name: 'Server ID', value: data.serverId, inline: true },
      { name: 'Plan', value: data.plan, inline: true },
      { name: 'OS', value: data.os, inline: true },
      { name: 'Console URL', value: data.consoleUrl || 'Not set', inline: false },
      { name: 'Updated By', value: data.updatedBy, inline: true },
      { name: 'Status', value: data.status, inline: true },
    )
    .setDescription('⚠️ Passwords are never logged.')
    .setFooter({ text: `Time: ${timestamp()}` });
}

// ─── Support Ticket Embeds ───────────────────────────────────────────────────

export function buildSupportTicketEmbed(data: {
  username: string;
  ticketId: string;
  category: string;
  title: string;
}): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🎫 NEW SUPPORT TICKET')
    .setColor(INFO_COLOR)
    .addFields(
      { name: 'Customer', value: data.username, inline: true },
      { name: 'Ticket', value: data.ticketId, inline: true },
      { name: 'Category', value: data.category, inline: true },
      { name: 'Title', value: data.title, inline: false },
    )
    .setFooter({ text: `Time: ${timestamp()}` });
}

export function buildTicketReplyEmbed(data: {
  username: string;
  ticketId: string;
  author: string;
  message: string;
  isAdmin: boolean;
}): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('💬 TICKET REPLY')
    .setColor(data.isAdmin ? SUCCESS_COLOR : INFO_COLOR)
    .addFields(
      { name: 'Customer', value: data.username, inline: true },
      { name: 'Ticket', value: data.ticketId, inline: true },
      { name: 'Author', value: `${data.author}${data.isAdmin ? ' (Admin)' : ''}`, inline: true },
      { name: 'Message', value: data.message.substring(0, 1024), inline: false },
    )
    .setFooter({ text: `Time: ${timestamp()}` });
}

// ─── System Embeds ───────────────────────────────────────────────────────────

export function buildSystemLogEmbed(message: string, isError = false): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(isError ? '🔴 SYSTEM ERROR' : '⚙️ SYSTEM LOG')
    .setColor(isError ? DANGER_COLOR : BRAND_COLOR)
    .setDescription(message)
    .setFooter({ text: `Time: ${timestamp()}` });
}
