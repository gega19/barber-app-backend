import { Request, Response } from 'express';
import prisma from '../config/prisma';

/**
 * Verifica que el usuario autenticado es el dueño del barbero especificado
 * @param req Request object
 * @param res Response object
 * @param barberId ID del barbero a verificar
 * @returns true si el usuario es el dueño, false en caso contrario
 */
export async function verifyBarberOwnership(
  req: Request,
  res: Response,
  barberId: string
): Promise<boolean> {
  const userId = req.user?.userId;
  
  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return false;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return false;
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
      return false;
    }

    if (barber.email !== user.email) {
      res.status(403).json({
        success: false,
        message: 'You can only perform this action on your own barber profile',
      });
      return false;
    }

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify ownership';
    res.status(500).json({ success: false, message });
    return false;
  }
}

/**
 * Verifica que el usuario autenticado es el dueño del curso especificado
 * @param req Request object
 * @param res Response object
 * @param courseId ID del curso a verificar
 * @returns true si el usuario es el dueño, false en caso contrario
 */
export async function verifyCourseOwnership(
  req: Request,
  res: Response,
  courseId: string
): Promise<boolean> {
  const userId = req.user?.userId;
  
  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return false;
  }

  try {
    const course = await prisma.barberCourse.findUnique({
      where: { id: courseId },
      select: { barberId: true },
    });

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found',
      });
      return false;
    }

    return await verifyBarberOwnership(req, res, course.barberId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify course ownership';
    res.status(500).json({ success: false, message });
    return false;
  }
}

