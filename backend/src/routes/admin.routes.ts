import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

router.use(requireAdmin);

// ─── Orders ────────────────────────────────────────────────────────────────
router.get('/orders', adminController.getOrders);

// ─── Payments ──────────────────────────────────────────────────────────────
router.get('/payments', adminController.getPayments);
router.patch('/payments/:paymentId/approve', adminController.approvePayment);
router.post('/payments/:paymentId/approve', adminController.approvePayment);
router.patch('/payments/:paymentId/fail', adminController.failPayment);
router.post('/payments/:paymentId/fail', adminController.failPayment);

// ─── Invoices ──────────────────────────────────────────────────────────────
router.get('/invoices', adminController.getInvoices);
router.get('/invoices/:invoiceId/download', adminController.downloadInvoice);

// ─── Servers ───────────────────────────────────────────────────────────────
router.get('/servers', adminController.getServers);
router.get('/servers/:serverId', adminController.getServer);
router.patch('/servers/:serverId/access', adminController.updateServerAccess);
router.patch('/servers/:serverId/extend', adminController.extendSubscription);
router.post('/servers/:serverId/extend', adminController.extendSubscription);

// ─── Customers ─────────────────────────────────────────────────────────────
router.get('/customers', adminController.getCustomers);
router.get('/customers/:userId', adminController.getCustomer);

// ─── CRM ───────────────────────────────────────────────────────────────────
router.get('/tickets', adminController.getTickets);
router.post('/tickets/:ticketId/messages', adminController.replyToTicket);

export default router;
