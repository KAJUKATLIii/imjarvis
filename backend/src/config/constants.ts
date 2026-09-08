export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const OrderStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  APPROVED: 'APPROVED',
  FAILED: 'FAILED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  PAID: 'PAID',
  VOID: 'VOID',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const ServerStatus = {
  PROVISIONING: 'PROVISIONING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED',
} as const;
export type ServerStatus = (typeof ServerStatus)[keyof typeof ServerStatus];

export const TicketCategory = {
  BILLING: 'BILLING',
  TECHNICAL: 'TECHNICAL',
  SERVER_UPGRADE: 'SERVER_UPGRADE',
  GENERAL: 'GENERAL',
} as const;
export type TicketCategory = (typeof TicketCategory)[keyof typeof TicketCategory];

export const TicketType = {
  SUPPORT: 'SUPPORT',
  PAYMENT: 'PAYMENT',
} as const;
export type TicketType = (typeof TicketType)[keyof typeof TicketType];

export const TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const ActivityAction = {
  USER_REGISTERED: 'USER_REGISTERED',
  ORDER_CREATED: 'ORDER_CREATED',
  PAYMENT_INITIATED: 'PAYMENT_INITIATED',
  UTR_SUBMITTED: 'UTR_SUBMITTED',
  PAYMENT_APPROVED: 'PAYMENT_APPROVED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INVOICE_GENERATED: 'INVOICE_GENERATED',
  SERVER_ACCESS_CREATED: 'SERVER_ACCESS_CREATED',
  SERVER_ACCESS_UPDATED: 'SERVER_ACCESS_UPDATED',
  SERVER_ACCESS_REMOVED: 'SERVER_ACCESS_REMOVED',
  TICKET_CREATED: 'TICKET_CREATED',
  TICKET_REPLIED: 'TICKET_REPLIED',
  TICKET_RESOLVED: 'TICKET_RESOLVED',
  TICKET_CLOSED: 'TICKET_CLOSED',
  ADMIN_LOGIN: 'ADMIN_LOGIN',
} as const;
export type ActivityAction = (typeof ActivityAction)[keyof typeof ActivityAction];
