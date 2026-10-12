import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';

const router = Router();

router.use(requireAuth);

router.get('/stats', DashboardController.getStats);

export default router;
