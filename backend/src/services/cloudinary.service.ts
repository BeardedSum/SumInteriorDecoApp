import { v2 as cloudinary } from 'cloudinary';
import config from '../config';
import sharp from 'sharp';

interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
    });
  }

  /**
   * Upload image to Cloudinary
   */
  async uploadImage(
    buffer: Buffer,
    folder: string = 'uploads',
    options?: {
      quality?: number;
      format?: string;
      maxWidth?: number;
      maxHeight?: number;
      addWatermark?: boolean;
    }
  ): Promise<UploadResult> {
    try {
      let processedBuffer = buffer;

      // Process image with Sharp if options are provided
      if (options) {
        let sharpInstance = sharp(buffer);

        // Resize if max dimensions specified
        if (options.maxWidth || options.maxHeight) {
          sharpInstance = sharpInstance.resize(options.maxWidth, options.maxHeight, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        // Set format and quality
        if (options.format === 'webp') {
          sharpInstance = sharpInstance.webp({ quality: options.quality || 85 });
        } else if (options.format === 'jpeg' || options.format === 'jpg') {
          sharpInstance = sharpInstance.jpeg({ quality: options.quality || 85 });
        } else if (options.format === 'png') {
          sharpInstance = sharpInstance.png({ quality: options.quality || 85 });
        }

        processedBuffer = await sharpInstance.toBuffer();
      }

      // Upload to Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `${config.cloudinary.folder}/${folder}`,
            resource_type: 'image',
            transformation: options?.addWatermark
              ? [
                  {
                    overlay: {
                      font_family: 'Arial',
                      font_size: 24,
                      text: 'Sum Decor AI',
                    },
                    gravity: 'south_east',
                    x: 10,
                    y: 10,
                    opacity: 70,
                  },
                ]
              : undefined,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(processedBuffer);
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload image from URL
   */
  async uploadFromUrl(url: string, folder: string = 'uploads'): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: `${config.cloudinary.folder}/${folder}`,
        resource_type: 'image',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error: any) {
      console.error('Cloudinary upload from URL error:', error);
      throw new Error(`Failed to upload image from URL: ${error.message}`);
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error: any) {
      console.error('Cloudinary delete error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Get optimized image URL
   */
  getOptimizedUrl(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
    }
  ): string {
    return cloudinary.url(publicId, {
      transformation: [
        {
          width: options?.width,
          height: options?.height,
          crop: 'limit',
          quality: options?.quality || 'auto',
          fetch_format: options?.format || 'auto',
        },
      ],
    });
  }

  /**
   * Generate thumbnail
   */
  getThumbnailUrl(publicId: string, width: number = 300, height: number = 300): string {
    return cloudinary.url(publicId, {
      transformation: [
        {
          width,
          height,
          crop: 'fill',
          gravity: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
    });
  }

  /**
   * Add watermark to image
   */
  async addWatermark(publicId: string, text: string = 'Sum Decor AI'): Promise<string> {
    return cloudinary.url(publicId, {
      transformation: [
        {
          overlay: {
            font_family: 'Arial',
            font_size: 32,
            font_weight: 'bold',
            text,
          },
          gravity: 'south_east',
          x: 15,
          y: 15,
          opacity: 70,
          color: '#FFFFFF',
        },
      ],
    });
  }
}

export default new CloudinaryService();
