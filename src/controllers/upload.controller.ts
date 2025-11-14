import { Request, Response } from 'express';
import multer from 'multer';
import cloudinaryService from '../services/cloudinary.service';

// Configurar multer para memoria (no guardar en disco, subir directamente a Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  },
});

export const uploadMiddleware = upload.single('file');

export class UploadController {
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      // Determinar tipo de recurso
      const isVideo = req.file.mimetype.startsWith('video/');
      const resourceType = isVideo ? 'video' : 'image';

      // Generar nombre único
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = req.file.originalname.split('.').pop() || '';
      const fileName = `${req.file.fieldname}-${uniqueSuffix}.${ext}`;

      // Subir a Cloudinary
      const result = await cloudinaryService.uploadFile(
        req.file.buffer,
        fileName,
        'barber-app',
        {
          resourceType: resourceType,
          generateThumbnail: isVideo,
        }
      );

      // Construir respuesta
      const responseData: any = {
        url: result.secure_url, // URL completa de Cloudinary
        publicId: result.public_id, // ID público para futuras operaciones
        filename: result.original_filename || req.file.originalname,
        mimetype: req.file.mimetype,
        size: result.bytes || req.file.size,
      };

      // Agregar dimensiones si están disponibles
      if (result.width) responseData.width = result.width;
      if (result.height) responseData.height = result.height;

      // Si es video y tiene thumbnail, agregarlo
      if (isVideo && result.eager && result.eager.length > 0) {
        responseData.thumbnail = result.eager[0].secure_url;
      }

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload file';
      console.error('Upload error:', error);
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Endpoint opcional para eliminar archivos de Cloudinary
   */
  async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { publicId, resourceType } = req.body;

      if (!publicId) {
        res.status(400).json({
          success: false,
          message: 'publicId is required',
        });
        return;
      }

      await cloudinaryService.deleteFile(
        publicId,
        (resourceType as 'image' | 'video') || 'image'
      );

      res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete file';
      console.error('Delete error:', error);
      res.status(500).json({ success: false, message });
    }
  }
}

export default new UploadController();
