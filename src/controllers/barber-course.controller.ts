import { Request, Response } from 'express';
import barberCourseService from '../services/barber-course.service';
import prisma from '../config/prisma';

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
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { barberId } = req.params;
      const { title, institution, description, completedAt, duration } = req.body;

      if (!title || title.trim().length < 3) {
        res.status(400).json({
          success: false,
          message: 'Title is required and must be at least 3 characters',
        });
        return;
      }

      // Verificar que el barbero existe y pertenece al usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const barber = await prisma.barber.findUnique({
        where: { id: barberId },
        select: { email: true },
      });

      if (!barber) {
        res.status(404).json({
          success: false,
          message: 'Barber not found',
        });
        return;
      }

      // Verificar que el usuario es el dueño del barbero
      if (barber.email !== user.email) {
        res.status(403).json({
          success: false,
          message: 'You can only create courses for your own barber profile',
        });
        return;
      }

      const course = await barberCourseService.createCourse(barberId, {
        title: title.trim(),
        institution: institution?.trim(),
        description: description?.trim(),
        completedAt: completedAt ? new Date(completedAt) : undefined,
        duration: duration?.trim(),
      });

      res.status(201).json({
        success: true,
        data: course,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create course';
      res.status(500).json({ success: false, message });
    }
  }

  async updateCourse(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;
      const { title, institution, description, completedAt, duration } = req.body;

      // Verificar que el curso existe y pertenece al usuario
      const course = await barberCourseService.getCourseById(id);
      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      const barber = await prisma.barber.findUnique({
        where: { id: course.barberId },
        select: { email: true },
      });

      if (!user || !barber || barber.email !== user.email) {
        res.status(403).json({
          success: false,
          message: 'You can only update courses for your own barber profile',
        });
        return;
      }

      if (title && title.trim().length < 3) {
        res.status(400).json({
          success: false,
          message: 'Title must be at least 3 characters',
        });
        return;
      }

      const updatedCourse = await barberCourseService.updateCourse(id, {
        title: title?.trim(),
        institution: institution?.trim(),
        description: description?.trim(),
        completedAt: completedAt ? new Date(completedAt) : undefined,
        duration: duration?.trim(),
      });

      res.status(200).json({
        success: true,
        data: updatedCourse,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update course';
      res.status(500).json({ success: false, message });
    }
  }

  async deleteCourse(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;

      // Verificar que el curso existe y pertenece al usuario
      const course = await barberCourseService.getCourseById(id);
      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      const barber = await prisma.barber.findUnique({
        where: { id: course.barberId },
        select: { email: true },
      });

      if (!user || !barber || barber.email !== user.email) {
        res.status(403).json({
          success: false,
          message: 'You can only delete courses for your own barber profile',
        });
        return;
      }

      await barberCourseService.deleteCourse(id);

      res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete course';
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
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { courseId } = req.params;
      const { type, url, thumbnail, caption } = req.body;

      if (!type || !url) {
        res.status(400).json({
          success: false,
          message: 'Type and URL are required',
        });
        return;
      }

      // Verificar que el curso existe y pertenece al usuario
      const course = await barberCourseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      const barber = await prisma.barber.findUnique({
        where: { id: course.barberId },
        select: { email: true },
      });

      if (!user || !barber || barber.email !== user.email) {
        res.status(403).json({
          success: false,
          message: 'You can only add media to your own courses',
        });
        return;
      }

      const media = await barberCourseService.createCourseMedia(courseId, {
        type,
        url,
        thumbnail,
        caption,
      });

      res.status(201).json({
        success: true,
        data: media,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create course media';
      res.status(500).json({ success: false, message });
    }
  }

  async createMultipleCourseMedia(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { courseId } = req.params;
      const { media } = req.body;

      if (!Array.isArray(media) || media.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Media array is required',
        });
        return;
      }

      // Verificar que el curso existe y pertenece al usuario
      const course = await barberCourseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      const barber = await prisma.barber.findUnique({
        where: { id: course.barberId },
        select: { email: true },
      });

      if (!user || !barber || barber.email !== user.email) {
        res.status(403).json({
          success: false,
          message: 'You can only add media to your own courses',
        });
        return;
      }

      const createdMedia = await barberCourseService.createMultipleCourseMedia(courseId, media);

      res.status(201).json({
        success: true,
        data: createdMedia,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create course media';
      res.status(500).json({ success: false, message });
    }
  }

  async updateCourseMedia(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;
      const { caption, thumbnail } = req.body;

      // Verificar que el media existe y pertenece a un curso del usuario
      const media = await barberCourseService.getCourseMediaById(id);
      if (!media) {
        res.status(404).json({
          success: false,
          message: 'Media not found',
        });
        return;
      }

      const course = await barberCourseService.getCourseById(media.courseId);
      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      const barber = await prisma.barber.findUnique({
        where: { id: course.barberId },
        select: { email: true },
      });

      if (!user || !barber || barber.email !== user.email) {
        res.status(403).json({
          success: false,
          message: 'You can only update media for your own courses',
        });
        return;
      }

      const updatedMedia = await barberCourseService.updateCourseMedia(id, {
        caption,
        thumbnail,
      });

      res.status(200).json({
        success: true,
        data: updatedMedia,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update course media';
      res.status(500).json({ success: false, message });
    }
  }

  async deleteCourseMedia(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;

      // Verificar que el media existe y pertenece a un curso del usuario
      const media = await barberCourseService.getCourseMediaById(id);
      if (!media) {
        res.status(404).json({
          success: false,
          message: 'Media not found',
        });
        return;
      }

      const course = await barberCourseService.getCourseById(media.courseId);
      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      const barber = await prisma.barber.findUnique({
        where: { id: course.barberId },
        select: { email: true },
      });

      if (!user || !barber || barber.email !== user.email) {
        res.status(403).json({
          success: false,
          message: 'You can only delete media from your own courses',
        });
        return;
      }

      await barberCourseService.deleteCourseMedia(id);

      res.status(200).json({
        success: true,
        message: 'Course media deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete course media';
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

