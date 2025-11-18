import { Router } from 'express';
import uploadController, { upload } from '../controllers/upload.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All upload routes require authentication
router.use(authMiddleware);

// Single image upload
router.post('/image', upload.single('image'), (req, res, next) =>
  uploadController.uploadImage(req, res).catch(next)
);

// Multiple images upload
router.post('/images', upload.array('images', 20), (req, res, next) =>
  uploadController.uploadMultipleImages(req, res).catch(next)
);

// Delete image
router.delete('/image', (req, res, next) =>
  uploadController.deleteImage(req, res).catch(next)
);

// Get upload signature for client-side uploads
router.get('/signature', (req, res, next) =>
  uploadController.getUploadSignature(req, res).catch(next)
);

export default router;
