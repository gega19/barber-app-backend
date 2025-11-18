import { Request, Response } from 'express';
import appVersionService from '../services/app-version.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/env';

// Configurar multer para almacenar APK en disco
const APK_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'apk');
const MAX_APK_SIZE = 100 * 1024 * 1024; // 100 MB

// Asegurar que el directorio existe
(async () => {
  try {
    await fs.mkdir(APK_UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creando directorio de APK:', error);
  }
})();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, APK_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `app-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_APK_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // Solo permitir archivos .apk
    if (file.mimetype === 'application/vnd.android.package-archive' || 
        path.extname(file.originalname).toLowerCase() === '.apk') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos APK'));
    }
  },
});

export const uploadApkMiddleware = upload.single('apk');

export class AppVersionController {
  /**
   * GET /api/app/version
   * Obtiene la versión activa (público)
   */
  async getActiveVersion(req: Request, res: Response): Promise<void> {
    try {
      const version = await appVersionService.getActiveVersion();
      res.json({
        success: true,
        data: version,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'No hay versión activa disponible',
      });
    }
  }

  /**
   * GET /api/app/download/:versionId
   * Descarga el APK (público, pero registra la descarga)
   */
  async downloadApk(req: Request, res: Response): Promise<void> {
    try {
      const { versionId } = req.params;
      const version = await appVersionService.getVersionById(versionId);

      if (!version.isActive) {
        res.status(403).json({
          success: false,
          message: 'Esta versión no está disponible para descarga',
        });
        return;
      }

      // Registrar la descarga
      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.get('user-agent') || undefined;
      await appVersionService.recordDownload(versionId, ipAddress, userAgent);

      // Si es una URL local, servir el archivo
      if (version.apkUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), version.apkUrl);
        const fileName = `barber-app-v${version.version}.apk`;

        try {
          // Verificar que el archivo existe
          await fs.access(filePath);

          res.setHeader('Content-Type', 'application/vnd.android.package-archive');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Content-Length', version.apkSize.toString());

          // Leer y enviar el archivo
          const fileBuffer = await fs.readFile(filePath);
          res.send(fileBuffer);
        } catch (error) {
          res.status(404).json({
            success: false,
            message: 'Archivo APK no encontrado',
          });
        }
      } else {
        // Si es una URL externa, redirigir
        res.redirect(version.apkUrl);
      }
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Versión no encontrada',
      });
    }
  }

  /**
   * GET /api/admin/app/versions
   * Obtiene todas las versiones (admin)
   */
  async getAllVersions(req: Request, res: Response): Promise<void> {
    try {
      const versions = await appVersionService.getAllVersions();
      res.json({
        success: true,
        data: versions,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener versiones',
      });
    }
  }

  /**
   * GET /api/admin/app/versions/:id
   * Obtiene una versión por ID (admin)
   */
  async getVersionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const version = await appVersionService.getVersionById(id);
      res.json({
        success: true,
        data: version,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Versión no encontrada',
      });
    }
  }

  /**
   * POST /api/admin/app/versions
   * Crea una nueva versión (admin)
   */
  async createVersion(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No se proporcionó archivo APK',
        });
        return;
      }

      const { version, versionCode, releaseNotes } = req.body;

      if (!version || !versionCode) {
        res.status(400).json({
          success: false,
          message: 'version y versionCode son requeridos',
        });
        return;
      }

      // Construir URL relativa del archivo
      const apkUrl = `/uploads/apk/${req.file.filename}`;
      const apkSize = req.file.size;
      const createdBy = req.user?.userId;

      const newVersion = await appVersionService.createVersion({
        version,
        versionCode: parseInt(versionCode, 10),
        apkUrl,
        apkSize,
        releaseNotes: releaseNotes || undefined,
        createdBy,
        isActive: req.body.isActive === 'true' || req.body.isActive === true,
      });

      res.status(201).json({
        success: true,
        data: newVersion,
        message: 'Versión creada exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear versión',
      });
    }
  }

  /**
   * PUT /api/admin/app/versions/:id
   * Actualiza una versión (admin)
   */
  async updateVersion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { version, releaseNotes, isActive } = req.body;

      const updateData: any = {};
      if (version) updateData.version = version;
      if (releaseNotes !== undefined) updateData.releaseNotes = releaseNotes;
      if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;

      const updatedVersion = await appVersionService.updateVersion(id, updateData);

      res.json({
        success: true,
        data: updatedVersion,
        message: 'Versión actualizada exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar versión',
      });
    }
  }

  /**
   * PUT /api/admin/app/versions/:id/activate
   * Activa una versión (admin)
   */
  async activateVersion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const activatedVersion = await appVersionService.activateVersion(id);

      res.json({
        success: true,
        data: activatedVersion,
        message: 'Versión activada exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al activar versión',
      });
    }
  }

  /**
   * DELETE /api/admin/app/versions/:id
   * Elimina una versión (admin)
   */
  async deleteVersion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await appVersionService.deleteVersion(id);

      res.json({
        success: true,
        message: 'Versión eliminada exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al eliminar versión',
      });
    }
  }

  /**
   * GET /api/admin/app/stats
   * Obtiene estadísticas de descargas (admin)
   */
  async getDownloadStats(req: Request, res: Response): Promise<void> {
    try {
      const { versionId } = req.query;
      const stats = await appVersionService.getDownloadStats(
        versionId as string | undefined
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas',
      });
    }
  }
}

export default new AppVersionController();

