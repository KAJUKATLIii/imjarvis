import { Router } from 'express';
import { crmController } from '../controllers/crm.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/tickets', crmController.createTicket);
router.get('/tickets', crmController.getTickets);
router.get('/tickets/:id', crmController.getTicket);
router.post('/tickets/:id/messages', crmController.addMessage);

export default router;
