import { Request, Response } from 'express';
import barberCourseService from '../services/barber-course.service';
import { verifyBarberOwnership, verifyCourseOwnership } from '../utils/barber-authorization.helper';

class BarberCourseController {
  async getBarberCourses(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const courses = await barberCourseService.getBarberCourses(barberId);
      res.status(200).json({
        success: true,
        data: courses,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get courses';
      res.status(500).json({ success: false, message });
    }
  }

  async getCourseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const course = await barberCourseService.getCourseById(id);

      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: course,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get course';
      res.status(500).json({ success: false, message });
    }
  }

  async createCourse(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      
      // Verificar autorización
      const isAuthorized = await verifyBarberOwnership(req, res, barberId);
      if (!isAuthorized) return;

      const { title, institution, description, completedAt, duration } = req.body;

      const course = await barberCourseService.createCourse(barberId, {
        title: title.trim(),
        institution: institution?.trim() || undefined,
        description: description?.trim() || undefined,
        completedAt: completedAt ? new Date(completedAt) : undefined,
        duration: duration?.trim() || undefined,
      });

      res.status(201).json({
        success: true,
        data: course,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create course';
      console.error('Error creating course:', error);
      res.status(500).json({ success: false, message });
    }
  }

  async updateCourse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Verificar autorización
      const isAuthorized = await verifyCourseOwnership(req, res, id);
      if (!isAuthorized) return;

      const { title, institution, description, completedAt, duration } = req.body;

      const updatedCourse = await barberCourseService.updateCourse(id, {
        title: title?.trim() || undefined,
        institution: institution?.trim() || undefined,
        description: description?.trim() || undefined,
        completedAt: completedAt ? new Date(completedAt) : undefined,
        duration: duration?.trim() || undefined,
      });

      res.status(200).json({
        success: true,
        data: updatedCourse,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update course';
      console.error('Error updating course:', error);
      res.status(500).json({ success: false, message });
    }
  }

  async deleteCourse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Verificar autorización
      const isAuthorized = await verifyCourseOwnership(req, res, id);
      if (!isAuthorized) return;

      await barberCourseService.deleteCourse(id);

      res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete course';
      console.error('Error deleting course:', error);
      res.status(500).json({ success: false, message });
    }
  }

  // Métodos para manejar media de cursos
  async getCourseMedia(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const media = await barberCourseService.getCourseMedia(courseId);
      res.status(200).json({
        success: true,
        data: media,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get course media';
      res.status(500).json({ success: false, message });
    }
  }

  async createCourseMedia(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      
      // Verificar autorización
      const isAuthorized = await verifyCourseOwnership(req, res, courseId);
      if (!isAuthorized) return;

      const { type, url, thumbnail, caption } = req.body;

      const media = await barberCourseService.createCourseMedia(courseId, {
        type,
        url,
        thumbnail: thumbnail || undefined,
        caption: caption?.trim() || undefined,
      });

      res.status(201).json({
        success: true,
        data: media,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create course media';
      console.error('Error creating course media:', error);
      res.status(500).json({ success: false, message });
    }
  }

  async createMultipleCourseMedia(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { media } = req.body;

      if (!Array.isArray(media) || media.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Media array is required and must not be empty',
        });
        return;
      }

      // Verificar autorización
      const isAuthorized = await verifyCourseOwnership(req, res, courseId);
      if (!isAuthorized) return;

      const createdMedia = await barberCourseService.createMultipleCourseMedia(courseId, media);

      res.status(201).json({
        success: true,
        data: createdMedia,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create course media';
      console.error('Error creating multiple course media:', error);
      res.status(500).json({ success: false, message });
    }
  }

  async updateCourseMedia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Verificar que el media existe
      const media = await barberCourseService.getCourseMediaById(id);
      if (!media) {
        res.status(404).json({
          success: false,
          message: 'Media not found',
        });
        return;
      }

      // Verificar autorización
      const isAuthorized = await verifyCourseOwnership(req, res, media.courseId);
      if (!isAuthorized) return;

      const { caption, thumbnail } = req.body;

      const updatedMedia = await barberCourseService.updateCourseMedia(id, {
        caption: caption?.trim() || undefined,
        thumbnail: thumbnail || undefined,
      });

      res.status(200).json({
        success: true,
        data: updatedMedia,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update course media';
      console.error('Error updating course media:', error);
      res.status(500).json({ success: false, message });
    }
  }

  async deleteCourseMedia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Verificar que el media existe
      const media = await barberCourseService.getCourseMediaById(id);
      if (!media) {
        res.status(404).json({
          success: false,
          message: 'Media not found',
        });
        return;
      }

      // Verificar autorización
      const isAuthorized = await verifyCourseOwnership(req, res, media.courseId);
      if (!isAuthorized) return;

      await barberCourseService.deleteCourseMedia(id);

      res.status(200).json({
        success: true,
        message: 'Course media deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete course media';
      console.error('Error deleting course media:', error);
      res.status(500).json({ success: false, message });
    }
  }

  async getCourseMediaById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const media = await barberCourseService.getCourseMediaById(id);

      if (!media) {
        res.status(404).json({
          success: false,
          message: 'Media not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: media,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get course media';
      res.status(500).json({ success: false, message });
    }
  }
}

export default new BarberCourseController();

