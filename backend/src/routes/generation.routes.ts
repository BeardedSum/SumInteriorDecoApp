import { Router } from 'express';
import generationController from '../controllers/generation.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All generation routes require authentication
router.use(authMiddleware);

// Main generation endpoint
router.post('/generate', (req, res, next) => generationController.generateDesign(req, res).catch(next));

// Job status and history
router.get('/jobs', (req, res, next) => generationController.getUserJobs(req, res).catch(next));
router.get('/jobs/:id', (req, res, next) => generationController.getJobStatus(req, res).catch(next));

// AI services
router.post('/analyze', (req, res, next) => generationController.analyzeImage(req, res).catch(next));
router.post('/consultation', (req, res, next) => generationController.getConsultation(req, res).catch(next));

export default router;
