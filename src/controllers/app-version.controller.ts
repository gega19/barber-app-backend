import { Request, Response } from 'express';
import appVersionService from '../services/app-version.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/env';
import cloudinaryService from '../services/cloudinary.service';

// Configurar multer para almacenar APK en memoria (luego subir a Cloudinary)
// Usamos memoryStorage porque vamos a subir directamente a Cloudinary
const MAX_APK_SIZE = 100 * 1024 * 1024; // 100 MB

// También mantener almacenamiento en disco como fallback si Cloudinary no está configurado
const APK_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'apk');

// Asegurar que el directorio existe (para fallback)
(async () => {
  try {
    await fs.mkdir(APK_UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creando directorio de APK:', error);
  }
})();

// Usar memoryStorage para subir a Cloudinary
const storage = multer.memoryStorage();

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

// Middleware para manejar errores de multer
export const handleApkUploadError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `El archivo APK es demasiado grande. El tamaño máximo es 100 MB.`,
      });
    }
    return res.status(400).json({
      success: false,
      message: `Error al subir archivo: ${err.message}`,
    });
  }
  if (err) {
    // Error del fileFilter u otro error de multer
    return res.status(400).json({
      success: false,
      message: err.message || 'Error al procesar el archivo APK',
    });
  }
  next();
};

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
   * GET /api/app/minimum-version
   * Obtiene los requisitos de versión mínima (público)
   * Usado por la app para verificar si necesita actualizarse
   */
  async getMinimumVersionRequirement(req: Request, res: Response): Promise<void> {
    try {
      const requirement = await appVersionService.getMinimumVersionRequirement();
      res.json({
        success: true,
        data: requirement,
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
      console.log(`📥 Download request for version ID: ${versionId}`);

      const version = await appVersionService.getVersionById(versionId);
      console.log(`✅ Version found: ${version.version} (${version.id}), isActive: ${version.isActive}, apkUrl: ${version.apkUrl}`);

      if (!version.isActive) {
        console.log(`❌ Version ${versionId} is not active`);
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

      // Si es una URL local (fallback), intentar servir el archivo
      if (version.apkUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), version.apkUrl);
        const fileName = `barber-app-v${version.version}.apk`;
        console.log(`📁 Looking for file at: ${filePath}`);

        try {
          // Verificar que el archivo existe
          await fs.access(filePath);
          console.log(`✅ File exists, size: ${version.apkSize} bytes`);

          res.setHeader('Content-Type', 'application/vnd.android.package-archive');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Content-Length', version.apkSize.toString());
          res.setHeader('Cache-Control', 'no-cache');

          // Leer y enviar el archivo
          const fileBuffer = await fs.readFile(filePath);
          console.log(`✅ File read successfully, sending ${fileBuffer.length} bytes`);
          res.send(fileBuffer);
        } catch (error: any) {
          console.error(`❌ File access error: ${error.message}`);
          console.error(`   File path: ${filePath}`);
          console.error(`   Current working directory: ${process.cwd()}`);
          console.error(`   ⚠️  This version was uploaded before Cloudinary integration. Please re-upload the APK from the backoffice.`);
          res.status(404).json({
            success: false,
            message: `El archivo APK no se encuentra en el servidor. Esto puede ocurrir porque el archivo se perdió en un deploy anterior. Por favor, vuelve a subir el APK desde el backoffice para que se guarde en Cloudinary.`,
            requiresReupload: true,
          });
        }
      } else {
        // Si es una URL externa (Cloudinary u otro), redirigir
        console.log(`🔗 Redirecting to external URL: ${version.apkUrl}`);
        res.redirect(version.apkUrl);
      }
    } catch (error: any) {
      console.error(`❌ Download error: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
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
      console.log('📦 Creating app version...');
      console.log('📄 File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
      console.log('📋 Body:', req.body);

      const {
        version,
        versionCode,
        releaseNotes,
        isActive,
        minimumVersionCode,
        updateUrl,
        updateType,
        forceUpdate,
      } = req.body;

      const effectiveUpdateType = updateType || 'apk';

      // Permite crear versión sin archivo (apkUrl será string vacío o updateUrl)
      // if (effectiveUpdateType === 'apk' && !req.file) {
      //   res.status(400).json({
      //     success: false,
      //     message: 'No se proporcionó archivo APK',
      //   });
      //   return;
      // }

      console.log('📝 Parsed data:', {
        version,
        versionCode,
        releaseNotes,
        isActive,
        minimumVersionCode,
        updateUrl,
        updateType,
        forceUpdate,
      });

      if (!version || !versionCode) {
        res.status(400).json({
          success: false,
          message: 'version y versionCode son requeridos',
          received: { version, versionCode },
        });
        return;
      }

      let apkUrl: string;
      const apkSize = req.file ? req.file.size : 0;
      const createdBy = req.user?.userId;

      if (req.file) {
        // Intentar subir a Cloudinary primero (persistente)
        try {
          if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
            console.log('☁️  Uploading APK to Cloudinary...');
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path.extname(req.file.originalname);
            const fileName = `barber-app-v${version}-${uniqueSuffix}${ext}`;

            const cloudinaryResult = await cloudinaryService.uploadFile(
              req.file.buffer,
              fileName,
              'barber-app/apk',
              {
                resourceType: 'raw', // Archivos binarios como APK
              }
            );

            apkUrl = cloudinaryResult.secure_url;
            console.log(`✅ APK uploaded to Cloudinary: ${apkUrl}`);
          } else {
            throw new Error('Cloudinary not configured, using local storage');
          }
        } catch (error: any) {
          // Fallback: guardar localmente si Cloudinary falla o no está configurado
          console.warn(`⚠️  Cloudinary upload failed: ${error.message}, using local storage`);
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(req.file.originalname);
          const filename = `app-${uniqueSuffix}${ext}`;
          const filePath = path.join(APK_UPLOAD_DIR, filename);

          await fs.writeFile(filePath, req.file.buffer);
          apkUrl = `/uploads/apk/${filename}`;
          console.log(`📁 APK saved locally: ${apkUrl}`);
        }
      } else {
        // Sin APK (store/url): usar updateUrl o un placeholder vacío
        apkUrl = updateUrl || '';
      }

      const newVersion = await appVersionService.createVersion({
        version,
        versionCode: parseInt(versionCode, 10),
        apkUrl,
        apkSize,
        releaseNotes: releaseNotes || undefined,
        createdBy,
        isActive: req.body.isActive === 'true' || req.body.isActive === true,
        minimumVersionCode: minimumVersionCode ? parseInt(minimumVersionCode, 10) : undefined,
        updateUrl: updateUrl || undefined,
        updateType: effectiveUpdateType || undefined,
        forceUpdate: forceUpdate === 'true' || forceUpdate === true,
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
      const {
        version,
        releaseNotes,
        isActive,
        minimumVersionCode,
        updateUrl,
        updateType,
        forceUpdate,
      } = req.body;

      const updateData: any = {};
      if (version) updateData.version = version;
      if (releaseNotes !== undefined) updateData.releaseNotes = releaseNotes;
      if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
      if (minimumVersionCode !== undefined) {
        updateData.minimumVersionCode = minimumVersionCode ? parseInt(minimumVersionCode, 10) : null;
      }
      if (updateUrl !== undefined) updateData.updateUrl = updateUrl || null;
      if (updateType !== undefined) updateData.updateType = updateType || null;
      if (forceUpdate !== undefined) {
        updateData.forceUpdate = forceUpdate === 'true' || forceUpdate === true;
      }

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

