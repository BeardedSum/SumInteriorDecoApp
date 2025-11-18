import { Router } from 'express';
import styleController from '../controllers/style.controller';

const router = Router();

// Public routes - no authentication required
router.get('/', (req, res, next) => styleController.getAllStyles(req, res).catch(next));
router.get('/popular', (req, res, next) => styleController.getPopularStyles(req, res).catch(next));
router.get('/categories', (req, res, next) => styleController.getCategories(req, res).catch(next));
router.get('/category/:category', (req, res, next) => styleController.getStylesByCategory(req, res).catch(next));
router.get('/:id', (req, res, next) => styleController.getStyleById(req, res).catch(next));

// Style usage tracking
router.post('/:id/use', (req, res, next) => styleController.incrementUsageCount(req, res).catch(next));

export default router;
