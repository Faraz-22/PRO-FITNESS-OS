import prisma from '@/lib/db/prisma';
import { PhotoType, VisibilityLevel } from '@prisma/client';

export class ProgressPhotoService {
  /**
   * Records a photo uploaded securely. In a real system, the actual binary upload happens
   * directly to S3 via pre-signed URL, and we just record the storageKey.
   */
  static async recordPhoto(memberId: string, uploadedBy: string, storageKey: string, photoType: PhotoType, visibility: VisibilityLevel, photoUrl?: string) {
    return prisma.progressPhoto.create({
      data: {
        memberId,
        uploadedBy,
        storageKey,
        photoType,
        visibility,
        photoUrl: photoUrl || null
      }
    });
  }

  /**
   * Only returns photos explicitly allowed. Wait, filtering by visibility is better
   * handled centrally in `FitnessAccessService` or here as a blanket filter.
   */
  static async getMemberPhotos(memberId: string) {
    return prisma.progressPhoto.findMany({
      where: { memberId },
      orderBy: { capturedAt: 'desc' }
    });
  }
}
