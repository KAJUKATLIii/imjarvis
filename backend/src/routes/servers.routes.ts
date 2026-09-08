import { Router } from 'express';
import { serversController } from '../controllers/servers.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', serversController.getAll);
router.get('/:id', serversController.getOne);
router.get('/:id/access', serversController.getAccess);

export default router;
