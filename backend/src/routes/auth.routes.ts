import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

router.get('/discord', authController.discord);
router.get('/discord/callback', authController.discordCallback);
router.get('/me', authController.me);
router.get('/avatar/:discordId', authController.getAvatar);
router.post('/logout', authController.logout);

export default router;
