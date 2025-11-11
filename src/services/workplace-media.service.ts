import prisma from '../config/prisma';

export class WorkplaceMediaService {
  async getWorkplaceMedia(workplaceId: string) {
    const media = await prisma.workplaceMedia.findMany({
      where: { workplaceId },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return media;
  }

  async createMedia(workplaceId: string, data: {
    type: string;
    url: string;
    thumbnail?: string;
    caption?: string;
  }) {
    const media = await prisma.workplaceMedia.create({
      data: {
        workplaceId,
        type: data.type,
        url: data.url,
        thumbnail: data.thumbnail,
        caption: data.caption,
      },
    });
    return media;
  }

  async createMultipleMedia(workplaceId: string, mediaItems: Array<{
    type: string;
    url: string;
    thumbnail?: string;
    caption?: string;
  }>) {
    const createdMedia = await prisma.$transaction(
      mediaItems.map(item =>
        prisma.workplaceMedia.create({
          data: {
            workplaceId,
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
    const media = await prisma.workplaceMedia.update({
      where: { id },
      data: {
        caption: data.caption,
        thumbnail: data.thumbnail,
      },
    });
    return media;
  }

  async deleteMedia(id: string) {
    await prisma.workplaceMedia.delete({
      where: { id },
    });
  }

  async getMediaById(id: string) {
    const media = await prisma.workplaceMedia.findUnique({
      where: { id },
    });
    return media;
  }
}

export default new WorkplaceMediaService();


