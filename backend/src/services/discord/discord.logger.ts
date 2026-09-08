import { discordService } from './discord.service';
import { env } from '../../config/env';
import {
  buildPaymentSubmittedEmbed,
  buildPaymentApprovedEmbed,
  buildPaymentFailedEmbed,
  buildPaymentTicketEmbed,
  buildPaymentTicketResolvedEmbed,
  buildInvoiceGeneratedEmbed,
  buildServerAccessUpdatedEmbed,
  buildSupportTicketEmbed,
  buildTicketReplyEmbed,
  buildSystemLogEmbed,
} from './discord.embeds';

export const discordLogger = {
  async sendPaymentLog(data: {
    username: string; plan: string; amount: string; utr: string; paymentId: string;
  }) {
    const embed = buildPaymentSubmittedEmbed(data);
    await discordService.sendEmbed(env.DISCORD_PAYMENT_LOG_CHANNEL_ID, embed);
  },

  async sendPaymentApprovedLog(data: {
    username: string; plan: string; amount: string; utr: string; paymentId: string; verifiedBy: string;
  }) {
    const embed = buildPaymentApprovedEmbed(data);
    await discordService.sendEmbed(env.DISCORD_PAYMENT_LOG_CHANNEL_ID, embed);
  },

  async sendPaymentFailedLog(data: {
    username: string; plan: string; amount: string; utr: string; paymentId: string; reason: string; verifiedBy: string;
  }) {
    const embed = buildPaymentFailedEmbed(data);
    await discordService.sendEmbed(env.DISCORD_PAYMENT_LOG_CHANNEL_ID, embed);
  },

  async sendPaymentTicketLog(data: {
    username: string; ticketId: string; plan: string; amount: string; utr: string;
  }) {
    const embed = buildPaymentTicketEmbed(data);
    await discordService.sendEmbed(env.DISCORD_PAYMENT_TICKET_CHANNEL_ID, embed);
  },

  async sendPaymentTicketResolvedLog(data: {
    username: string; ticketId: string; amount: string;
  }) {
    const embed = buildPaymentTicketResolvedEmbed(data);
    await discordService.sendEmbed(env.DISCORD_PAYMENT_TICKET_CHANNEL_ID, embed);
  },

  async sendInvoiceLog(data: {
    invoiceNumber: string; username: string; amount: string; plan: string; utr: string;
  }) {
    const embed = buildInvoiceGeneratedEmbed(data);
    await discordService.sendEmbed(env.DISCORD_BILLING_LOG_CHANNEL_ID, embed);
  },

  async sendServerAccessUpdatedLog(data: {
    username: string; serverId: string; plan: string; os: string; consoleUrl: string; updatedBy: string; status: string;
  }) {
    const embed = buildServerAccessUpdatedEmbed(data);
    await discordService.sendEmbed(env.DISCORD_SERVER_LOG_CHANNEL_ID, embed);
  },

  async sendTicketCreatedLog(data: {
    username: string; ticketId: string; category: string; title: string;
  }) {
    const embed = buildSupportTicketEmbed(data);
    await discordService.sendEmbed(env.DISCORD_SUPPORT_CHANNEL_ID, embed);
  },

  async sendTicketReplyLog(data: {
    username: string; ticketId: string; author: string; message: string; isAdmin: boolean;
  }) {
    const embed = buildTicketReplyEmbed(data);
    await discordService.sendEmbed(env.DISCORD_SUPPORT_CHANNEL_ID, embed);
  },

  async sendSystemLog(message: string, isError = false) {
    const embed = buildSystemLogEmbed(message, isError);
    await discordService.sendEmbed(env.DISCORD_SYSTEM_LOG_CHANNEL_ID, embed);
  },
};
