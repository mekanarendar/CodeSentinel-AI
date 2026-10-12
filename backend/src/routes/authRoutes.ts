import { Router } from 'express';
import { AuthController, registerSchema, loginSchema } from '../controllers/authController.ts';
import { validateBody } from '../middleware/validateRequest.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';
import { authRateLimiter } from '../middleware/rateLimiter.ts';

const router = Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validateBody(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.me);
router.put('/preferences', requireAuth, AuthController.updatePreferences);

export default router;
