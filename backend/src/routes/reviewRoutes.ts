import { Router } from 'express';
import { ReviewController, analyzeCodeSchema } from '../controllers/reviewController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';
import { validateBody } from '../middleware/validateRequest.ts';
import { aiAnalysisRateLimiter } from '../middleware/rateLimiter.ts';
import { uploadProjectArchive } from '../middleware/uploadMiddleware.ts';

const router = Router();

router.use(requireAuth);

router.post('/code', aiAnalysisRateLimiter, validateBody(analyzeCodeSchema), ReviewController.analyzeCode);
router.post('/project-upload', aiAnalysisRateLimiter, uploadProjectArchive.single('archive'), ReviewController.analyzeProjectUpload);
router.get('/', ReviewController.listReviews);
router.get('/:id', ReviewController.getReview);
router.delete('/:id', ReviewController.deleteReview);
router.post('/compare', ReviewController.compare);
router.get('/:id/export', ReviewController.exportReport);

export default router;
