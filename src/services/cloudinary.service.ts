import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width?: number;
  height?: number;
  bytes: number;
  format: string;
  resource_type: string;
  original_filename?: string;
  eager?: Array<{
    secure_url: string;
    url: string;
    width: number;
    height: number;
  }>;
}

export class CloudinaryService {
  /**
   * Sube un archivo a Cloudinary
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    folder: string = 'barber-app',
    options?: {
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
      generateThumbnail?: boolean;
    }
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      // Remover extensión del nombre para public_id
      const publicId = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      
      const uploadOptions: any = {
        folder: folder,
        public_id: publicId,
        resource_type: options?.resourceType || 'auto',
        overwrite: false,
        invalidate: true,
        use_filename: true,
        unique_filename: true,
      };

      // Para videos, generar thumbnail automáticamente
      if (options?.resourceType === 'video' || fileName.match(/\.(mp4|mov|avi)$/i)) {
        uploadOptions.eager = [
          { width: 300, height: 300, crop: 'thumb', format: 'jpg' }
        ];
        uploadOptions.resource_type = 'video';
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result as CloudinaryUploadResult);
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Elimina un archivo de Cloudinary
   */
  async deleteFile(publicId: string, resourceType: 'image' | 'video' = 'image') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Genera URL optimizada para imagen
   */
  getOptimizedImageUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  }): string {
    const transformations = [];
    
    if (options?.width) transformations.push(`w_${options.width}`);
    if (options?.height) transformations.push(`h_${options.height}`);
    if (options?.quality) transformations.push(`q_${options.quality}`);
    if (options?.format) transformations.push(`f_${options.format}`);
    
    const transformString = transformations.length > 0 
      ? transformations.join(',') + '/' 
      : '';
    
    return cloudinary.url(`${transformString}${publicId}`, {
      secure: true,
    });
  }

  /**
   * Genera URL de thumbnail para video
   */
  getVideoThumbnailUrl(publicId: string, width: number = 300, height: number = 300): string {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: [
        { width, height, crop: 'thumb', format: 'jpg' }
      ],
      secure: true,
    });
  }
}

export default new CloudinaryService();

