import { Request, Response } from 'express';
import legalDocumentService, { LegalDocumentType } from '../services/legal-document.service';

export class LegalDocumentController {
  /**
   * GET /api/legal/:type
   * Obtiene el documento activo de un tipo (público)
   */
  async getActiveDocument(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      
      if (!['privacy', 'terms', 'cookies'].includes(type)) {
        res.status(400).json({
          success: false,
          message: 'Tipo de documento inválido. Debe ser: privacy, terms o cookies',
        });
        return;
      }

      const document = await legalDocumentService.getActiveDocument(type as LegalDocumentType);
      
      res.json({
        success: true,
        data: document,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Documento no encontrado',
      });
    }
  }

  /**
   * GET /api/admin/legal/documents
   * Obtiene todos los documentos (admin)
   */
  async getAllDocuments(req: Request, res: Response): Promise<void> {
    try {
      const documents = await legalDocumentService.getAllDocuments();
      res.json({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener documentos',
      });
    }
  }

  /**
   * GET /api/admin/legal/documents/:type
   * Obtiene todos los documentos de un tipo (admin)
   */
  async getDocumentsByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      
      if (!['privacy', 'terms', 'cookies'].includes(type)) {
        res.status(400).json({
          success: false,
          message: 'Tipo de documento inválido. Debe ser: privacy, terms o cookies',
        });
        return;
      }

      const documents = await legalDocumentService.getDocumentsByType(type as LegalDocumentType);
      res.json({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener documentos',
      });
    }
  }

  /**
   * GET /api/admin/legal/documents/:id
   * Obtiene un documento por ID (admin)
   */
  async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const document = await legalDocumentService.getDocumentById(id);
      res.json({
        success: true,
        data: document,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Documento no encontrado',
      });
    }
  }

  /**
   * POST /api/admin/legal/documents
   * Crea un nuevo documento (admin)
   */
  async createDocument(req: Request, res: Response): Promise<void> {
    try {
      const { type, title, content, isActive } = req.body;
      const createdBy = req.user?.userId;

      if (!type || !title || !content) {
        res.status(400).json({
          success: false,
          message: 'type, title y content son requeridos',
        });
        return;
      }

      if (!['privacy', 'terms', 'cookies'].includes(type)) {
        res.status(400).json({
          success: false,
          message: 'Tipo de documento inválido. Debe ser: privacy, terms o cookies',
        });
        return;
      }

      const document = await legalDocumentService.createDocument({
        type: type as LegalDocumentType,
        title,
        content,
        createdBy,
        isActive: isActive === true || isActive === 'true',
      });

      res.status(201).json({
        success: true,
        data: document,
        message: 'Documento creado exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear documento',
      });
    }
  }

  /**
   * PUT /api/admin/legal/documents/:id
   * Actualiza un documento (admin)
   */
  async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, content, isActive } = req.body;

      const updateData: any = {};
      if (title) updateData.title = title;
      if (content) updateData.content = content;
      if (isActive !== undefined) {
        updateData.isActive = isActive === true || isActive === 'true';
      }

      const document = await legalDocumentService.updateDocument(id, updateData);

      res.json({
        success: true,
        data: document,
        message: 'Documento actualizado exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar documento',
      });
    }
  }

  /**
   * PUT /api/admin/legal/documents/:id/activate
   * Activa un documento (admin)
   */
  async activateDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const document = await legalDocumentService.activateDocument(id);

      res.json({
        success: true,
        data: document,
        message: 'Documento activado exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al activar documento',
      });
    }
  }

  /**
   * DELETE /api/admin/legal/documents/:id
   * Elimina un documento (admin)
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await legalDocumentService.deleteDocument(id);

      res.json({
        success: true,
        message: 'Documento eliminado exitosamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al eliminar documento',
      });
    }
  }
}

export default new LegalDocumentController();

