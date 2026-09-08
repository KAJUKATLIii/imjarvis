import { Router } from 'express';
import { plansController, operatingSystemsController } from '../controllers/plans.controller';

const router = Router();

router.get('/', plansController.getAll);
router.get('/:id', plansController.getOne);

export { operatingSystemsController };
export default router;
