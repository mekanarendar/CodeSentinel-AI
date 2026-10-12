import { Router } from 'express';
import { ProjectController, createProjectSchema } from '../controllers/projectController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';
import { validateBody } from '../middleware/validateRequest.ts';

const router = Router();

router.use(requireAuth);

router.get('/', ProjectController.listProjects);
router.post('/', validateBody(createProjectSchema), ProjectController.createProject);
router.get('/:id', ProjectController.getProject);
router.put('/:id', ProjectController.updateProject);
router.delete('/:id', ProjectController.deleteProject);

export default router;
