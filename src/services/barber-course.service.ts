import prisma from '../config/prisma';

export class BarberCourseService {
  async getBarberCourses(barberId: string) {
    const courses = await prisma.barberCourse.findMany({
      where: { barberId },
      include: {
        media: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });
    return courses;
  }

  async getCourseById(id: string) {
    const course = await prisma.barberCourse.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    return course;
  }

  async createCourse(barberId: string, data: {
    title: string;
    institution?: string;
    description?: string;
    completedAt?: Date;
    duration?: string;
  }) {
    const course = await prisma.barberCourse.create({
      data: {
        barberId,
        title: data.title,
        institution: data.institution,
        description: data.description,
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
        duration: data.duration,
      },
      include: {
        media: true,
      },
    });
    return course;
  }

  async updateCourse(id: string, data: {
    title?: string;
    institution?: string;
    description?: string;
    completedAt?: Date;
    duration?: string;
  }) {
    const course = await prisma.barberCourse.update({
      where: { id },
      data: {
        title: data.title,
        institution: data.institution,
        description: data.description,
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        duration: data.duration,
      },
      include: {
        media: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    return course;
  }

  async deleteCourse(id: string) {
    // Los media se eliminan automáticamente por CASCADE
    await prisma.barberCourse.delete({
      where: { id },
    });
  }

  // Métodos para manejar media de cursos
  async getCourseMedia(courseId: string) {
    const media = await prisma.barberCourseMedia.findMany({
      where: { courseId },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return media;
  }

  async createCourseMedia(courseId: string, data: {
    type: string;
    url: string;
    thumbnail?: string;
    caption?: string;
  }) {
    const media = await prisma.barberCourseMedia.create({
      data: {
        courseId,
        type: data.type,
        url: data.url,
        thumbnail: data.thumbnail,
        caption: data.caption,
      },
    });
    return media;
  }

  async createMultipleCourseMedia(courseId: string, mediaItems: Array<{
    type: string;
    url: string;
    thumbnail?: string;
    caption?: string;
  }>) {
    const createdMedia = await prisma.$transaction(
      mediaItems.map(item =>
        prisma.barberCourseMedia.create({
          data: {
            courseId,
            type: item.type,
            url: item.url,
            thumbnail: item.thumbnail,
            caption: item.caption,
          },
        })
      )
    );
    return createdMedia;
  }

  async updateCourseMedia(id: string, data: {
    caption?: string;
    thumbnail?: string;
  }) {
    const media = await prisma.barberCourseMedia.update({
      where: { id },
      data: {
        caption: data.caption,
        thumbnail: data.thumbnail,
      },
    });
    return media;
  }

  async deleteCourseMedia(id: string) {
    await prisma.barberCourseMedia.delete({
      where: { id },
    });
  }

  async getCourseMediaById(id: string) {
    const media = await prisma.barberCourseMedia.findUnique({
      where: { id },
    });
    return media;
  }
}

export default new BarberCourseService();

