import { Router } from 'express';
import { ordersController } from '../controllers/orders.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', ordersController.create);
router.post('/renew/:serverId', ordersController.createRenewal);
router.get('/', ordersController.getAll);
router.get('/:id', ordersController.getOne);

export default router;
