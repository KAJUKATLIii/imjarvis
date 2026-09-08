import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface User {
  id: string;
  discordId: string;
  username: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
  email?: string;
}

export interface HostingPlan {
  id: string;
  name: string;
  slug: string;
  ramGb: number;
  vcpuCores: number;
  storageGb: number;
  bandwidth: string;
  priceMonthly: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
}

export interface OperatingSystem {
  id: string;
  name: string;
  slug: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  planId: string;
  osId: string;
  location: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: HostingPlan;
  os?: OperatingSystem;
  payment?: Payment;
}

export interface Payment {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  currency: string;
  utr: string;
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'FAILED';
  method: string;
  verifiedBy?: string;
  verifiedAt?: string;
  failReason?: string;
  createdAt: string;
  updatedAt: string;
  order?: Order;
  user?: User;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  orderId: string;
  paymentId: string;
  amount: number;
  tax: number;
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'PAID' | 'VOID';
  invoiceDate: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  createdAt: string;
  order?: Order;
  user?: User;
}

export interface Server {
  id: string;
  userId: string;
  orderId: string;
  name?: string;
  status: 'PROVISIONING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  ipAddress?: string;
  port?: number;
  location: string;
  consoleUrl?: string;
  consoleUsername?: string;
  consolePassword?: string;
  accessNotes?: string;
  accessStatus: 'PENDING' | 'ACCESS_AVAILABLE';
  createdAt: string;
  updatedAt: string;
  order?: Order;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
  user?: User;
}

export interface Ticket {
  id: string;
  userId: string;
  paymentId?: string;
  type: 'SUPPORT' | 'PAYMENT';
  category: 'BILLING' | 'TECHNICAL' | 'SERVER_UPGRADE' | 'GENERAL';
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  user?: User;
}

// Unified API Caller
export const api = {
  auth: {
    getMe: () => axiosInstance.get<{ authenticated: boolean; user?: User }>('/auth/me'),
    logout: () => axiosInstance.post('/auth/logout'),
  },
  plans: {
    getAll: () => axiosInstance.get<HostingPlan[]>('/plans'),
    getOperatingSystems: () => axiosInstance.get<OperatingSystem[]>('/os'),
  },
  orders: {
    create: (data: { planId: string; osId: string; location?: string }) =>
      axiosInstance.post<Order>('/orders', data),
    createRenewal: (serverId: string) =>
      axiosInstance.post<Order>(`/orders/renew/${serverId}`),
    getMyOrders: () => axiosInstance.get<Order[]>('/orders'),
    getById: (id: string) => axiosInstance.get<Order>(`/orders/${id}`),
  },
  payments: {
    getMerchantInfo: () =>
      axiosInstance.get<{ upiId: string; merchantName: string }>('/payments/merchant-info'),
    verifyUtr: (data: { orderId: string; utr: string }) =>
      axiosInstance.post<{ message: string; paymentId: string; ticketId: string; status: string }>(
        '/payments/verify-utr',
        data
      ),
    getMyPayments: () => axiosInstance.get<Payment[]>('/payments'),
  },
  billing: {
    getMyInvoices: () => axiosInstance.get<Invoice[]>('/billing/invoices'),
    downloadInvoice: (id: string) =>
      axiosInstance.get(`/billing/invoices/${id}/download`, { responseType: 'blob' }),
  },
  servers: {
    getMyServers: () => axiosInstance.get<Server[]>('/servers'),
    getAccess: (id: string) =>
      axiosInstance.get<{
        consoleUrl?: string;
        consoleUsername?: string;
        consolePassword?: string;
        accessNotes?: string;
        accessStatus: string;
      }>(`/servers/${id}/access`),
  },
  crm: {
    createTicket: (data: { category: string; title: string; message: string }) =>
      axiosInstance.post<Ticket>('/crm/tickets', data),
    getMyTickets: () => axiosInstance.get<Ticket[]>('/crm/tickets'),
    replyTicket: (ticketId: string, message: string) =>
      axiosInstance.post<TicketMessage>(`/crm/tickets/${ticketId}/reply`, { message }),
  },
  admin: {
    getOrders: () => axiosInstance.get<Order[]>('/admin/orders'),
    getPayments: (status?: string) =>
      axiosInstance.get<Payment[]>('/admin/payments', { params: { status } }),
    approvePayment: (paymentId: string) =>
      axiosInstance.post(`/admin/payments/${paymentId}/approve`),
    failPayment: (paymentId: string, reason: string) =>
      axiosInstance.post(`/admin/payments/${paymentId}/fail`, { reason }),
    getInvoices: () => axiosInstance.get<Invoice[]>('/admin/invoices'),
    downloadInvoice: (invoiceId: string) =>
      axiosInstance.get(`/admin/invoices/${invoiceId}/download`, { responseType: 'blob' }),
    getServers: () => axiosInstance.get<Server[]>('/admin/servers'),
    updateServerAccess: (
      serverId: string,
      data: {
        consoleUrl?: string;
        consoleUsername?: string;
        consolePassword?: string;
        accessNotes?: string;
        accessStatus?: string;
      }
    ) => axiosInstance.patch<Server>(`/admin/servers/${serverId}/access`, data),
    extendSubscription: (serverId: string, days?: number) =>
      axiosInstance.patch<{ message: string; billingPeriodEnd: string }>(
        `/admin/servers/${serverId}/extend`,
        { days }
      ),
    getCustomers: () => axiosInstance.get<any[]>('/admin/customers'),
    getTickets: (status?: string, type?: string) =>
      axiosInstance.get<Ticket[]>('/admin/tickets', { params: { status, type } }),
    replyTicket: (ticketId: string, message: string, status?: string) =>
      axiosInstance.post<TicketMessage>(`/admin/tickets/${ticketId}/messages`, { message, status }),
  },
};

