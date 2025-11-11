import prisma from '../config/prisma';

export class BarberMediaService {
  async getBarberMedia(barberId: string) {
    const media = await prisma.barberMedia.findMany({
      where: { barberId },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return media;
  }

  async createMedia(barberId: string, data: {
    type: string;
    url: string;
    thumbnail?: string;
    caption?: string;
  }) {
    const media = await prisma.barberMedia.create({
      data: {
        barberId,
        type: data.type,
        url: data.url,
        thumbnail: data.thumbnail,
        caption: data.caption,
      },
    });
    return media;
  }

  async createMultipleMedia(barberId: string, mediaItems: Array<{
    type: string;
    url: string;
    thumbnail?: string;
    caption?: string;
  }>) {
    const createdMedia = await prisma.$transaction(
      mediaItems.map(item =>
        prisma.barberMedia.create({
          data: {
            barberId,
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

  async updateMedia(id: string, data: {
    caption?: string;
    thumbnail?: string;
  }) {
    const media = await prisma.barberMedia.update({
      where: { id },
      data: {
        caption: data.caption,
        thumbnail: data.thumbnail,
      },
    });
    return media;
  }

  async deleteMedia(id: string) {
    await prisma.barberMedia.delete({
      where: { id },
    });
  }

  async getMediaById(id: string) {
    const media = await prisma.barberMedia.findUnique({
      where: { id },
    });
    return media;
  }
}

export default new BarberMediaService();
