import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import CloudinaryService from '../services/cloudinary.service';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});

export class UploadController {
  /**
   * Upload single image to Cloudinary
   */
  async uploadImage(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const userId = req.user!.id;
      const { folder = 'user-uploads', tags } = req.body;

      // Convert buffer to base64
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      // Upload to Cloudinary
      const result = await CloudinaryService.uploadImage(base64Image, {
        folder: `sum-decor/${folder}`,
        tags: tags ? JSON.parse(tags) : ['user-upload'],
        resource_type: 'image',
      });

      res.json({
        success: true,
        data: {
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          size: req.file.size,
        },
      });
    } catch (error: any) {
      console.error('Image upload error:', error);
      throw new AppError(error.message || 'Image upload failed', 500);
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(req: AuthRequest, res: Response) {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      const userId = req.user!.id;
      const { folder = 'user-uploads', tags } = req.body;

      const uploadPromises = req.files.map(async (file) => {
        const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

        const result = await CloudinaryService.uploadImage(base64Image, {
          folder: `sum-decor/${folder}`,
          tags: tags ? JSON.parse(tags) : ['user-upload'],
          resource_type: 'image',
        });

        return {
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          size: file.size,
          originalName: file.originalname,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);

      res.json({
        success: true,
        data: {
          images: uploadedImages,
          count: uploadedImages.length,
        },
      });
    } catch (error: any) {
      console.error('Multiple image upload error:', error);
      throw new AppError(error.message || 'Image upload failed', 500);
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(req: AuthRequest, res: Response) {
    try {
      const { public_id } = req.body;

      if (!public_id) {
        throw new AppError('Public ID is required', 400);
      }

      await CloudinaryService.deleteImage(public_id);

      res.json({
        success: true,
        message: 'Image deleted successfully',
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Image deletion failed', 500);
    }
  }

  /**
   * Get upload signature (for direct client-side uploads)
   */
  async getUploadSignature(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { folder = 'user-uploads' } = req.query;

      const timestamp = Math.round(Date.now() / 1000);
      const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'sum-decor-preset';

      // Generate signature for client-side upload
      const signature = CloudinaryService.generateSignature({
        timestamp,
        folder: `sum-decor/${folder}`,
        upload_preset: uploadPreset,
      });

      res.json({
        success: true,
        data: {
          signature,
          timestamp,
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          upload_preset: uploadPreset,
          folder: `sum-decor/${folder}`,
        },
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to generate upload signature', 500);
    }
  }
}

export default new UploadController();
