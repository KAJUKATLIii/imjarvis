import { Router } from 'express';
import { operatingSystemsController } from '../controllers/plans.controller';

const router = Router();

router.get('/', operatingSystemsController.getAll);

export default router;
