import { Router } from 'express';
import { paymentsController } from '../controllers/payments.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/merchant-info', paymentsController.getMerchantInfo);
router.post('/verify-utr', paymentsController.submitUTR);
router.get('/', paymentsController.getAll);
router.get('/:id', paymentsController.getOne);

export default router;
