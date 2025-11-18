import prisma from '../config/prisma';

export type LegalDocumentType = 'privacy' | 'terms' | 'cookies';

export interface CreateLegalDocumentData {
  type: LegalDocumentType;
  title: string;
  content: string;
  createdBy?: string;
  isActive?: boolean;
}

export interface UpdateLegalDocumentData {
  title?: string;
  content?: string;
  isActive?: boolean;
}

export class LegalDocumentService {
  /**
   * Obtiene el documento activo de un tipo específico
   */
  async getActiveDocument(type: LegalDocumentType) {
    const document = await prisma.legalDocument.findFirst({
      where: {
        type,
        isActive: true,
      },
      orderBy: {
        version: 'desc',
      },
    });

    if (!document) {
      throw new Error(`No hay documento activo de tipo ${type}`);
    }

    return document;
  }

  /**
   * Obtiene todos los documentos de un tipo (para admin)
   */
  async getDocumentsByType(type: LegalDocumentType) {
    return await prisma.legalDocument.findMany({
      where: { type },
      orderBy: {
        version: 'desc',
      },
    });
  }

  /**
   * Obtiene todos los documentos (para admin)
   */
  async getAllDocuments() {
    return await prisma.legalDocument.findMany({
      orderBy: [
        { type: 'asc' },
        { version: 'desc' },
      ],
    });
  }

  /**
   * Obtiene un documento por ID
   */
  async getDocumentById(id: string) {
    const document = await prisma.legalDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new Error('Documento no encontrado');
    }

    return document;
  }

  /**
   * Crea un nuevo documento legal
   */
  async createDocument(data: CreateLegalDocumentData) {
    // Obtener la última versión del tipo
    const lastVersion = await prisma.legalDocument.findFirst({
      where: { type: data.type },
      orderBy: { version: 'desc' },
    });

    const newVersion = lastVersion ? lastVersion.version + 1 : 1;

    // Si se marca como activo, desactivar todos los demás del mismo tipo
    if (data.isActive !== false) {
      await prisma.legalDocument.updateMany({
        where: {
          type: data.type,
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    return await prisma.legalDocument.create({
      data: {
        type: data.type,
        title: data.title,
        content: data.content,
        version: newVersion,
        isActive: data.isActive !== false,
        createdBy: data.createdBy,
      },
    });
  }

  /**
   * Actualiza un documento
   */
  async updateDocument(id: string, data: UpdateLegalDocumentData) {
    // Si se activa este documento, desactivar todos los demás del mismo tipo
    if (data.isActive === true) {
      const document = await prisma.legalDocument.findUnique({
        where: { id },
      });

      if (document) {
        await prisma.legalDocument.updateMany({
          where: {
            type: document.type,
            isActive: true,
            id: { not: id },
          },
          data: { isActive: false },
        });
      }
    }

    return await prisma.legalDocument.update({
      where: { id },
      data,
    });
  }

  /**
   * Activa un documento (desactiva los demás del mismo tipo)
   */
  async activateDocument(id: string) {
    const document = await prisma.legalDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new Error('Documento no encontrado');
    }

    // Desactivar todos los documentos del mismo tipo
    await prisma.legalDocument.updateMany({
      where: {
        type: document.type,
        isActive: true,
      },
      data: { isActive: false },
    });

    // Activar el documento especificado
    return await prisma.legalDocument.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Elimina un documento
   */
  async deleteDocument(id: string) {
    const document = await prisma.legalDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new Error('Documento no encontrado');
    }

    // No permitir eliminar si es el único documento activo de su tipo
    if (document.isActive) {
      const otherActive = await prisma.legalDocument.findFirst({
        where: {
          type: document.type,
          isActive: true,
          id: { not: id },
        },
      });

      if (!otherActive) {
        throw new Error('No se puede eliminar el único documento activo de este tipo');
      }
    }

    return await prisma.legalDocument.delete({
      where: { id },
    });
  }
}

export default new LegalDocumentService();

