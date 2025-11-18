import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

export interface CreateAppVersionData {
  version: string;
  versionCode: number;
  apkUrl: string;
  apkSize: number;
  releaseNotes?: string;
  createdBy?: string;
  isActive?: boolean;
}

export interface UpdateAppVersionData {
  version?: string;
  releaseNotes?: string;
  isActive?: boolean;
}

export class AppVersionService {
  /**
   * Obtiene la versión activa de la app
   */
  async getActiveVersion() {
    const version = await prisma.appVersion.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        versionCode: 'desc',
      },
    });

    if (!version) {
      throw new Error('No hay versión activa disponible');
    }

    return version;
  }

  /**
   * Obtiene todas las versiones (para admin)
   */
  async getAllVersions() {
    return await prisma.appVersion.findMany({
      orderBy: {
        versionCode: 'desc',
      },
      include: {
        _count: {
          select: {
            downloads: true,
          },
        },
      },
    });
  }

  /**
   * Obtiene una versión por ID
   */
  async getVersionById(id: string) {
    const version = await prisma.appVersion.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            downloads: true,
          },
        },
      },
    });

    if (!version) {
      throw new Error('Versión no encontrada');
    }

    return version;
  }

  /**
   * Crea una nueva versión de la app
   */
  async createVersion(data: CreateAppVersionData) {
    // Validar que el versionCode sea único
    const existingVersion = await prisma.appVersion.findUnique({
      where: { versionCode: data.versionCode },
    });

    if (existingVersion) {
      throw new Error(`Ya existe una versión con versionCode ${data.versionCode}`);
    }

    // Si se marca como activa, desactivar todas las demás
    const isActive = data.isActive !== undefined ? data.isActive : false;
    if (isActive) {
      await prisma.appVersion.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    return await prisma.appVersion.create({
      data: {
        version: data.version,
        versionCode: data.versionCode,
        apkUrl: data.apkUrl,
        apkSize: data.apkSize,
        releaseNotes: data.releaseNotes,
        createdBy: data.createdBy,
        isActive,
      },
    });
  }

  /**
   * Actualiza una versión
   */
  async updateVersion(id: string, data: UpdateAppVersionData) {
    // Si se activa esta versión, desactivar todas las demás
    if (data.isActive === true) {
      await prisma.appVersion.updateMany({
        where: {
          isActive: true,
          id: { not: id },
        },
        data: { isActive: false },
      });
    }

    return await prisma.appVersion.update({
      where: { id },
      data,
    });
  }

  /**
   * Activa una versión (desactiva las demás)
   */
  async activateVersion(id: string) {
    // Desactivar todas las versiones
    await prisma.appVersion.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Activar la versión especificada
    return await prisma.appVersion.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Registra una descarga
   */
  async recordDownload(versionId: string, ipAddress?: string, userAgent?: string) {
    // Incrementar contador de descargas
    await prisma.appVersion.update({
      where: { id: versionId },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

    // Registrar descarga en la tabla de downloads
    return await prisma.download.create({
      data: {
        versionId,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Elimina una versión (y sus descargas asociadas por cascade)
   */
  async deleteVersion(id: string) {
    const version = await prisma.appVersion.findUnique({
      where: { id },
    });

    if (!version) {
      throw new Error('Versión no encontrada');
    }

    // Si hay un archivo local, intentar eliminarlo
    if (version.apkUrl.startsWith('/uploads/')) {
      try {
        const filePath = path.join(process.cwd(), version.apkUrl);
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`No se pudo eliminar el archivo APK: ${version.apkUrl}`, error);
      }
    }

    return await prisma.appVersion.delete({
      where: { id },
    });
  }

  /**
   * Obtiene estadísticas de descargas
   */
  async getDownloadStats(versionId?: string) {
    const where = versionId ? { versionId } : {};

    const totalDownloads = await prisma.download.count(where ? { where } : undefined);
    const downloadsByDate = await prisma.download.groupBy({
      by: ['downloadedAt'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        downloadedAt: 'desc',
      },
    });

    return {
      totalDownloads,
      downloadsByDate: downloadsByDate.map((item) => ({
        date: item.downloadedAt,
        count: item._count.id,
      })),
    };
  }
}

export default new AppVersionService();

