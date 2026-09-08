import { Router } from 'express';
import { billingController } from '../controllers/billing.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/invoices', billingController.getInvoices);
router.get('/invoices/:id', billingController.getInvoice);
router.get('/invoices/:id/download', billingController.downloadInvoice);

export default router;
