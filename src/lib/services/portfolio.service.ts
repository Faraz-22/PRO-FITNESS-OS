import prisma from '@/lib/db/prisma';

export interface PublicPortfolioDTO {
  alias: string;
  headline: string | null;
  bio: string | null;
  memberFirstName: string;
  photos: { id: string, url: string | null, type: string }[];
  measurements: { recordedAt: Date, weight: number | null, bodyFat: number | null }[];
}

export class PortfolioService {
  static async publishPortfolio(memberId: string, alias: string, headline?: string, bio?: string) {
    // Upsert the portfolio to ensure it exists and is published
    return prisma.portfolio.upsert({
      where: { memberId },
      create: {
        memberId,
        customUrlAlias: alias,
        headline: headline || null,
        bio: bio || null,
        isPublished: true
      },
      update: {
        customUrlAlias: alias,
        headline: headline || null,
        bio: bio || null,
        isPublished: true
      }
    });
  }

  static async addContentToPortfolio(portfolioId: string, progressPhotoId?: string) {
    return prisma.portfolioContent.create({
      data: {
        portfolioId,
        progressPhotoId: progressPhotoId || null
      }
    });
  }

  /**
   * Retrieves the secure public DTO. NEVER exposes the entire MemberProfile.
   */
  static async getPublicPortfolioByAlias(alias: string): Promise<PublicPortfolioDTO | null> {
    const portfolio = await prisma.portfolio.findUnique({
      where: { customUrlAlias: alias },
      include: {
        member: true,
        content: {
          include: {
            progressPhoto: true
          }
        }
      }
    });

    // Deny-by-default if not explicitly published
    if (!portfolio || !portfolio.isPublished) {
      return null;
    }

    // Explicitly filter photos
    const photos = portfolio.content
      .filter(c => c.progressPhoto && c.progressPhoto.visibility === 'PORTFOLIO')
      .map(c => ({
        id: c.progressPhoto!.id,
        url: c.progressPhoto!.photoUrl, // Assuming authorized pre-signed URL or CDN link
        type: c.progressPhoto!.photoType
      }));

    return {
      alias: portfolio.customUrlAlias!,
      headline: portfolio.headline,
      bio: portfolio.bio,
      memberFirstName: portfolio.member.firstName, // Note: No lastName, no phone, no email
      photos,
      measurements: [] // Assuming explicit measurement content linkages could be added later
    };
  }
}