// Aliased service for components using apiService
export const apiService = {
  ...api,
  getMe: () => api.auth.getMe().then((r) => r.data),
  logout: () => api.auth.logout(),
  getPlans: () => api.plans.getAll().then((r) => r.data),
  getOperatingSystems: () => api.plans.getOperatingSystems().then((r) => r.data),
  createOrder: (d: any) => api.orders.create(d).then((r) => r.data),
  createRenewal: (serverId: string) => api.orders.createRenewal(serverId).then((r) => r.data),
  getOrders: () => api.orders.getMyOrders().then((r) => r.data),
  getOrder: (id: string) => api.orders.getById(id).then((r) => r.data),
  getMerchantInfo: () => api.payments.getMerchantInfo().then((r) => r.data),
  submitUTR: (d: any) => api.payments.verifyUtr(d).then((r) => r.data),
  getPayments: () => api.payments.getMyPayments().then((r) => r.data),
  getInvoices: () => api.billing.getMyInvoices().then((r) => r.data),
  downloadInvoice: (id: string) => api.billing.downloadInvoice(id).then((r) => r.data),
  getServers: () => api.servers.getMyServers().then((r) => r.data),
  getServerAccess: (id: string) => api.servers.getAccess(id).then((r) => r.data),
  createTicket: (d: any) => api.crm.createTicket(d).then((r) => r.data),
  getTickets: () => api.crm.getMyTickets().then((r) => r.data),
  replyToTicket: (id: string, msg: string) => api.crm.replyTicket(id, msg).then((r) => r.data),
  admin: {
    getOrders: () => api.admin.getOrders().then((r) => r.data),
    getPayments: (status?: string) => api.admin.getPayments(status).then((r) => r.data),
    approvePayment: (id: string) => api.admin.approvePayment(id).then((r) => r.data),
    failPayment: (id: string, reason: string) => api.admin.failPayment(id, reason).then((r) => r.data),
    getInvoices: () => api.admin.getInvoices().then((r) => r.data),
    downloadInvoice: (invoiceId: string) => api.admin.downloadInvoice(invoiceId).then((r) => r.data),
    getServers: () => api.admin.getServers().then((r) => r.data),
    updateServerAccess: (id: string, d: any) => api.admin.updateServerAccess(id, d).then((r) => r.data),
    extendSubscription: (serverId: string, days?: number) =>
      api.admin.extendSubscription(serverId, days).then((r) => r.data),
    getCustomers: () => api.admin.getCustomers().then((r) => r.data),
    getCustomer: (userId: string) => axiosInstance.get(`/admin/customers/${userId}`).then((r) => r.data),
    getTickets: (status?: string, type?: string) => api.admin.getTickets(status, type).then((r) => r.data),
    replyToTicket: (id: string, msg: string, status?: string) =>
      api.admin.replyTicket(id, msg, status).then((r) => r.data),
  },
};
