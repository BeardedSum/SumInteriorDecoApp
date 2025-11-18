import { Router } from 'express';
import projectController from '../controllers/project.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All project routes require authentication
router.use(authMiddleware);

// Project CRUD
router.get('/', (req, res, next) => projectController.getUserProjects(req, res).catch(next));
router.get('/:id', (req, res, next) => projectController.getProjectById(req, res).catch(next));
router.post('/', (req, res, next) => projectController.createProject(req, res).catch(next));
router.put('/:id', (req, res, next) => projectController.updateProject(req, res).catch(next));
router.delete('/:id', (req, res, next) => projectController.deleteProject(req, res).catch(next));

// Project actions
router.post('/:id/favorite', (req, res, next) => projectController.toggleFavorite(req, res).catch(next));
router.post('/:id/view', (req, res, next) => projectController.incrementViewCount(req, res).catch(next));
router.post('/:id/share', (req, res, next) => projectController.incrementShareCount(req, res).catch(next));

export default router;
